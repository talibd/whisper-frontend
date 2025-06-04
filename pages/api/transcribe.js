 import fs from "fs";
 import path from "path";
// import { IncomingForm } from "formidable";
import formidable from "formidable"; // Corrected import
 import OpenAI from "openai";
 import { v4 as uuidv4 } from "uuid";
 import { exec } from "child_process";
 import util from "util"; // Needed for promisify

const execPromise = util.promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY , // It's better to use environment variables
});

export const config = {
  api: {
    bodyParser: false, // Required for formidable to parse multipart/form-data
  },
};

function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

  
 
   // 1) Parse the multipart/form-data with formidable

function getFFmpegEscapedPath(filePath) {
  let p = path.resolve(filePath);
  if (process.platform === 'win32') {
    p = p.replace(/\\/g, '/');
    p = p.replace(/:/g, '\\:');
  }
  return p;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
 
  const form = formidable({
    uploadDir: path.join(process.cwd(), "public", "uploads"),
    keepExtensions: true,
    filename: (name, ext) => { // Simpler filename generation for formidable v3+
      return `${uuidv4()}${ext}`;
    },
  });

    // Make sure the /public/uploads directory exists
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  let inputVideoPath; 

  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve([fields, files]);
      });
    });
 
     try {
       // Extract the uploaded file and optional language
      const uploadedFileArray = files.file; // formidable might return an array
      const languageFieldArray = fields.language;
 

      if (!uploadedFileArray || uploadedFileArray.length === 0) {
         return res.status(400).json({ error: "No file was uploaded." });
       }
 
      const fileObj = uploadedFileArray[0];
      inputVideoPath = fileObj.filepath; // Path to the originally uploaded video
      // const originalFilename = fileObj.originalFilename; // Available if needed

      const language = languageFieldArray && languageFieldArray.length > 0 ? String(languageFieldArray[0]).trim() : "";
 
       // 2) Call OpenAI transcription
     const fileStream = fs.createReadStream(inputVideoPath);
 
       const transcriptionParams = {
         file: fileStream,
         model: "whisper-1",
        response_format: "verbose_json",
       };

      if (language) {
        transcriptionParams.language = language;
      }
 
       const transcriptionResponse =
         await openai.audio.transcriptions.create(transcriptionParams);
 
       const transcriptText = transcriptionResponse.text;
      const detectedLanguage = transcriptionResponse.language;
 
      // 3) Generate VTT content
       let vttContent = "WEBVTT\n\n";
       transcriptionResponse.segments.forEach((segment) => {
         vttContent += `${formatTimestamp(segment.start)} --> ${formatTimestamp(segment.end)}\n`;
         vttContent += `${segment.text.trim()}\n\n`;
       });
 
      // 4) Save VTT file
      const videoId = path.basename(inputVideoPath, path.extname(inputVideoPath));
       const subtitleFilename = `${videoId}.vtt`;
      const subtitlePath = path.join(path.dirname(inputVideoPath), subtitleFilename);
       await fs.promises.writeFile(subtitlePath, vttContent);
 
      // 5) Burn subtitles into video using FFmpeg
      const outputVideoFilename = `${videoId}_subtitled${path.extname(inputVideoPath)}`;
      const outputVideoPath = path.join(path.dirname(inputVideoPath), outputVideoFilename);
      
      const escapedSubtitlePathForFilter = getFFmpegEscapedPath(subtitlePath);
      const ffmpegCommand = `ffmpeg -y -i "${inputVideoPath}" -vf "subtitles=filename='${escapedSubtitlePathForFilter}'" -c:a copy "${outputVideoPath}"`;
      
      console.log("Executing FFmpeg command:", ffmpegCommand);
 

      try {
        const { stdout, stderr } = await execPromise(ffmpegCommand);
        console.log("FFmpeg stdout:", stdout);
        if (stderr) console.warn("FFmpeg stderr:", stderr);

        // 6) Return JSON with transcript and the *new* video filename
        res.status(200).json({
          text: transcriptText,
          videoFilename: outputVideoFilename, // This is the new video with hardcoded subs
          detectedLanguage: detectedLanguage,
        });
      } catch (ffmpegError) {
        console.error("FFmpeg execution error:", ffmpegError);
        // Attempt to clean up intermediate files if FFmpeg fails
        await fs.promises.unlink(subtitlePath).catch(e => console.error("Failed to cleanup VTT file after FFmpeg error:", e));
        // outputVideoPath might not exist or be partial, attempt cleanup
        await fs.promises.unlink(outputVideoPath).catch(() => {}); // Ignore error if file doesn't exist
        throw ffmpegError; // Re-throw to be caught by the outer try-catch
      } finally {
        // 7) Clean up original uploaded video and VTT file
        // Only delete original inputVideoPath if outputVideoPath was successfully created
        if (fs.existsSync(outputVideoPath)) {
            await fs.promises.unlink(inputVideoPath).catch(e => console.error("Failed to cleanup original video:", e));
        }
        await fs.promises.unlink(subtitlePath).catch(e => console.error("Failed to cleanup VTT file:", e));
      }

     } catch (openaiErr) {
       console.error("⚠️ OpenAI Error:", openaiErr);
      // If inputVideoPath exists (file was uploaded before OpenAI error), clean it up
      if (inputVideoPath && fs.existsSync(inputVideoPath)) {
        await fs.promises.unlink(inputVideoPath).catch(e => console.error("Failed to cleanup uploaded file after OpenAI error:", e));
      }
      res.status(500).json({ error: "Transcription failed. See server logs." });
     }

  } catch (err) {
    // This catches errors from formidable.parse or if no file was uploaded before OpenAI call
    console.error("⚠️ Form parsing or initial file error:", err);
    // If inputVideoPath was set and file exists (e.g. form.parse succeeded but subsequent logic failed before OpenAI)
    if (inputVideoPath && fs.existsSync(inputVideoPath)) {
        await fs.promises.unlink(inputVideoPath).catch(e => console.error("Failed to cleanup uploaded file on general error:", e));
    }
    res.status(500).json({ error: "File processing error. See server logs." });
  }

}
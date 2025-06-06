"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [words, setWords] = useState<any[]>([]); // <-- Add this line
  const [brollImages, setBrollImages] = useState<{ [kw: string]: string | null }>({});
  const [brollError, setBrollError] = useState<string | null>(null);
  const baseUrl = "https://pxj8ogw1rd5z6b-8080.proxy.runpod.net"

  // Step 1: Transcribe
  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    if (language) formData.append("language", language);

    try {
      setLoading(true);
      setTranscript("");
      setVideoUrl("");
      setKeywords([]);
      setWords([]); // <-- Reset words
      const response = await axios.post(`${baseUrl}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTranscript(response.data.text);
      setWords(response.data.words || []);
      // <-- Store words
    } catch (err) {
      alert("Transcription failed. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  
  // Step 2: Extract Keywords (optional)
  const handleExtractKeywords = async () => {
    if (!transcript) return;
    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}/extract-keywords`, {
        transcript,
      });
      setKeywords(response.data.keywords);
    } catch (err) {
      alert("Keyword extraction failed.");
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate Video
  const handleGenerateVideo = async () => {
    if (!file || !transcript) return alert("Transcript and file required");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("transcript", transcript);

    const wordsWithImages = words.map(w => {
      const matchedKeyword = keywords.find(
        kw => w.text.toLowerCase() === kw.toLowerCase()
      );
      return matchedKeyword && brollImages[matchedKeyword]
        ? { ...w, image: brollImages[matchedKeyword] }
        : w;
    });

    // Then send wordsWithImages instead of words:
    formData.append("words", JSON.stringify(wordsWithImages));
    formData.append("keywords", JSON.stringify(keywords));
    formData.append("broll_images", JSON.stringify(brollImages));

    try {
      setLoading(true);
      const response = await axios.post(`${baseUrl}/generate-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setVideoUrl(`${baseUrl}/download-video/${response.data.video_filename}`);
    } catch (err) {
      alert("Video generation failed. Check console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // console.log(words);

  const handleFetchBroll = async () => {
    if (!keywords.length) return;
    try {
      setLoading(true);
      setBrollError(null);
      const response = await axios.post(`${baseUrl}/broll-images`, {
        keywords,
      });
      setBrollImages(response.data.images);
      if (response.data.access_token_invalid) {
        setBrollError("The access token is invalid. Please check your Unsplash API key.");
      } else if (response.data.errors && response.data.errors.length > 0) {
        setBrollError(
          `Could not fetch images for: ${response.data.errors.join(", ")}`
        );
      }
    } catch (err) {
      setBrollError("Failed to fetch B-roll images. Please try again.");
      setBrollImages({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">🎙️ Video Subtitle Generator</h1>

        {/* Step 1: Upload & Transcribe */}
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 text-black"
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mb-4 p-2 border rounded w-full text-black"
        >
          <option value="">Auto-detect language</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ar">Arabic</option>
        </select>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Processing..." : "Upload & Transcribe"}
        </button>

        {/* Step 2: Show transcript and keyword extraction */}
        {transcript && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">📝 Transcript:</h2>
            <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{transcript}</pre>

            <button
              onClick={handleExtractKeywords}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 mt-2"
            >
              {loading ? "Extracting..." : "Extract Keywords"}
            </button>

            {keywords.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Extracted Keywords:</h3>
                <ul className="list-disc ml-6">
                  {keywords.map((kw, idx) => (
                    <li key={idx} className="bg-blue-100 rounded px-2 py-1 my-1 inline-block mr-2">{kw}</li>
                  ))}
                </ul>

                <button
                  onClick={handleFetchBroll}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  Fetch B-roll Images
                </button>
                {brollError && (
                  <div className="text-red-600 mt-2">{brollError}</div>
                )}
                <div className="flex flex-wrap gap-4 mt-4">
                  {Object.entries(brollImages).map(([kw, url]) =>
                    url ? (
                      <div key={kw} className="flex flex-col items-center">
                        <img src={url} alt={kw} className="w-40 h-24 object-cover rounded" />
                        <span className="mt-2 text-xs">{kw}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Generate Video */}
            <button
              onClick={handleGenerateVideo}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4"
            >
              {loading ? "Generating Video..." : "Generate Video with Subtitles"}
            </button>
          </div>
        )}

        {/* Show video if available */}
        {videoUrl && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">📥 Subtitled Video:</h2>
            <a
              href={videoUrl}
              download
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download Video
            </a>
            <video
              src={videoUrl}
              controls
              className="mt-4 w-full rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

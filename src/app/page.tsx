"use client";

import { useState } from "react";
import axios from "axios";

interface Word {
  text: string;
  start: number;
  end: number;
}

interface Segment {
  text: string;
  start: number;
  end: number;
}

interface BrollImages {
  [keyword: string]: string | null;
}

interface SubtitlePreview {
  text: string;
  start: number;
  end: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [brollImages, setBrollImages] = useState<BrollImages>({});
  const [brollError, setBrollError] = useState<string | null>(null);
  const [wordsPerSubtitle, setWordsPerSubtitle] = useState<number>(5); // Changed default to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  
  // Updated to match your backend structure
  const baseUrl = "https://aivideo-production-2603.up.railway.app";
  // const baseUrl = "http://localhost:8080";


  // Clear error when starting new action
  const clearError = () => setError(null);

  // Step 1: Transcribe
  const handleUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    if (language) formData.append("language", language);

    try {
      setLoading(true);
      clearError();
      setTranscript("");
      setVideoUrl("");
      setKeywords([]);
      setWords([]);
      setSegments([]);
      setBrollImages({});
      setBrollError(null);
      
      const response = await axios.post(`${baseUrl}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes for large files
      });

      setTranscript(response.data.text);
      setWords(response.data.words || []);
      setSegments(response.data.segments || []);
      setCurrentStep(2);
      
      console.log("Transcription successful:");
      console.log("- Words:", response.data.words?.length || 0);
      console.log("- Segments:", response.data.segments?.length || 0);
      console.log("- Language detected:", response.data.language);
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Transcription failed";
      setError(`Transcription failed: ${errorMsg}`);
      console.error("Transcription error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: Extract Keywords
  const handleExtractKeywords = async () => {
    if (!transcript) return;
    try {
      setLoading(true);
      clearError();
      
      const response = await axios.post(`${baseUrl}/extract-keywords`, {
        transcript,
      });
      
      setKeywords(response.data.keywords);
      setCurrentStep(3);
      console.log("Keywords extracted:", response.data.keywords);
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Keyword extraction failed";
      setError(`Keyword extraction failed: ${errorMsg}`);
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Fetch B-roll Images
  const handleFetchBroll = async () => {
    if (!keywords.length) return;
    try {
      setLoading(true);
      clearError();
      setBrollError(null);
      
      const response = await axios.post(`${baseUrl}/broll-images`, {
        keywords,
      });
      
      setBrollImages(response.data.images);
      setCurrentStep(4);
      console.log("B-roll images fetched:", response.data.images);
      
      if (response.data.access_token_invalid) {
        setBrollError("The Unsplash access token is invalid. Please check your API key in the backend .env file.");
      } else if (response.data.errors && response.data.errors.length > 0) {
        setBrollError(
          `Could not fetch images for: ${response.data.errors.join(", ")}`
        );
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Failed to fetch B-roll images";
      setBrollError(errorMsg);
      setBrollImages({});
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Generate Video
  const handleGenerateVideo = async () => {
    if (!file || !transcript) return alert("Transcript and file required");
    
    console.log("Generating video with:");
    console.log("- Words count:", words.length);
    console.log("- Keywords:", keywords);
    console.log("- B-roll images:", Object.keys(brollImages).filter(k => brollImages[k]));
    console.log("- Words per subtitle:", wordsPerSubtitle);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("transcript", transcript);
    formData.append("words", JSON.stringify(words));
    formData.append("keywords", JSON.stringify(keywords));
    formData.append("broll_images", JSON.stringify(brollImages));
    formData.append("words_per_subtitle", wordsPerSubtitle.toString());

    try {
      setLoading(true);
      clearError();
      
      const response = await axios.post(`${baseUrl}/generate-video`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10 minutes for video processing
      });
      
      setVideoUrl(`${baseUrl}/download-video/${response.data.video_filename}`);
      setCurrentStep(5);
      console.log("Video generation successful:", response.data.video_filename);
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Video generation failed";
      setError(`Video generation failed: ${errorMsg}`);
      console.error("Video generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Preview subtitle segments based on current settings
  const getSubtitlePreview = (): SubtitlePreview[] => {
    if (!words.length || wordsPerSubtitle <= 0) return [];
    
    const preview: SubtitlePreview[] = [];
    const maxPreview = Math.min(words.length, wordsPerSubtitle * 3); // Show first 3 groups max
    
    for (let i = 0; i < maxPreview; i += wordsPerSubtitle) {
      const group = words.slice(i, i + wordsPerSubtitle);
      const text = group.map(w => w.text).join(' ');
      const start = group[0]?.start || 0;
      const end = group[group.length - 1]?.end || 0;
      preview.push({ text, start, end });
    }
    return preview;
  };

  // Calculate statistics
  const getVideoStats = () => {
    const totalImages = Object.values(brollImages).filter(Boolean).length;
    const totalKeywords = keywords.length;
    const estimatedLines = Math.ceil(words.length / wordsPerSubtitle);
    const videoDuration = words.length > 0 ? words[words.length - 1].end : 0;
    
    return { totalImages, totalKeywords, estimatedLines, videoDuration };
  };

  const stats = getVideoStats();

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">🎙️ AI Video Subtitle Generator</h1>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-16 h-1 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Upload</span>
            <span>Keywords</span>
            <span>B-roll</span>
            <span>Generate</span>
            <span>Download</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 font-semibold">❌ Error:</span>
              <span className="ml-2 text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Upload & Transcribe */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">📤 Step 1: Upload & Transcribe</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Audio/Video File:</label>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-black border border-gray-300 rounded p-2"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language (optional):</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-black"
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
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Upload & Transcribe"}
          </button>

          {/* Debug Information */}
          {words.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-sm text-green-700">
                ✅ Transcription complete: {words.length} words, {segments.length} segments
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Show transcript and extract keywords */}
        {transcript && (
          <div className="mb-8 p-6 bg-orange-50 border border-orange-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">📝 Step 2: Transcript & Keywords</h2>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Transcript:</h3>
              <pre className="bg-white p-4 rounded border whitespace-pre-wrap max-h-40 overflow-y-auto text-sm">
                {transcript}
              </pre>
            </div>

            <button
              onClick={handleExtractKeywords}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Extracting..." : "Extract Keywords"}
            </button>

            {keywords.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Extracted Keywords:</h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw, idx) => (
                    <span key={idx} className="bg-orange-100 rounded px-3 py-1 text-sm font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: B-roll Images */}
        {keywords.length > 0 && (
          <div className="mb-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🖼️ Step 3: B-roll Images</h2>
            
            <button
              onClick={handleFetchBroll}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Fetching..." : "Fetch B-roll Images"}
            </button>
            
            {brollError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 text-sm">{brollError}</p>
              </div>
            )}
            
            {Object.keys(brollImages).length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-3">B-roll Images Preview:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(brollImages).map(([kw, url]) =>
                    url ? (
                      <div key={kw} className="text-center">
                        <img 
                          src={url} 
                          alt={kw} 
                          className="w-full h-20 object-cover rounded mb-1 border" 
                        />
                        <span className="text-xs font-medium text-green-600">{kw}</span>
                      </div>
                    ) : (
                      <div key={kw} className="text-center">
                        <div className="w-full h-20 bg-gray-200 rounded mb-1 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                        <span className="text-xs text-red-500">{kw}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Subtitle Settings & Video Generation */}
        {words.length > 0 && (
          <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">⚙️ Step 4: Subtitle Settings & Generation</h2>
            
            {/* Subtitle Settings */}
            <div className="mb-6 p-4 bg-white rounded border">
              <h3 className="font-semibold mb-3">Subtitle Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Words per subtitle line:
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={wordsPerSubtitle}
                      onChange={(e) => setWordsPerSubtitle(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="bg-blue-100 px-3 py-1 rounded font-medium min-w-[80px] text-center">
                      {wordsPerSubtitle} words
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Recommended: 3-7 words for better readability
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quick presets:
                  </label>
                  <div className="flex space-x-2">
                    {[
                      { label: "Short", value: 3 },
                      { label: "Medium", value: 5 },
                      { label: "Long", value: 7 },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setWordsPerSubtitle(value)}
                        className={`px-3 py-1 rounded text-sm ${
                          wordsPerSubtitle === value
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {label} ({value})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtitle Preview */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Preview (first 3 subtitle lines):</h4>
                <div className="bg-black rounded p-3 space-y-2 max-h-32 overflow-y-auto">
                  {getSubtitlePreview().map((sub, idx) => (
                    <div key={idx} className="text-white text-center text-sm">
                      <div className="text-xs text-gray-400">
                        {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                      </div>
                      <div>{sub.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Statistics */}
            <div className="mb-4 p-4 bg-white rounded border">
              <h4 className="font-semibold mb-2">Video Generation Summary:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{stats.estimatedLines}</div>
                  <div className="text-gray-600">Subtitle Lines</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{stats.totalImages}</div>
                  <div className="text-gray-600">B-roll Images</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-orange-600">{stats.totalKeywords}</div>
                  <div className="text-gray-600">Keywords</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{stats.videoDuration.toFixed(1)}s</div>
                  <div className="text-gray-600">Duration</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
            >
              {loading ? "Generating Video..." : "🎬 Generate Video with B-roll & Subtitles"}
            </button>
          </div>
        )}

        {/* Step 5: Download Video */}
        {videoUrl && (
          <div className="mb-8 p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🎉 Step 5: Your Video is Ready!</h2>
            
            <div className="mb-4">
              <a
                href={videoUrl}
                download
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 font-semibold"
              >
                📥 Download Video
              </a>
            </div>
            
            <div className="bg-white rounded border p-2">
              <video
                src={videoUrl}
                controls
                className="w-full max-w-2xl mx-auto rounded shadow-lg"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>Powered by OpenAI Whisper, GPT-4, Unsplash, and FFmpeg</p>
        </div>
      </div>
    </div>
  );
}
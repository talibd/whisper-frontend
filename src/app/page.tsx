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
  const [words, setWords] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [brollImages, setBrollImages] = useState<{ [kw: string]: string | null }>({});
  const [brollError, setBrollError] = useState<string | null>(null);
  const [wordsPerSubtitle, setWordsPerSubtitle] = useState<number>(7); // New state for words per subtitle
  const baseUrl = "http://localhost:8080"

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
      setWords([]);
      setSegments([]);
      const response = await axios.post(`${baseUrl}/transcribe`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTranscript(response.data.text);
      setWords(response.data.words || []);
      setSegments(response.data.segments || []);
      
      console.log("Words received:", response.data.words?.length || 0);
      console.log("Segments received:", response.data.segments?.length || 0);
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
      console.log("Keywords extracted:", response.data.keywords);
    } catch (err) {
      alert("Keyword extraction failed.");
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate Video - Enhanced with words per subtitle
  const handleGenerateVideo = async () => {
    if (!file || !transcript) return alert("Transcript and file required");
    
    console.log("Generating video with:");
    console.log("- Words count:", words.length);
    console.log("- Keywords:", keywords);
    console.log("- B-roll images:", Object.keys(brollImages));
    console.log("- Words per subtitle:", wordsPerSubtitle);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("transcript", transcript);
    formData.append("words", JSON.stringify(words));
    formData.append("keywords", JSON.stringify(keywords));
    formData.append("broll_images", JSON.stringify(brollImages));
    formData.append("words_per_subtitle", wordsPerSubtitle.toString()); // Add words per subtitle
    
    // Also send segments if available
    if (segments.length > 0) {
      formData.append("transcribed_segments", JSON.stringify(segments));
    }

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

  const handleFetchBroll = async () => {
    if (!keywords.length) return;
    try {
      setLoading(true);
      setBrollError(null);
      const response = await axios.post(`${baseUrl}/broll-images`, {
        keywords,
      });
      setBrollImages(response.data.images);
      console.log("B-roll images fetched:", response.data.images);
      
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

  // Preview subtitle segments based on current settings
  const getSubtitlePreview = () => {
    if (!words.length || wordsPerSubtitle <= 0) return [];
    
    const preview = [];
    for (let i = 0; i < Math.min(words.length, 21); i += wordsPerSubtitle) { // Show first 3 groups max
      const group = words.slice(i, i + wordsPerSubtitle);
      const text = group.map(w => w.text).join(' ');
      const start = group[0]?.start || 0;
      const end = group[group.length - 1]?.end || 0;
      preview.push({ text, start, end });
    }
    return preview;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">🎙️ Video Subtitle Generator</h1>

        {/* Step 1: Upload & Transcribe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Audio/Video File:</label>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-black border border-gray-300 rounded p-2"
            />
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
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Upload & Transcribe"}
        </button>

        {/* Debug Information */}
        {words.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              ✅ Word-level timing available: {words.length} words
            </p>
          </div>
        )}

        {/* Step 2: Show transcript and settings */}
        {transcript && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">📝 Transcript:</h2>
            <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap max-h-40 overflow-y-auto text-sm">{transcript}</pre>

            {/* Subtitle Settings */}
            {words.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-lg mb-3">⚙️ Subtitle Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Words per subtitle line:
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={wordsPerSubtitle}
                        onChange={(e) => setWordsPerSubtitle(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="bg-blue-100 px-3 py-1 rounded font-medium">
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
                      <button
                        onClick={() => setWordsPerSubtitle(3)}
                        className={`px-3 py-1 rounded text-sm ${wordsPerSubtitle === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Short (3)
                      </button>
                      <button
                        onClick={() => setWordsPerSubtitle(5)}
                        className={`px-3 py-1 rounded text-sm ${wordsPerSubtitle === 5 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Medium (5)
                      </button>
                      <button
                        onClick={() => setWordsPerSubtitle(7)}
                        className={`px-3 py-1 rounded text-sm ${wordsPerSubtitle === 7 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Long (7)
                      </button>
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
            )}

            <div className="mt-4">
              <button
                onClick={handleExtractKeywords}
                disabled={loading}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? "Extracting..." : "Extract Keywords"}
              </button>
            </div>

            {keywords.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Extracted Keywords:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((kw, idx) => (
                    <span key={idx} className="bg-blue-100 rounded px-2 py-1 inline-block text-sm">
                      {kw}
                    </span>
                  ))}
                </div>

                <button
                  onClick={handleFetchBroll}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mt-3 disabled:opacity-50"
                >
                  {loading ? "Fetching..." : "Fetch B-roll Images"}
                </button>
                
                {brollError && (
                  <div className="text-red-600 mt-2 text-sm">{brollError}</div>
                )}
                
                {Object.keys(brollImages).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">B-roll Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(brollImages).map(([kw, url]) =>
                        url ? (
                          <div key={kw} className="text-center">
                            <img src={url} alt={kw} className="w-full h-20 object-cover rounded mb-1" />
                            <span className="text-xs font-medium">{kw}</span>
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

            {/* Step 3: Generate Video */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <h3 className="font-semibold text-green-800 mb-2">🎬 Ready to Generate Video</h3>
              <div className="text-sm text-green-700 mb-3 space-y-1">
                <p>✓ B-roll images will appear exactly when keywords are spoken</p>
                <p>✓ Subtitles will show {wordsPerSubtitle} words per line</p>
                <p>✓ Total estimated subtitle lines: {Math.ceil(words.length / wordsPerSubtitle)}</p>
              </div>
              <button
                onClick={handleGenerateVideo}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Generating Video..." : "Generate Video with B-roll & Subtitles"}
              </button>
            </div>
          </div>
        )}

        {/* Show video if available */}
        {videoUrl && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">📥 Generated Video:</h2>
            <a
              href={videoUrl}
              download
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
            >
              Download Video
            </a>
            <video
              src={videoUrl}
              controls
              className="w-[50%] rounded shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
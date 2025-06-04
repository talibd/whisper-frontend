'use client';

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState(""); // optional
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoFilename, setVideoFilename] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");



  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setTranscript("");
    setVideoFilename("");
    setDetectedLanguage("");

    const formData = new FormData();
    formData.append("file", file);
    if (language) {
      formData.append("language", language);
    }

    try {
      // 1) Call our Next.js API route
      const res = await axios.post("/api/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Expecting { text: string, videoFilename: string }
      setTranscript(res.data.text);
      setVideoFilename(res.data.videoFilename);
      setDetectedLanguage(res.data.detectedLanguage);
    } catch (err) {
      console.error(err);
      alert("Transcription failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Whisper Transcriber</h1>

      <input
        type="file"
        accept="video/mp4,audio/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Language (optional)</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border p-2 rounded w-full max-w-xs"
        >
          <option className="text-black" value="">
            Auto Detect
          </option>
          <option className="text-black" value="en">
            English
          </option>
          <option className="text-black" value="hi">
            Hindi
          </option>
          <option className="text-black" value="es">
            Spanish
          </option>
          <option className="text-black" value="fr">
            French
          </option>
          <option className="text-black" value="ar">
            Arabic
          </option>
          <option className="text-black" value="zh">
            Chinese
          </option>
          {/* Add more languages as needed */}
        </select>
      </div>

      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        Transcribe
      </button>

      {loading && <p className="mt-4">Transcribing...</p>}

      <div className="flex flex-col md:flex-row justify-between items-start mt-4 gap-8">
        {transcript && (
          <div className="mt-6 w-full md:w-1/2">
            <h2 className="font-semibold">Transcript:</h2>
            {detectedLanguage && <p className="text-sm text-gray-600 mb-2">Detected Language: {detectedLanguage.toUpperCase()}</p>}
            <pre className="bg-gray-100 whitespace-break-spaces text-black p-4 rounded">
              {transcript}
            </pre>
          </div>
        )}

        {videoFilename && (
          <div className="w-full md:w-1/2 flex flex-col items-center mt-6 md:mt-0">
            {/* NOTE: We’re fetching from our Next.js API route instead of Flask */}
            <video
              src={`/api/download-video/${videoFilename}`}
              controls
              width={400}
            >
            
            
            </video>
            <a
              href={`/api/download-video/${videoFilename}`}
              className="text-blue-600 underline"
              download
            >
              Download
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

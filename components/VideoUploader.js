import { useState } from 'react';

export default function VideoUploader({ onSubtitlesGenerated }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!video) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('video', video);

    const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
    const data = await res.json();
    onSubtitlesGenerated(data.srt, data.filePath);

    setLoading(false);
  };

  return (
    <div className="p-4 bg-white shadow rounded-xl max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
      <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} className="mb-4" />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Generate Subtitles'}
      </button>
    </div>
  );
}

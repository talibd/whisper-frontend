export default function SubtitlesPreview({ srt }) {
  return (
    <div className="mt-8 p-4 bg-gray-100 rounded-xl max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Subtitles (SRT Format)</h2>
      <textarea readOnly value={srt} className="w-full h-60 p-3 bg-white rounded border border-gray-300" />
      <a
        href={`data:text/plain;charset=utf-8,${encodeURIComponent(srt)}`}
        download="subtitles.srt"
        className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Download .srt
      </a>
    </div>
  );
}

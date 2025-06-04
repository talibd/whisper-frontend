// pages/api/download-subtitle/[filename].js

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const {
    query: { filename },
  } = req;

  if (!filename || typeof filename !== 'string' || !filename.endsWith('.vtt')) {
    return res.status(400).json({ error: "Valid .vtt filename not provided." });
  }

  // Construct the path under public/uploads
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Subtitle file not found." });
  }

  // Stream the file back
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": "text/vtt", // Set correct content type for VTT files
    "Content-Length": stat.size,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}
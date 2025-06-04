// pages/api/download-video/[filename].js

import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const {
    query: { filename },
  } = req;

  if (!filename) {
    return res.status(400).json({ error: "No filename provided." });
  }

  // Construct the path under public/uploads
  const filePath = path.join(process.cwd(), "public", "uploads", filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  // Stream the file back
  const stat = fs.statSync(filePath);
  const fileExtension = path.extname(filename).toLowerCase();
  const contentType = fileExtension === '.mp4' ? 'video/mp4' : 'application/octet-stream'; // Basic content type detection
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${filename}"`,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
}

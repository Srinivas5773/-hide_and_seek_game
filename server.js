/**
 * Zero-dependency HTTP static file server for Hide and Seek Game.
 * Serves HTML, CSS, JavaScript, JSON, and Web Audio assets.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

const server = http.createServer((req, res) => {
  // Normalize and sanitize request URL
  let safeUrl = req.url.split('?')[0];
  if (safeUrl === '/') safeUrl = '/index.html';

  const decodedUrl = decodeURIComponent(safeUrl);
  let filePath = path.join(PUBLIC_DIR, decodedUrl);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><title>404 Not Found</title><style>body{background:#0d1117;color:#c9d1d9;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}h1{color:#f85149;margin-bottom:8px;}a{color:#58a6ff;text-decoration:none;border:1px solid #30363d;padding:8px 16px;border-radius:6px;margin-top:16px;}</style></head><body><h1>404 Not Found</h1><p>Resource not located in Hide & Seek game archive.</p><a href="/">Return to Game</a></body></html>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[Hide & Seek Engine] Server operational on http://localhost:${PORT}`);
    console.log(`[Hide & Seek Engine] Press Ctrl+C to terminate server.`);
  });
}

module.exports = server;

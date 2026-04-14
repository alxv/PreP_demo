// Minimal static file server (no dependencies)
// Serves this folder over http://localhost:8080 by default

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname);
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function isPathInside(parent, child) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  if (body && Buffer.isBuffer(body)) return res.end(body);
  return res.end(body || '');
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return send(res, 404, 'Not Found');
      return send(res, 500, 'Internal Server Error');
    }
    send(res, 200, data, { 'Content-Type': type });
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let reqPath = decodeURIComponent(url.pathname);

    // Directory index handling
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    if (reqPath === '/') reqPath = '/index.html';

    const abs = path.resolve(path.join(ROOT, reqPath));
    if (!isPathInside(ROOT, abs)) return send(res, 403, 'Forbidden');

    fs.stat(abs, (err, stats) => {
      if (!err && stats.isFile()) return serveFile(res, abs);
      // Try adding index.html if a directory is requested without trailing slash
      fs.stat(path.join(abs, 'index.html'), (err2, stats2) => {
        if (!err2 && stats2.isFile()) return serveFile(res, path.join(abs, 'index.html'));
        return send(res, 404, 'Not Found');
      });
    });
  } catch (e) {
    return send(res, 400, 'Bad Request');
  }
});

server.listen(PORT, () => {
  console.log(`PrePMa static server running at http://localhost:${PORT}`);
  console.log('Tip: Ensure Dialogflow Messenger allows http://localhost');
});

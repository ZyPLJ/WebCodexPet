/**
 * Zero-dependency static file server for WebCodexPet.
 * Usage: node server.js  |  npm start
 * Open:  http://localhost:8765/
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8765;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const joined = path.normalize(path.join(root, decoded));
  if (joined !== root && !joined.startsWith(root + path.sep)) return null;
  return joined;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method Not Allowed");
  }

  let urlPath = new URL(req.url || "/", `http://localhost:${PORT}`).pathname;
  if (urlPath.endsWith("/")) urlPath += "index.html";

  const filePath = safeJoin(ROOT, urlPath);
  if (!filePath) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, "Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const headers = {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    };

    if (req.method === "HEAD") {
      return send(res, 200, undefined, headers);
    }

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, headers);
    stream.pipe(res);
    stream.on("error", () => {
      if (!res.headersSent) send(res, 500, "Internal Server Error");
      else res.destroy();
    });
  });
});

server.listen(PORT, () => {
  console.log(`WebCodexPet → http://localhost:${PORT}/`);
  console.log(`Embed demo  → http://localhost:${PORT}/embed/example.html`);
});

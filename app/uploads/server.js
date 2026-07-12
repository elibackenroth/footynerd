// server.js — entry point. Plain Node http server:
//   - serves the static frontend from /public
//   - dispatches /api/* to api.js
//
// Deliberately framework-free (no Express) so the whole app — backend
// included — runs with `node server/server.js` and zero `npm install`.
// Requires Node >= 22.5 for the built-in node:sqlite module.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { router } = require('./api');
const authLib = require('./auth');

const PORT = process.env.PORT || 8787;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA fallback for any non-file GET (e.g. deep links) — the app is
      // a single page that reads ?match= from the URL itself.
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal error');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    if (pathname.startsWith('/api/')) {
      const segments = pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
      const { token, user } = authLib.currentUser(req);
      const ctx = { token, user };
      await router(req, res, ctx, segments, req.method);
      return;
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      serveStatic(req, res, pathname);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found.' }));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error.' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`FootyNerd server running at http://localhost:${PORT}`);
});

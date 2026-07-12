// util.js — small shared helpers used across route handlers.

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    const MAX = 1024 * 1024; // 1MB cap
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function initials(name) {
  const n = (name || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/);
  return ((parts[0] && parts[0][0]) || '?').toUpperCase() + ((parts[1] && parts[1][0]) || '').toUpperCase();
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function genMatchId() {
  // 6-char base36 id, same shape as the prototype's genMatchId()
  return Math.random().toString(36).slice(2, 8);
}

const AVATAR_COLORS = [
  'oklch(0.42 0.18 250)',
  'oklch(0.55 0.15 250)',
  'oklch(0.6 0.17 60)',
  'oklch(0.6 0.16 25)',
  'oklch(0.55 0.13 300)',
];

module.exports = {
  sendJson,
  readJsonBody,
  initials,
  todayStr,
  daysBetween,
  genMatchId,
  AVATAR_COLORS,
};

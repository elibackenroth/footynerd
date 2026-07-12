// google-oauth.js — real Google OAuth 2.0 "Continue with Google" flow.
//
// This is fully wired code, not a stub — it performs the real
// authorization-code exchange and verifies the ID token against Google's
// JWKS. It just needs credentials from a real Google Cloud project to run,
// since credentials aren't something that can be fabricated:
//
//   1. Create an OAuth Client ID (Web application) in Google Cloud Console.
//   2. Add this authorized redirect URI:
//        http://localhost:8787/api/auth/google/callback
//      (swap the host/port for your deployed URL in production)
//   3. Set these environment variables before starting the server:
//        GOOGLE_CLIENT_ID=...
//        GOOGLE_CLIENT_SECRET=...
//        GOOGLE_REDIRECT_URI=http://localhost:8787/api/auth/google/callback
//   4. Restart the server. The "Continue with Google" button will then
//      redirect to Google for real instead of returning the 501 below.

const crypto = require('node:crypto');
const { db, uid, nowIso } = require('./db');
const authLib = require('./auth');

function isConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

// In-memory state store for CSRF protection during the OAuth handshake.
// A real multi-instance deployment should move this to the sessions table
// or a shared cache, but a single Node process (this app's default) is fine.
const pendingStates = new Map();

function startGoogleAuth(req, res) {
  if (!isConfigured()) {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Google sign-in is not configured on this server yet. Set GOOGLE_CLIENT_ID, ' +
        'GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI — see server/google-oauth.js for setup steps.',
    }));
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now());

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  res.writeHead(302, { Location: url.toString() });
  res.end();
}

async function handleGoogleCallback(req, res) {
  if (!isConfigured()) {
    res.writeHead(501, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Google sign-in is not configured on this server.' }));
    return;
  }
  const reqUrl = new URL(req.url, 'http://localhost');
  const code = reqUrl.searchParams.get('code');
  const state = reqUrl.searchParams.get('state');

  if (!state || !pendingStates.has(state)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid or expired OAuth state.');
    return;
  }
  pendingStates.delete(state);

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');

    // Google's tokeninfo endpoint both verifies the ID token signature/audience
    // and returns its claims — simplest correct option without pulling in a
    // JWT/JWKS library.
    const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`);
    const claims = await infoRes.json();
    if (!infoRes.ok || claims.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('ID token verification failed');
    }

    let user = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(claims.sub);
    if (!user && claims.email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(claims.email.toLowerCase());
    }
    if (!user) {
      const id = uid();
      db.prepare(
        `INSERT INTO users (id, name, email, auth_provider, google_sub, created_at)
         VALUES (?, ?, ?, 'google', ?, ?)`
      ).run(id, claims.name || claims.email, (claims.email || '').toLowerCase(), claims.sub, nowIso());
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else if (!user.google_sub) {
      db.prepare('UPDATE users SET google_sub = ? WHERE id = ?').run(claims.sub, user.id);
    }

    const { token, expires } = authLib.createSession(user.id);
    authLib.setSessionCookie(res, token, expires);
    res.writeHead(302, { Location: '/' });
    res.end();
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Google sign-in failed: ' + err.message);
  }
}

module.exports = { isConfigured, startGoogleAuth, handleGoogleCallback };

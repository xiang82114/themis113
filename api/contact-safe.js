// api/contact.js
'use strict';

// Minimal robust handler that won't throw if env vars are missing.
// Behavior:
// - GET ?health=1 => returns ok + checks
// - POST => echo back body and checks
//   - If DEBUG_CONTACT=1 => always succeed (no sending/verification).
//   - Otherwise we do NOT attempt to send if required env vars are missing
//     (we return a descriptive response instead of throwing).

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', err => reject(err));
  });
}

function sendJson(res, code, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = code;
  res.end(JSON.stringify(obj));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

module.exports = async function handler(req, res) {
  try {
    setCors(res);

    if (req.method === 'OPTIONS') return res.end();

    const url = req.url || '';
    if (req.method === 'GET' && url.includes('health=1')) {
      const checks = {
        has_RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        has_TURNSTILE_SECRET_KEY: !!process.env.TURNSTILE_SECRET_KEY,
        has_TO_EMAIL: !!process.env.TO_EMAIL,
        has_FROM_EMAIL: !!process.env.FROM_EMAIL,
        vercel_env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        runtime: 'node'
      };
      return sendJson(res, 200, { ok: true, checks });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST,GET,OPTIONS');
      return sendJson(res, 405, { error: 'Method Not Allowed' });
    }

    // parse body (compatible with Vercel auto-parse or raw)
    let bodyObj = (req.body && typeof req.body === 'object') ? req.body : null;
    if (!bodyObj) {
      const raw = await readRawBody(req);
      try {
        bodyObj = raw ? JSON.parse(raw) : {};
      } catch (e) {
        return sendJson(res, 400, { error: 'invalid json' });
      }
    }

    // checks
    const checks = {
      has_RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      has_TURNSTILE_SECRET_KEY: !!process.env.TURNSTILE_SECRET_KEY,
      has_TO_EMAIL: !!process.env.TO_EMAIL,
      has_FROM_EMAIL: !!process.env.FROM_EMAIL,
      debug_mode: process.env.DEBUG_CONTACT === '1'
    };

    // basic required fields for contact
    if (!bodyObj.name || !bodyObj.phone || !bodyObj.message) {
      return sendJson(res, 400, { error: 'name, phone, message are required', checks });
    }

    // If debug mode on, just echo and do NOT attempt verification or sending
    if (checks.debug_mode) {
      console.log('[CONTACT][DEBUG ECHO]', { body: bodyObj });
      return sendJson(res, 200, { ok: true, mode: 'debug', echo: bodyObj, checks });
    }

    // If not debug, but required env vars for sending/verify are missing,
    // do NOT throw — return explicit response telling what is missing.
    const missing = [];
    if (!checks.has_TURNSTILE_SECRET_KEY) missing.push('TURNSTILE_SECRET_KEY');
    if (!checks.has_RESEND_API_KEY) missing.push('RESEND_API_KEY');
    if (!checks.has_TO_EMAIL) missing.push('TO_EMAIL');
    if (!checks.has_FROM_EMAIL) missing.push('FROM_EMAIL');

    if (missing.length > 0) {
      // IMPORTANT: do not throw; return clear diagnostic so you can set env vars.
      return sendJson(res, 200, {
        ok: false,
        reason: 'missing_env_vars',
        missing,
        message: '缺少必要的 environment variables，請在 Vercel 設定後重新部署或開啟 DEBUG_CONTACT=1 測試'
      });
    }

    // ====== If all env vars exist, here's where you'd:
    // 1) verify Turnstile token (if you collect one client-side)
    // 2) send email (Resend / SMTP)
    // Wrap both in try/catch to avoid uncaught exceptions.
    //
    // Example pseudo-flow (commented):
    //
    // try {
    //   // optionally verify Turnstile:
    //   // const token = bodyObj.turnstileToken;
    //   // call https://challenges.cloudflare.com/turnstile/v0/siteverify with SECRET
    //
    //   // send email via Resend (only if process.env.RESEND_API_KEY exists)
    //   // const { Resend } = require('resend');
    //   // const resend = new Resend(process.env.RESEND_API_KEY);
    //   // await resend.emails.send({ from: process.env.FROM_EMAIL, to: process.env.TO_EMAIL, subject: '新聯絡表單', html: ... });
    //
    //   // return success
    // } catch (err) {
    //   console.error('[CONTACT/SEND_ERR]', err);
    //   return sendJson(res, 500, { ok: false, error: 'send_failed' });
    // }

    // For safety we won't perform the actual operations here; just echo success.
    console.log('[CONTACT][READY TO SEND] all env present but sending is disabled in this safe handler.');
    return sendJson(res, 200, { ok: true, echo: bodyObj });
  } catch (err) {
    console.error('[CONTACT/UNCAUGHT]', err);
    return sendJson(res, 500, { message: '伺服器錯誤，請稍後再試' });
  }
};

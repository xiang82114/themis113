// /api/contact.js (instrumented for debugging)
export const config = { runtime: 'nodejs' };

const isDebug = process.env.DEBUG_CONTACT === '1';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TO_EMAIL = process.env.TO_EMAIL || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function send(res, status, body) {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = status;
    res.end(JSON.stringify(body));
  } catch (err) {
    // 如果 res 已經被關閉，記錄
    console.error('[send] error while sending response', err && err.stack ? err.stack : err);
  }
}

async function parseJson(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('application/json')) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); }
        catch (e) { reject(new Error('INVALID_JSON')); }
      });
      req.on('error', reject);
    });
  }
  if (ct.includes('application/x-www-form-urlencoded')) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', c => (data += c));
      req.on('end', () => {
        try {
          const obj = {};
          for (const pair of data.split('&')) {
            if (!pair) continue;
            const [k, v] = pair.split('=');
            obj[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
          }
          resolve(obj);
        } catch (e) { reject(new Error('INVALID_FORM')); }
      });
      req.on('error', reject);
    });
  }
  return {};
}

async function verifyTurnstile(token, ip) {
  console.log('[verifyTurnstile] start', { hasSecret: !!TURNSTILE_SECRET_KEY, tokenProvided: !!token, ip });
  if (!TURNSTILE_SECRET_KEY) return { ok: false, reason: 'NO_SECRET' };
  if (!token) return { ok: false, reason: 'NO_TOKEN' };

  const params = new URLSearchParams();
  params.append('secret', TURNSTILE_SECRET_KEY);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);

  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const json = await resp.json().catch(() => ({}));
    console.log('[verifyTurnstile] resp', json);
    if (json.success) return { ok: true };
    return { ok: false, reason: 'VERIFY_FAILED', detail: json };
  } catch (err) {
    console.error('[verifyTurnstile] fetch error', err && err.stack ? err.stack : err);
    return { ok: false, reason: 'VERIFY_THROW', detail: err?.message || err };
  }
}

async function sendMail(payload) {
  console.log('[sendMail] start', { hasKey: !!RESEND_API_KEY, toSet: !!TO_EMAIL });
  if (!RESEND_API_KEY) return { ok: false, reason: 'NO_RESEND_API_KEY' };
  if (!TO_EMAIL) return { ok: false, reason: 'NO_TO_EMAIL' };

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const subject = `【官網聯絡單】${payload.space_type || '未填'}｜${payload.name || '未留名'}`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
        <p><b>姓名：</b>${esc(payload.name)}</p>
        <p><b>Email：</b>${esc(payload.email)}</p>
        <p><b>電話：</b>${esc(payload.phone || '')}</p>
        <p><b>空間性質：</b>${esc(payload.space_type || '')}</p>
        <p><b>預算：</b>${esc(payload.budget || '')}</p>
        <p><b>需求內容：</b><br/>${esc(payload.message || '').replace(/\n/g,'<br/>')}</p>
        <hr/>
        <small>IP：${esc(payload.ip || '')}</small><br/>
        <small>送出時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</small>
      </div>
    `;

    const r = await resend.emails.send({
      from: `Themis Design <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject,
      html,
      reply_to: payload.email || undefined,
    });
    console.log('[sendMail] resend response', r);
    if (r?.id) return { ok: true, id: r.id, raw: r };
    return { ok: false, reason: 'RESEND_UNKNOWN_RESPONSE', detail: r };
  } catch (e) {
    console.error('[sendMail] error', e && e.stack ? e.stack : e);
    // 回傳詳細錯誤給 isDebug=true 時可見
    return {
      ok: false,
      reason: 'RESEND_THROW',
      name: e?.name || 'Error',
      message: e?.message || 'unknown',
      detail: e?.response?.data || e?.cause || null,
    };
  }
}

export default async function handler(req, res) {
  console.log('[contact] invocation', { method: req.method, url: req.url, now: new Date().toISOString() });
  if (req.method === 'GET' && 'health' in (req.query || {})) {
    return send(res, 200, {
      ok: true,
      checks: {
        has_RESEND_API_KEY: !!RESEND_API_KEY,
        has_TURNSTILE_SECRET_KEY: !!TURNSTILE_SECRET_KEY,
        has_TO_EMAIL: !!TO_EMAIL,
        has_FROM_EMAIL: !!FROM_EMAIL,
        vercel_env: process.env.VERCEL_ENV || 'unknown',
        runtime: 'node',
      },
    });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, GET');
    return send(res, 405, { message: 'Method Not Allowed' });
  }

  try {
    const ip =
      (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) ||
      req.socket?.remoteAddress ||
      '';
    console.log('[contact] client ip', ip);

    const body = await parseJson(req).catch(err => {
      console.error('[contact] parseJson failed', err && err.stack ? err.stack : err);
      throw err;
    });
    console.log('[contact] parsed body', body);

    // 基本驗證
    const required = ['name', 'email', 'space_type', 'budget', 'message'];
    for (const k of required) {
      if (!body[k] || (typeof body[k] === 'string' && !body[k].trim())) {
        console.warn('[contact] validation fail', { missing: k });
        return send(res, 400, { message: `請填寫必填欄位：${k}` });
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || '')) {
      console.warn('[contact] invalid email', { email: body.email });
      return send(res, 400, { message: '請填寫有效 Email' });
    }

    // Turnstile
    const token = body['cf-turnstile-response'] || body['turnstile_token'] || req.headers['cf-turnstile-response'];
    console.log('[contact] turnstile token present?', !!token);
    const verify = await verifyTurnstile(token, ip);
    console.log('[contact] verifyTurnstile result', verify);
    if (!verify.ok) {
      return send(res, 400, {
        message: '驗證失敗，請刷新後再試',
        ...(isDebug ? { debug: { turnstile: verify } } : {}),
      });
    }

    // 寄信
    const mail = await sendMail({ ...body, ip });
    console.log('[contact] sendMail result', mail);
    if (!mail.ok) {
      return send(res, 500, {
        message: '寄信失敗，請稍候再試',
        ...(isDebug ? { debug: { mail } } : {}),
      });
    }

    console.log('[contact] about to respond 200 with id', mail.id);
    return send(res, 200, { message: '送出成功，感謝您的來信！', id: mail.id });
  } catch (e) {
    console.error('[contact] top-level error', e && e.stack ? e.stack : e);
    return send(res, 500, {
      message: '伺服器錯誤，請稍後再試',
      ...(isDebug ? { debug: { name: e?.name, message: e?.message, stack: e?.stack?.split('\n').slice(0, 10) } } : {}),
    });
  }
}

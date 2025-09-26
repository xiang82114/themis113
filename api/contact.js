// /api/contact.js
// 強制使用 Node.js（Resend 需要 Node runtime）
export const config = { runtime: 'nodejs' };

const isDebug = process.env.DEBUG_CONTACT === '1';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TO_EMAIL = process.env.TO_EMAIL || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

// 小工具
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

async function parseJson(req) {
  if (req.headers['content-type']?.includes('application/json')) {
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
  // x-www-form-urlencoded 也支援（Turnstile 原生表單）
  if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
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

// Turnstile 驗證
async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET_KEY) return { ok: false, reason: 'NO_SECRET' };
  if (!token) return { ok: false, reason: 'NO_TOKEN' };

  const params = new URLSearchParams();
  params.append('secret', TURNSTILE_SECRET_KEY);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);

  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const json = await resp.json().catch(() => ({}));
  if (json.success) return { ok: true };
  return { ok: false, reason: 'VERIFY_FAILED', detail: json };
}

// Resend 寄信
async function sendMail(payload) {
  if (!RESEND_API_KEY) return { ok: false, reason: 'NO_RESEND_API_KEY' };
  if (!TO_EMAIL) return { ok: false, reason: 'NO_TO_EMAIL' };

  const { Resend } = await import('resend'); // 延遲載入，避免 health 檢查報模組錯
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

  try {
    const r = await resend.emails.send({
      from: `Themis Design <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject,
      html,
      reply_to: payload.email || undefined,
    });
    if (r?.id) return { ok: true, id: r.id };
    return { ok: false, reason: 'RESEND_UNKNOWN_RESPONSE', detail: r };
  } catch (e) {
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
  // GET ?health=1
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
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '';

    const body = await parseJson(req);

    // 欄位基本驗證
    const required = ['name', 'email', 'space_type', 'budget', 'message'];
    for (const k of required) {
      if (!body[k] || (typeof body[k] === 'string' && !body[k].trim())) {
        return send(res, 400, { message: `請填寫必填欄位：${k}` });
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email || '')) {
      return send(res, 400, { message: '請填寫有效 Email' });
    }

    // 取得 Turnstile token（兩種名稱都支援）
    const token =
      body['cf-turnstile-response'] ||
      body['turnstile_token'] ||
      req.headers['cf-turnstile-response']; // 萬一你用 header 帶

    const verify = await verifyTurnstile(token, ip);
    if (!verify.ok) {
      return send(res, 400, {
        message: '驗證失敗，請刷新後再試',
        ...(isDebug ? { debug: { turnstile: verify } } : {}),
      });
    }

    // 寄信
    const mail = await sendMail({ ...body, ip });
    if (!mail.ok) {
      return send(res, 500, {
        message: '寄信失敗，請稍候再試',
        ...(isDebug ? { debug: { mail } } : {}),
      });
    }

    return send(res, 200, { message: '送出成功，感謝您的來信！', id: mail.id });
  } catch (e) {
    // 統一兜底，避免 Vercel FUNCTION_INVOCATION_FAILED
    return send(res, 500, {
      message: '伺服器錯誤，請稍後再試',
      ...(isDebug ? { debug: { name: e?.name, message: e?.message, stack: e?.stack?.split('\n').slice(0, 3) } } : {}),
    });
  }
}

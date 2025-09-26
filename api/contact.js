// api/contact.js
// Vercel Serverless Function (Node.js) – 支援 CORS、Health Check、Turnstile、Resend
const isDebug = process.env.DEBUG_CONTACT === '1';

// -------- Utils --------
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function sendJson(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  // 兼容 JSON 與 x-www-form-urlencoded
  const ctype = (req.headers['content-type'] || '').toLowerCase();
  let raw = '';
  await new Promise(resolve => {
    req.on('data', chunk => (raw += chunk));
    req.on('end', resolve);
  });

  if (!raw) return {};
  try {
    if (ctype.includes('application/json')) {
      return JSON.parse(raw);
    }
    if (ctype.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw);
      const obj = {};
      for (const [k, v] of params.entries()) obj[k] = v;
      return obj;
    }
  } catch {}
  return {};
}

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// -------- Handler --------
export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '*';
  const baseHeaders = corsHeaders(origin);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    Object.entries(baseHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.end();
  }

  // 解析 URL 與查詢參數
  let isHealth = false;
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    isHealth = url.searchParams.get('health') === '1';
  } catch {}

  // GET /api/contact?health=1
  if (req.method === 'GET' && isHealth) {
    const checks = {
      has_RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      has_TURNSTILE_SECRET_KEY: !!process.env.TURNSTILE_SECRET_KEY,
      has_TO_EMAIL: !!process.env.TO_EMAIL,
      has_FROM_EMAIL: !!process.env.FROM_EMAIL,
      vercel_env: process.env.VERCEL_ENV || 'unknown',
      runtime: 'node',
    };
    return sendJson(res, 200, { ok: true, checks }, baseHeaders);
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Method Not Allowed' }, { ...baseHeaders, Allow: 'POST, GET, OPTIONS' });
  }

  // 讀環境變數
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
  const TO_EMAIL = process.env.TO_EMAIL || 'themis11303@gmail.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const FROM_NAME = process.env.FROM_NAME || 'Themis Design';

  if (!RESEND_API_KEY) {
    return sendJson(res, 500, { message: isDebug ? '缺少 RESEND_API_KEY' : '寄信失敗，請稍候再試' }, baseHeaders);
  }
  if (!TURNSTILE_SECRET_KEY) {
    return sendJson(res, 500, { message: isDebug ? '缺少 TURNSTILE_SECRET_KEY' : '驗證失敗，請稍候再試' }, baseHeaders);
  }

  // 動態載入 Resend（避免健康檢查因未安裝而報錯）
  let Resend;
  try {
    ({ Resend } = await import('resend'));
  } catch (e) {
    if (isDebug) console.error('import("resend") 失敗：', e);
    return sendJson(res, 500, { message: isDebug ? '未安裝 resend（請 npm i resend）' : '系統錯誤' }, baseHeaders);
  }

  try {
    const body = await parseBody(req);
    const { Name, EMail, Tel, WT, Room, Money, Square, Message } = body || {};
    const token = body?.['cf-turnstile-response'];

    const errors = [];
    if (!Name) errors.push('請填寫姓名');
    if (!EMail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMail)) errors.push('請填寫有效 Email');
    if (!Room) errors.push('請選擇空間性質');
    if (!Money) errors.push('請選擇預算區間');
    if (!token) errors.push(isDebug ? '缺少 Turnstile token（cf-turnstile-response）' : '驗證失敗，請重試');
    if (errors.length) return sendJson(res, 400, { message: errors.join('，') }, baseHeaders);

    // Turnstile 驗證
    const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
    let tf;
    try {
      const tfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: String(token),
          remoteip: ip || '',
        }),
      });
      tf = await tfRes.json();
    } catch (e) {
      if (isDebug) console.error('Turnstile 連線失敗：', e);
      return sendJson(res, 500, { message: isDebug ? 'Turnstile 連線失敗' : '驗證失敗，請稍後再試' }, baseHeaders);
    }
    if (!tf?.success) {
      if (isDebug) console.error('Turnstile 驗證失敗：', tf);
      return sendJson(res, 400, { message: '驗證失敗，請刷新後再試' }, baseHeaders);
    }

    // Email 內容
    const subject = `【同翕設計聯絡表單】${Name}`;
    const html = `
      <div style="font-family:Arial,'Noto Sans TC',sans-serif">
        <h2>同翕設計 聯絡表單通知</h2>
        <p><b>姓名：</b>${esc(Name)}</p>
        <p><b>Email：</b>${esc(EMail)}</p>
        <p><b>電話：</b>${esc(Tel || '')}</p>
        <p><b>LINE ID：</b>${esc(WT || '')}</p>
        <p><b>空間性質：</b>${esc(Room)}</p>
        <p><b>預算區間：</b>${esc(Money)}</p>
        <p><b>空間坪數：</b>${esc(Square || '')}</p>
        <div style="margin-top:12px;padding:12px;background:#fafafa;border:1px solid #eee;border-radius:8px;">
          <div style="font-weight:700;margin-bottom:8px;">備註</div>
          <div style="white-space:pre-wrap;line-height:1.7;">${esc(Message || '')}</div>
        </div>
      </div>`.trim();

    const text = [
      `姓名: ${Name}`,
      `Email: ${EMail}`,
      `電話: ${Tel || ''}`,
      `LINE ID: ${WT || ''}`,
      `空間性質: ${Room}`,
      `預算區間: ${Money}`,
      `空間坪數: ${Square || ''}`,
      '',
      '備註:',
      `${Message || ''}`,
    ].join('\n');

    // 寄信
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      reply_to: EMail, // Resend SDK 使用 snake_case
      subject,
      html,
      text,
    });

    if (error) {
      if (isDebug) console.error('Resend 寄信失敗：', error);
      return sendJson(res, 500, { message: isDebug ? `Resend 寄信失敗：${error?.message || 'unknown'}` : '寄信失敗，請稍候再試' }, baseHeaders);
    }

    return sendJson(res, 200, { ok: true }, baseHeaders);
  } catch (e) {
    if (isDebug) console.error('Handler 錯誤：', e);
    return sendJson(res, 500, { message: isDebug ? `伺服器錯誤：${e?.message || e}` : '系統錯誤' }, baseHeaders);
  }
}

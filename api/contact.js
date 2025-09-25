// api/contact.js
const { Resend } = require('resend');

// 小工具：escape HTML
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const body = req.body || (await new Promise((resolve, reject) => {
      // 解析 JSON body（Vercel 部分情況會自動 parse，這段是雙保險）
      let data=''; req.on('data', c => data += c);
      req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e){ resolve({}); }});
      req.on('error', reject);
    }));

    const { Name, EMail, Tel, WT, Room, Money, Square, Message, ['cf-turnstile-response']: token } = body;

    // 1) 基本檢核
    const errors = [];
    if (!Name) errors.push('請填寫姓名');
    if (!EMail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMail)) errors.push('請填寫有效 Email');
    if (!Room) errors.push('請選擇空間性質');
    if (!Money) errors.push('請選擇預算區間');
    if (!token) errors.push('驗證失敗，請重試');
    if (errors.length) return res.status(400).json({ message: errors.join('，') });

    // 2) Turnstile 驗證
    const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
    const tfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
        remoteip: ip
      })
    }).then(r => r.json());

    if (!tfRes.success) {
      return res.status(400).json({ message: '驗證失敗，請刷新後再試' });
    }

    // 3) 組信
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
      </div>
    `;
    const text =
`姓名: ${Name}
Email: ${EMail}
電話: ${Tel || ''}
LINE ID: ${WT || ''}
空間性質: ${Room}
預算區間: ${Money}
空間坪數: ${Square || ''}

備註:
${Message || ''}`;

    // 4) 寄信（Resend）
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${process.env.FROM_NAME || 'Themis Design'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [process.env.TO_EMAIL || 'themis11303@gmail.com'],
      reply_to: EMail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ message: '寄信失敗，請稍候再試' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '系統錯誤' });
  }
};

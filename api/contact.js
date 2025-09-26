// api/contact.js（僅示意寄信段落與錯誤處理）

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const TO_EMAIL = process.env.TO_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const DEBUG = process.env.DEBUG_CONTACT === '1';

async function sendMail(payload) {
  // 延遲載入，避免 health=1 沒裝套件也報錯
  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);

  const subject = `【官網聯絡單】${payload.space_type || '未填類型'}｜${payload.name || '未留名'}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6">
      <p><b>姓名：</b>${esc(payload.name)}</p>
      <p><b>Email：</b>${esc(payload.email)}</p>
      <p><b>電話：</b>${esc(payload.phone || '')}</p>
      <p><b>空間性質：</b>${esc(payload.space_type)}</p>
      <p><b>預算：</b>${esc(payload.budget)}</p>
      <p><b>需求內容：</b><br/>${esc(payload.message).replace(/\n/g,'<br/>')}</p>
      <hr/>
      <small>送出時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</small>
    </div>
  `;

  try {
    const res = await resend.emails.send({
      from: `Themis Design <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject,
      html,
      reply_to: payload.email || undefined,
    });

    // Resend SDK 成功會回傳 id
    if (res?.id) return { ok: true, id: res.id };
    throw new Error('Unknown Resend response');
  } catch (err) {
    // 把 Resend 錯誤訊息盡量向外拋（DEBUG 才顯示詳情）
    const reason = (err?.message || 'unknown').slice(0, 400);
    const name = err?.name || 'Error';
    const detail = err?.response?.data || err?.cause || null; // 不同版本 SDK 回傳可能在這些欄位
    const info = DEBUG ? { name, reason, detail } : undefined;
    return { ok: false, error: 'RESEND_FAILED', info };
  }
}

// 你的主 handler 裡呼叫：
// const mail = await sendMail(body);
// if (!mail.ok) return json(500, { message: DEBUG ? `寄信失敗：${JSON.stringify(mail.info)}` : '寄信失敗，請稍候再試' });

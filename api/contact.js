// /api/contact.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// 允許同網域前端呼叫；如需跨網域可酌量調整
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 前端請用 application/json 傳送
    const { name = "", email = "", phone = "", message = "" } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: "name、email、message 為必填" });
    }

    // 建議把寄件人、收件人設定為環境變數
    const from = process.env.RESEND_FROM;       // 例如：'Themis <noreply@yourdomain.com>'
    const to = process.env.CONTACT_TO || "you@example.com";

    const subject = `網站聯絡表單 - ${name}`;
    const html = `
      <h2>網站聯絡表單</h2>
      <p><b>姓名：</b>${name}</p>
      <p><b>Email：</b>${email}</p>
      <p><b>電話：</b>${phone || "-"}</p>
      <p><b>訊息：</b></p>
      <p>${String(message).replace(/\n/g, "<br/>")}</p>
      <hr/>
      <small>此信由網站自動發送</small>
    `;

    await resend.emails.send({
      from,
      to,
      reply_to: email,
      subject,
      html
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || "Server Error" });
  }
}

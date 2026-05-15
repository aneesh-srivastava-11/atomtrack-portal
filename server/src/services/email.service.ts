import nodemailer from "nodemailer";

/**
 * Email transport — uses Ethereal (fake SMTP) in dev, real SMTP in production.
 * Ethereal catches emails and lets you preview them at a URL.
 */
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Dev: use Ethereal test account (emails are captured, not sent)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`📧 Email preview account: ${testAccount.user}`);
  }

  return transporter;
}

/**
 * Send an email notification. In dev mode, logs a preview URL instead of actually sending.
 */
export async function sendNotification(to: string, subject: string, text: string) {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || '"AtomTrack" <noreply@atomtrack.test>',
      to,
      subject,
      text,
      html: `<div style="font-family:sans-serif;padding:20px;max-width:600px;">
        <h2 style="color:#1e293b;">${subject}</h2>
        <p style="color:#475569;line-height:1.6;">${text}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
        <p style="color:#94a3b8;font-size:12px;">AtomTrack Portal — Goal Setting & Quarterly Tracking</p>
      </div>`
    });

    // In dev, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error };
  }
}

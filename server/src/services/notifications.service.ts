import nodemailer from "nodemailer";

let testAccount: nodemailer.TestAccount | null = null;

async function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  
  // MAGIC HACKATHON TRICK: If no real SMTP is provided, we auto-generate a temporary 
  // email inbox using Ethereal Email so we can show the judges a real email preview URL!
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
  }
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export const NotificationService = {
  /**
   * Sends an Adaptive Card notification to a Microsoft Teams channel via Webhook.
   */
  async sendTeamsNotification(webhookUrl: string | undefined, title: string, text: string, details?: Record<string, string | number>) {
    if (!webhookUrl) return;

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": title,
      "sections": [{
        "activityTitle": title,
        "activitySubtitle": "AtomTrack Portal Notification",
        "text": text,
        "facts": details ? Object.entries(details).map(([name, value]) => ({ name, value: String(value) })) : [],
        "markdown": true
      }]
    };

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log(`\n✅ [Teams Webhook] Message sent: ${title}`);
    } catch (err) {
      console.error("❌ [Teams Webhook] Failed to send message", err);
    }
  },

  /**
   * Sends an email notification to the user.
   */
  async sendEmail(to: string, subject: string, html: string) {
    try {
      const transporter = await getTransporter();
      const info = await transporter.sendMail({
        from: '"AtomTrack Notifications" <no-reply@atomtrack.test>',
        to,
        subject,
        html
      });
      
      console.log(`\n📧 [Email] Sent to ${to}: "${subject}"`);
      if (!process.env.SMTP_HOST) {
        // This is where the magic happens for the demo
        console.log(`🌐 [Email Preview URL]: ${nodemailer.getTestMessageUrl(info)}\n`);
      }
    } catch (err) {
      console.error("❌ [Email] Failed to send", err);
    }
  }
};

const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text, html, attachments }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || 'noreply@framebydb.com';

  // Fallback to console log mock if SMTP not configured
  if (!host || !user || !pass) {
    console.log('--- Backend SMTP Not Fully Configured. Mocking Email Transmission ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || 'HTML content generated'}`);
    if (attachments && attachments.length > 0) {
      console.log(`Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    }
    return { messageId: 'backend-mock-email-id-123456789' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    const info = await transporter.sendMail({
      from: `"Frame by DB" <${from}>`,
      to,
      subject,
      text,
      html,
      attachments
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email delivery error:', error);
    throw error;
  }
}

module.exports = sendEmail;

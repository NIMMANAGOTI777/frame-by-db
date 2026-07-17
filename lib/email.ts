import nodemailer from 'nodemailer';
import React from 'react';

interface SendEmailParams {
  to: string;
  subject: string;
  template: React.ReactElement;
  text?: string;
}

export async function sendEmail({ to, subject, template, text }: SendEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@framebydb.com';

  // If SMTP is not fully configured, fall back to console logging for testability and seamless offline execution
  if (!host || !user || !pass) {
    console.log('--- SMTP Not Fully Configured. Mocking Email Transmission ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body (Plaintext): ${text || 'HTML template generated'}`);
    return { messageId: 'mock-email-id-123456789' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  // Dynamically import react-dom/server to bypass Next.js static import analyzer limitations in server modules
  const { renderToStaticMarkup } = await import('react-dom/server');
  const html = renderToStaticMarkup(template);

  const info = await transporter.sendMail({
    from: `"Frame by DB" <${from}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
}

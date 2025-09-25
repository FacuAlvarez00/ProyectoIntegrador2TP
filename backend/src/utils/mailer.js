import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (ENV.SMTP_HOST && ENV.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: false,
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS }
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        console.log('\n=== MAIL (console fallback) ===');
        console.log('To:', opts.to);
        console.log('Subject:', opts.subject);
        console.log('Text:', opts.text);
        console.log('===============================\n');
        return { messageId: 'console-fallback' };
      }
    };
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  return t.sendMail({
    from: ENV.FROM_EMAIL,
    to, subject, text, html
  });
}

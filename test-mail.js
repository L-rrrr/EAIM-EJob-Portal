require('dotenv').config();
const nodemailer = require('nodemailer');

const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

t.sendMail({
  from: process.env.SMTP_USER,
  to: 'ruiliuljwzxx@gmail.com',
  subject: 'EAIM SMTP test',
  text: 'SMTP test'
})
.then(r => { console.log('Sent', r.messageId); process.exit(0); })
.catch(e => { console.error('Send error:', e); process.exit(1); });
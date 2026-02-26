const transporter = require("./transporter");

const sendLoginVerificationCode = async (to, code) => {
  const info = await transporter.sendMail({
    from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your EAIM Login Verification Code",
    html: `<p>Your login verification code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
  });
  console.log("Nodemailer sent (login code):", info && info.messageId ? info.messageId : info);
};

const sendRegisterVerificationCode = async (to, code) => {
  const info = await transporter.sendMail({
    from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your EAIM Registration Verification Code",
    html: `<p>Your verification code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
  });
  console.log("Nodemailer sent (register code):", info && info.messageId ? info.messageId : info);
};

const sendResetPasswordMail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your EAIM password",
    html: `<p>Click the link below to reset your password:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>This link will expire in 1 hour.</p>`,
  });
};

module.exports = {
  sendLoginVerificationCode,
  sendRegisterVerificationCode,
  sendResetPasswordMail,
};

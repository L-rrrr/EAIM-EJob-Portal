const transporter = require("./transporter");

const sendPortalEmail = async (mailOptions) => {
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendPortalEmail,
};

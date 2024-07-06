const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) create transport to 'mailtrap' inbox to test
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) create Email Options "content of my email"
  const mailOptions = {
    from: 'Ziad Mohamed <hello@jonas.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actally send the email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;

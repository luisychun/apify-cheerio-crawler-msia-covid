const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SGAPI);

const sgSendMail = async () => {
  const msg = {
    to: process.env.SGSENDER,
    from: process.env.SGRECEIVER,
    subject: "Covid Scraper Issue",
    html: `Something went wrong. Please check.`,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent");
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = sgSendMail;

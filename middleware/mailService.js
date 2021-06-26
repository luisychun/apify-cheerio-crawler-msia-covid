const sgMail = require("@sendgrid/mail");
const config = require("config");

sgMail.setApiKey(config.get("sendGridAPI"));

const sgSendMail = async () => {
  const msg = {
    to: config.get("emailReceiver"),
    from: config.get("emailSender"),
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

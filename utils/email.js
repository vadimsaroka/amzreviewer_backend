const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");
const { velcome } = require("./../views/emails/velcome");
const { passwordReset } = require("./../views/emails/passwordReset");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Saroka Vadim <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // SendGrid
      return nodemailer.createTransport({
        // service: "SendGrid",
        // auth: {
        //   user: process.env.SENDGRID_USERNAME,
        //   pass: process.env.SENDGRID_PASSWORD
        // }
        service: "Mail.ru",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        },
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });
    } else {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a template

    let html;

    if (template === "welcome") {
      html = velcome(this.firstName, this.url);
    }

    if (template === "passwordReset") {
      html = passwordReset(this.firstName, this.url);
    }

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: htmlToText.fromString(html),
      html: html
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send(`welcome`, `Welcome to the Amazon reviews Family`);
  }

  async sendPasswordReset() {
    await this.send(
      `passwordReset`,
      `Your password reset token (valid only 10 minutes)`
    );
  }
};

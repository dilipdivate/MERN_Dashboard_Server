import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export default async function sendEmail({
  to,
  subject,
  html,
  from = process.env.gmailid,
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.gmailid,
      pass: process.env.gmailpass,
    },
  });

  // console.log(transporter);
  // (process.env.smtpOptions);
  const t = await transporter.sendMail(
    { from, to, subject, html },
    function (error, info) {
      if (error) {
        console.log("Error in sending email  " + error);
        return true;
      } else {
        console.log("Email sent: " + info.response);
        return false;
      }
    }
  );
  // console.log(t);
}

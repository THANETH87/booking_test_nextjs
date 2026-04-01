import nodemailer from "nodemailer";

const isEmailEnabled = !!process.env.EMAIL_HOST && !!process.env.EMAIL_USER;

const transporter = isEmailEnabled
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!transporter || !isEmailEnabled) {
    console.log(`[Email skip] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SalonQ" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email error]", err);
  }
}

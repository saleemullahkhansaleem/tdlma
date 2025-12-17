import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Use environment variables for email configuration
  // For Gmail, you can use an App Password: https://support.google.com/accounts/answer/185833
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error(
      "Email configuration missing. SMTP_USER and SMTP_PASSWORD must be set."
    );
    throw new Error("Email service is not configured");
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || "food@tensaidevs.com",
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
          <p>Hello${userName ? ` ${userName}` : ""},</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html,
  });
}

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2563eb; margin-top: 0;">Verify Your Email Address</h2>
          <p>Hello${userName ? ` ${userName}` : ""},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #999; word-break: break-all;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    html,
  });
}

import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Use environment variables for email configuration
  // Configured for Hostinger email by default
  // For Hostinger: Use your full email address (e.g., food@tensaidevs.com) and email password
  
  const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465");
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpUser || !smtpPassword) {
    throw new Error(
      "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables."
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Add connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
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
    const errorMsg =
      "Email configuration missing. SMTP_USER and SMTP_PASSWORD must be set in environment variables.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  let transporter;
  try {
    transporter = createTransporter();
    
    // Verify connection before sending
    await transporter.verify();
  } catch (verifyError: any) {
    console.error("SMTP connection verification failed:", verifyError);
    
    // Provide helpful error messages
    if (verifyError.code === "EAUTH") {
      throw new Error(
        "SMTP authentication failed. Please check your SMTP_USER and SMTP_PASSWORD. " +
        "For Hostinger: Use your full email address (e.g., food@tensaidevs.com) as SMTP_USER " +
        "and your email account password as SMTP_PASSWORD. " +
        "Ensure the email account is active in your Hostinger control panel."
      );
    } else if (verifyError.code === "ECONNECTION" || verifyError.code === "ETIMEDOUT") {
      throw new Error(
        `Cannot connect to SMTP server (${process.env.SMTP_HOST || "smtp.hostinger.com"}). ` +
        "Please check your SMTP_HOST and SMTP_PORT settings. " +
        "For Hostinger, use smtp.hostinger.com (port 465 with SSL) or smtp.titan.email (for newer accounts)."
      );
    } else {
      throw new Error(
        `SMTP configuration error: ${verifyError.message || "Unknown error"}. ` +
        "Please verify your SMTP settings in environment variables."
      );
    }
  }

  // Use proper sender name format: "TDLMA – Tensai Devs" <food@tensaidevs.com>
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "food@tensaidevs.com";
  const fromName = process.env.SMTP_FROM_NAME || "TDLMA – Tensai Devs";
  const from = `"${fromName}" <${fromAddress}>`;

  const mailOptions = {
    from,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Provide specific error messages
    if (error.code === "EAUTH") {
      throw new Error(
        "SMTP authentication failed. Please check your credentials. " +
        "For Hostinger: Ensure SMTP_USER is your full email address (e.g., food@tensaidevs.com) " +
        "and SMTP_PASSWORD is your email account password."
      );
    } else if (error.response) {
      throw new Error(
        `SMTP server error: ${error.response}. Please check your SMTP configuration.`
      );
    } else {
      throw new Error(
        `Failed to send email: ${error.message || "Unknown error"}. ` +
        "Please check your SMTP configuration."
      );
    }
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
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from <strong>food.tensaidevs.com</strong>, please do not reply.
          </p>
          <p style="font-size: 11px; color: #bbb; text-align: center; margin-top: 10px;">
            Domain: food.tensaidevs.com
          </p>
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
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from <strong>food.tensaidevs.com</strong>, please do not reply.
          </p>
          <p style="font-size: 11px; color: #bbb; text-align: center; margin-top: 10px;">
            Domain: food.tensaidevs.com
          </p>
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

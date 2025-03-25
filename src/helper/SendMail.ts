import { createTransport } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailData {
  name?: string;
  otp?: string;
  email?: string;
  token?: string;
}

// Create reusable transporter function
const transporter = createTransport({
  service: "gmail",
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL, // Ensure variable names match `.env`
    pass: process.env.PASSWORD,
  },
});

/**
 * Send Password Reset Email
 * @param subject - Email subject
 * @param data - Contains recipient email and reset token
 */
export const sendForgotMail = async (subject: string, data: MailData): Promise<void> => {
  console.log("Reset Password URL:", `${process.env.FRONTEND_URL}/reset-password/${data.token}`);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${data.token}`;
  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
      body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f4; padding: 20px; }
      .container { background: #fff; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto; }
      h1 { color: #5a2d82; }
      p { color: #666; }
      .button-container { margin: 20px 0; }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background: #5a2d82;
        color: #fff !important;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        text-align: center;
      }
      .footer { margin-top: 20px; font-size: 12px; color: #888; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Reset Your Password</h1>
      <p>Hello,</p>
      <p>You have requested to reset your password. Click the button below:</p>

      <div class="button-container">
        <table cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td align="center" bgcolor="#5a2d82" style="border-radius: 5px;">
              <a href="${resetLink}" target="_blank" class="button">Reset Password</a>
            </td>
          </tr>
        </table>
      </div>

      <p>If you did not request this, please ignore this email.</p>
      <div class="footer">© ${new Date().getFullYear()} SafeXbank. All rights reserved.</div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: `"SafeXbank Support" <${process.env.GMAIL}>`,
    to: data.email!,
    subject,
    html,
  });
};

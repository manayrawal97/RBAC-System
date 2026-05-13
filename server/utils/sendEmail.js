const nodemailer = require('nodemailer')

/**
 * Creates a Nodemailer transporter using Gmail SMTP
 * Uses App Password from .env — never your real Gmail password
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    // service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,   // Gmail App Password (16 chars, no spaces)
    },
  })
}

/**
 * Sends a password reset email to the user
 *
 * @param {string} toEmail    - Recipient email address
 * @param {string} username   - Recipient's name (for personalisation)
 * @param {string} resetUrl   - Full reset link including raw token
 */
const sendPasswordResetEmail = async (toEmail, username, resetUrl) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: `"RBAC System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request',
    // Plain text fallback for email clients that don't support HTML
    text: `
Hi ${username},

You requested a password reset for your RBAC System account.

Click the link below to set a new password:
${resetUrl}

This link expires in 1 hour.

If you did not request this, you can safely ignore this email.
Your password will not change.

— RBAC System
    `.trim(),

    // HTML version — clean, professional
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',system-ui,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px;background:#ffffff;border-radius:12px;
                 box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);
                        padding:32px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🔐</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                Password Reset
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 12px;color:#0f172a;font-size:15px;">
                Hi <strong>${username}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                We received a request to reset the password for your account.
                Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#2563eb;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 32px;
                              color:#ffffff;font-size:15px;font-weight:600;
                              text-decoration:none;letter-spacing:.01em;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;">
                <a href="${resetUrl}"
                   style="color:#2563eb;font-size:12px;font-family:monospace;">
                  ${resetUrl}
                </a>
              </p>

              <!-- Expiry warning -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;
                           padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  ⏱️ <strong>This link expires in 1 hour.</strong>
                  If it has expired, you can request a new one.
                </p>
              </div>

              <!-- Security note -->
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;
                        border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} RBAC System · This is an automated email, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  }

  // Send and return info (contains messageId, etc.)
  const info = await transporter.sendMail(mailOptions)
  return info
}

module.exports = { sendPasswordResetEmail }
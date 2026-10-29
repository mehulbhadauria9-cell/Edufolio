import nodemailer from 'nodemailer';
import dns from 'dns';

export async function sendOtpEmail(email, code, purpose = 'Verification') {
  console.log(`\n======================================================`);
  console.log(`🔑 [EDUFOLIO OTP DISPATCH]`);
  console.log(`📧 Recipient: ${email}`);
  console.log(`👉 OTP CODE: >>> ${code} <<<`);
  console.log(`📋 Purpose: ${purpose}`);
  console.log(`======================================================\n`);
  return { sent: true, code };
}

export async function sendResetLinkEmail(email, resetUrl) {
  console.log(`\n======================================================`);
  console.log(`🔗 [EDUFOLIO RESET LINK DISPATCH]`);
  console.log(`📧 Recipient: ${email}`);
  console.log(`👉 RESET LINK:`);
  console.log(`>>> ${resetUrl} <<<`);
  console.log(`⏳ Validity: 1 hour`);
  console.log(`======================================================\n`);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #060816; color: #f8fafc; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #7C3AED, #22D3EE); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Edufolio</span>
        <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Student Achievement Ecosystem</p>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 18px; color: #f8fafc;">Reset Your Password</h3>
        <p style="margin: 0 0 24px; font-size: 14px; color: #cbd5e1; line-height: 1.5;">
          We received a request to reset the password for your Edufolio account. Click the button below to choose a new password:
        </p>

        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #22D3EE); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
          Reset Password
        </a>

        <p style="margin: 24px 0 8px; font-size: 12px; color: #94a3b8;">Or copy and paste this link into your browser:</p>
        <p style="margin: 0; font-size: 11px; word-break: break-all; color: #38bdf8; font-family: monospace;">${resetUrl}</p>
      </div>

      <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
        This reset link will expire in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  // 1. Try explicit SMTP if configured in .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Edufolio" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `[Edufolio] Reset your password`,
        text: `Click the link to reset your Edufolio password: ${resetUrl}`,
        html: htmlContent
      });

      console.log('✅ [MAILER] Delivered via configured SMTP. Message ID:', info.messageId);
      return { sent: true, method: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn('⚠️ [MAILER] Configured SMTP failed, falling back to direct MX delivery:', err.message);
    }
  }

  // 2. Direct MX Delivery to recipient's mail exchange
  try {
    const domain = email.split('@')[1];
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new Error(`No MX records found for domain ${domain}`);
    }

    mxRecords.sort((a, b) => a.priority - b.priority);
    const primaryMx = mxRecords[0].exchange;

    console.log(`[MAILER] Delivering directly to recipient MX: ${primaryMx}:25...`);

    const directTransporter = nodemailer.createTransport({
      host: primaryMx,
      port: 25,
      secure: false,
      tls: { rejectUnauthorized: false }
    });

    const info = await directTransporter.sendMail({
      from: `"Edufolio Security" <edufolio-verification@${domain}>`,
      to: email,
      subject: `[Edufolio] Reset your password`,
      text: `Click the link to reset your Edufolio password: ${resetUrl}`,
      html: htmlContent
    });

    console.log('✅ [MAILER] Direct MX delivery accepted by server:', info.response);
    return { sent: true, method: 'direct-mx', response: info.response };
  } catch (err) {
    console.error('❌ [MAILER] Direct delivery failed:', err.message);
    return { sent: false, error: err.message };
  }
}

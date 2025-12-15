import nodemailer from 'nodemailer';
import { EmailConfig } from '../models/postgres/emailManagement.model';

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path: string }>;
}): Promise<boolean> => {
  try {

    console.log({ host: process.env.MAIL_HOST, port: process.env.MAIL_PORT });

    const transporter = nodemailer.createTransport({
      host:  "smtp.office365.com",
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,          // STARTTLS on 587
  requireTLS: true,              // enforce TLS upgrade
      auth: {
        user: process.env.MAIL_USER, // woopsa-notification@woopsamarketplace.com
        pass: process.env.MAIL_PASSWORD, // mailbox password OR app password (if MFA)
      },
      tls: {
        // recommended for Office365
        servername: process.env.MAIL_HOST || "smtp.office365.com",
        minVersion: "TLSv1.2",
      },
      // Optional: helpful in production
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
    });

    const fromName = process.env.EMAIL_FROM_NAME || "WOOPSA TEAM";
    const fromAddress = process.env.MAIL_FROM || process.env.MAIL_USER!;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return false;
  }
};



export const sendDistributorEmail = async ( to: string, subject: string, html: string, attachments?: Array<{ filename: string; path: string }>, cc?: string[]) => {
  let config = await EmailConfig.findOne({});
  config = config?.dataValues;
  if (!config) throw new Error('No active email configuration found.');
 
  console.log(config,'config---->');
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      servername: config.host,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  });

  const formattedAttachments = (attachments || []).map((item: any) => {
    if (typeof item === 'string') {
      const filename = item.split('/').pop() || 'attachment';
      return { filename, path: item };
    }
    return item; // already in correct format
  });

  await transporter.sendMail({
    from: `"${config.fromName || 'No Name'}" <${config.fromEmail}>`,
    to,
    cc,
    subject,
    html,
    attachments: formattedAttachments,
    
  });

  return { success: true };
};





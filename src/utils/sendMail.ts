import nodemailer from 'nodemailer';
import { EmailConfig } from '../models/postgres/emailManagement.model';
import { EmailModuleConfig } from '../models/postgres/emailModuleConfig.model';
import { EmailModule } from '../models/postgres/emailModules.model';

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
  
  // Ensure secure is a boolean (handle string "true"/"false" from database)
  const secureValue = config.secure === true || String(config.secure).toLowerCase() === 'true' || Number(config.secure) === 1;
  const port = Number(config.port);
  
  // For port 587, always use secure: false regardless of database value
  // For port 465, always use secure: true
  // For other ports, use the database value or default based on port
  let useSecure: boolean;
  if (port === 587) {
    useSecure = false; // Port 587 must use STARTTLS, not SSL
  } else if (port === 465) {
    useSecure = true; // Port 465 must use SSL
  } else {
    const isSecurePort = port === 465;
    useSecure = secureValue !== undefined ? secureValue : isSecurePort;
  }
  
  const requireTLS = !useSecure && (port === 587 || port === 25);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: port,
    secure: useSecure,
    requireTLS: requireTLS,
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: {
      servername: config.host,
      minVersion: "TLSv1.2",
      rejectUnauthorized: false, // Allow self-signed certificates if needed
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


export const sendTestEmail = async ( to: string, subject: string, html: string, attachments?: Array<{ filename: string; path: string }>, cc?: string[],emailConfig?: any) => {
  if (!emailConfig) {
    throw new Error('Email configuration is required');
  }

  // Ensure secure is a boolean (handle string "true"/"false" from database)
  const secureValue = emailConfig.secure === true || emailConfig.secure === 'true' || emailConfig.secure === 1;
  const port = Number(emailConfig.port);
  
  // For port 587, always use secure: false regardless of database value
  // For port 465, always use secure: true
  // For other ports, use the database value or default based on port
  let useSecure: boolean;
  if (port === 587) {
    useSecure = false; // Port 587 must use STARTTLS, not SSL
  } else if (port === 465) {
    useSecure = true; // Port 465 must use SSL
  } else {
    const isSecurePort = port === 465;
    useSecure = secureValue !== undefined ? secureValue : isSecurePort;
  }
  
  const requireTLS = !useSecure && (port === 587 || port === 25);

  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: port,
    secure: useSecure,
    requireTLS: requireTLS,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    },
    tls: {
      servername: emailConfig.host,
      minVersion: "TLSv1.2",
      rejectUnauthorized: false, // Allow self-signed certificates if needed
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
    from: `"${emailConfig.fromName || 'No Name'}" <${emailConfig.fromEmail}>`,
    to,
    cc,
    subject,
    html,
    attachments: formattedAttachments,
    
  });

  return { success: true };
};


//send Email Marketing 

export const sendEmailMarketing = async ({
  to,
  subject,
  html,
  text,
  attachments,
  cc,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path: string }>;
  cc?: string[];
}): Promise<{ success: boolean; message: string; error?: any }> => {
  try {
    // Find email module by name (e.g., 'email_manangement' or 'email_marketing')
    const emailModule : any = await EmailModule.findOne({
      where: { name: 'email_marketing' },
      include: [
        {
          model: EmailModuleConfig,
          as: 'configs',
          where: { isActive: true },
          required: false,
          order: [['createdAt', 'DESC']],
          limit: 1,
        },
      ],
    });

    if (!emailModule) {
      throw new Error('Email module "email_manangement" not found.');
    }

    console.log('Email module:', emailModule);

    const moduleData: any = emailModule?.toJSON ? emailModule.toJSON() : (emailModule?.dataValues || {});
    
    const emailConfig = moduleData.configs && moduleData.configs.length > 0 ? moduleData.configs[0] : null;

    if (!emailConfig) {
      throw new Error('No active email configuration found for email marketing module.');
    }

    // Ensure secure is a boolean (handle string "true"/"false" from database)
    const secureValue = emailConfig.secure === true || emailConfig.secure === 'true' || emailConfig.secure === 1;
    const port = Number(emailConfig.port);
    
    // Determine secure and requireTLS based on port and secure flag
    // Port 465 = SSL/TLS (secure: true)
    // Port 587 = STARTTLS (secure: false, requireTLS: true)
    const isSecurePort = port === 465;
    
    // For port 587, always use secure: false regardless of database value
    // For port 465, always use secure: true
    // For other ports, use the database value or default based on port
    let useSecure: boolean;
    if (port === 587) {
      useSecure = false; // Port 587 must use STARTTLS, not SSL
    } else if (port === 465) {
      useSecure = true; // Port 465 must use SSL
    } else {
      useSecure = secureValue !== undefined ? secureValue : isSecurePort;
    }
    
    const requireTLS = !useSecure && (port === 587 || port === 25);

    console.log('Email marketing config:', { 
      host: emailConfig.host, 
      port: port, 
      secure: useSecure, 
      requireTLS: requireTLS,
      originalSecure: emailConfig.secure 
    });

    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: port,
      secure: useSecure,
      requireTLS: requireTLS,
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password,
      },
      tls: {
        servername: emailConfig.host,
        minVersion: "TLSv1.2",
        rejectUnauthorized: false, // Allow self-signed certificates if needed
      },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
    });

    const fromName = emailConfig.fromName || "WOOPSA TEAM";
    const fromAddress = emailConfig.fromEmail;

    const formattedAttachments = (attachments || []).map((item: any) => {
      if (typeof item === 'string') {
        const filename = item.split('/').pop() || 'attachment';
        return { filename, path: item };
      }
      return item; // already in correct format
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      cc,
      subject,
      text,
      html,
      attachments: formattedAttachments,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred while sending email";
    console.error("❌ Failed to send email:", error);
    
    // Return error details instead of throwing
    return { 
      success: false, 
      message: errorMessage,
      error: {
        code: error?.code || "EMAIL_SEND_FAILED",
        response: error?.response || null,
        command: error?.command || null,
      }
    };
  }
};





export const generateResetPasswordEmail = (resetLink: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">
          Hi there,<br /><br />
          We received a request to reset your password. Click the button below to proceed:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
            style="background-color: #007bff; color: #fff; padding: 12px 24px; text-decoration: none; font-size: 16px; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #888;">
          If you did not request this password reset, you can safely ignore this email.
        </p>
        <p style="font-size: 14px; color: #888;">
          Thanks,<br />WOOPSA TEAM
        </p>
      </div>
    </div>
  `;
};
//OTP done
export function getPasswordTemplate(name: string, password: string, companyName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>WOOPSA</title>
      <style>
  body {{
    font-family: Arial, sans-serif;
    background-color: #ffffff;
    color: #333;
    margin: 0;
    padding: 20px;
  }}
  .container {{
    max-width: 600px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ddd;
    background-color: #fafafa;
  }}
  h2 {{
    color: #3C7795;
  }}
  p {{
    font-size: 14px;
    line-height: 1.6;
  }}
  .footer {{
    margin-top: 30px;
    font-size: 12px;
    color: #888;
  }}
</style>
      </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🎉 Welcome to Our System</h1>
        </div>
       

        <div class="container">
      <h2>Your Login OTP</h2>
      <p>Hi ${name},</p>
      <p>Use the following One-Time Password (OTP) to complete your login:</p>
      <h3 style="text-align: center;">${password}</h3>
      <p>This OTP is valid for 5 minutes.</p>
    </div>

        
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${companyName} — All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}
// new user created
export function generateNewCredentialsEmail(name: string, email: string, password: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your New Account Credentials</title>
      <style>
      body {{
    font-family: Arial, sans-serif;
    background-color: #ffffff;
    color: #333;
    margin: 0;
    padding: 20px;
  }}
  .container {{
    max-width: 600px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ddd;
    background-color: #fafafa;
  }}
  h2 {{
    color: #3C7795;
  }}
  p {{
    font-size: 14px;
    line-height: 1.6;
  }}
  .footer {{
    margin-top: 30px;
    font-size: 12px;
    color: #888;
  }}
      </style>
    </head>
    <body>

    <div class="container">
      <h2>Welcome to Our Platform!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been successfully created. You can now log in and start managing your orders and account activity.</p>
      <p><strong>Email:</strong> ${email}<br><strong>Temporary Password:</strong> ${password}</p>
      <p>Please change your password after first login.</p>
      <div class="footer">This email was sent by the system automatically. Contact support if you didn’t sign up.</div>
    </div>

      
     
    </body>
    </html>
  `;
}


export function generateOrderConfirmationEmail(
  customerName: string,
  orderNumber: number,
  orderDate: string,

  orderSource: string,
  orderItems: any[],
  Delivery_Charge: number = 0
): string {
  return `



 <!DOCTYPE html>
<html>
  <head>
     <style>body {
    font-family: Arial, sans-serif;
    background-color: #ffffff;
    color: #333;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 800px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ddd;
    background-color: #fafafa;
  }
  h2 {
    color: #3C7795;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    padding: 10px;
    border: 1px solid #ccc;
    text-align: left;
    font-size: 14px;
  }
  th {
    background-color: #f0f0f0;
  }
  .footer {
    margin-top: 30px;
    font-size: 12px;
    color: #888;
  }</style>
  </head>
  <body>
    <div class="container">
  <h2>Order Quotation – Order #${orderNumber}</h2>
  <p>Hi ${customerName},</p>
 
  <p>
    <strong>Order Date:</strong> ${orderDate}
  </p>
   <p>
    <strong>Order Source:</strong> ${orderSource}
  </p>
  <p>
    <strong>Total Estimate:</strong> $${orderItems.reduce((total, item) => total + (item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0) * (item.Quantity_Ordered || 0), 0).toFixed(2)}
  </p>
  <p>
    <strong>Delivery Fees:</strong> $${Delivery_Charge}
  </p>
  <h3>Order Details</h3>
  <table>
    <thead>
      <tr>
        <th>Item No</th>
        <th>Name</th>
        <th>Quantity</th>
        <th>Case</th>
        <th>Size</th>
        <th>Pack</th>
        <th>Price</th>
        <th>Extended Price</th>
      </tr>
    </thead>
   <tbody>
                  ${orderItems.map((item, index) => `
                    <tr >
                      <td >${item.Item_Number || 'N/A'}</td>
                      <td >${item.ItemDescription || 'N/A'}</td>
                      <td >${item.Quantity_Ordered || 0}</td>
                      <td >${item.CaseCount || 0}</td>
                      <td >${item.UOM || 'N/A'}</td>
                      <td >${item.Pack || 0}</td>
                      <td >$${(item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0).toFixed(2)}</td>
                      <td >$${((item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0) * (item.Quantity_Ordered || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
  </table>
  
  <div class="footer">This is a system-generated email. Please do not reply.</div>
</div>
  </body>
</html>

  `;
}

export function generateDistributorOrderNotificationEmail(
  distributorName: string,
  customerName: string,
  customerNumber: number,
  customerEmail: string,
  customerPhone: string,
  orderNumber: number,
  orderDate: string,
  orderSource: string,
  orderItems: any[],
  Delivery_Charge: number = 0
): string {
  return `
   

 <!DOCTYPE html>
<html>
  <head>
     <style>body {
    font-family: Arial, sans-serif;
    background-color: #ffffff;
    color: #333;
    margin: 0;
    padding: 20px;
  }
  .container {
    max-width: 800px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ddd;
    background-color: #fafafa;
  }
  h2 {
    color: #3C7795;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    padding: 10px;
    border: 1px solid #ccc;
    text-align: left;
    font-size: 14px;
  }
  th {
    background-color: #f0f0f0;
  }
  .footer {
    margin-top: 30px;
    font-size: 12px;
    color: #888;
  }</style>
  </head>
  <body>
    <div class="container">
  <h2>Order Quotation – Order #${orderNumber}</h2>
  <p>Hi ${distributorName},</p>
 <p>
    <strong>Placed By:</strong> ${customerName} - ${customerNumber}
  </p>
  <p>
    <strong>Order Date:</strong> ${orderDate} 
  </p>
   <p>
    <strong>Order Source:</strong> ${orderSource}
  </p>
  <p>
    <strong>Total Estimate:</strong> $${orderItems.reduce((total, item) => total + (item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0) * (item.Quantity_Ordered || 0), 0).toFixed(2)}
  </p>
  <p>
    <strong>Delivery Fees:</strong> $${Delivery_Charge}
  </p>
  <h3>Order Details</h3>
  <table>
    <thead>
      <tr>
        <th>Item No</th>
        <th>Name</th>
        <th>Quantity</th>
        <th>Case</th>
        <th>Size</th>
        <th>Pack</th>
        <th>Price</th>
        <th>Extended Price</th>
      </tr>
    </thead>
   <tbody>
                  ${orderItems.map((item, index) => `
                    <tr >
                      <td >${item.Item_Number || 'N/A'}</td>
                      <td >${item.ItemDescription || 'N/A'}</td>
                      <td >${item.Quantity_Ordered || 0}</td>
                      <td >${item.CaseCount || 0}</td>
                      <td >${item.UOM || 'N/A'}</td>
                      <td >${item.Pack || 0}</td>
                      <td >$${(item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0).toFixed(2)}</td>
                      <td >$${((item.Price + item.OTP_Amount_State + item.PrepaidTax_Amount || 0) * (item.Quantity_Ordered || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
  </table>
  
  <div class="footer">This is a system-generated email. Please do not reply.</div>
</div>
  </body>
</html>
  `;
}


export function generateSupportTicketEmail(
  supportTicketId: number,
  supportTicketSubject: string,
  supportTicketDescription: string,
  supportTicketStatus: string,
  supportTicketAttachment?: string,
  customerName?: string
): string {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#ff6b35';
      case 'in progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#3498db';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '🔴';
      case 'in progress': return '🟡';
      case 'resolved': return '🟢';
      case 'closed': return '⚫';
      default: return '🔵';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Support Ticket Update </title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          min-height: 100vh;
          line-height: 1.6;
        }
        
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header p {
          font-size: 18px;
          opacity: 0.95;
          font-weight: 300;
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          color: #2c3e50;
          margin-bottom: 25px;
          font-weight: 500;
        }
        
        .ticket-card {
          background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
          border: 2px solid #e3f2fd;
          border-radius: 16px;
          padding: 30px;
          margin: 25px 0;
          position: relative;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }
        
        .ticket-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, ${getStatusColor(supportTicketStatus)}, ${getStatusColor(supportTicketStatus)}80);
          border-radius: 16px 16px 0 0;
        }
        
        .ticket-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e8f2ff;
        }
        
        .ticket-id {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: ${getStatusColor(supportTicketStatus)}15;
          color: ${getStatusColor(supportTicketStatus)};
          border: 2px solid ${getStatusColor(supportTicketStatus)}30;
          border-radius: 25px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .ticket-details {
          margin-bottom: 25px;
        }
        
        .detail-item {
          margin-bottom: 15px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #34495e;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .detail-value {
          color: #2c3e50;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .description-box {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          padding: 20px;
          margin-top: 10px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .attachment-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e8f2ff;
        }
        
        .attachment-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #ffffff;
          border: 2px solid #e1e8ed;
          border-radius: 10px;
          text-decoration: none;
          color: #3498db;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .attachment-item:hover {
          border-color: #3498db;
          background: #f8f9ff;
        }
        
        .next-steps {
          background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
          border: 2px solid #d4edda;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        
        .next-steps h3 {
          color: #155724;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .next-steps ul {
          list-style: none;
          padding-left: 0;
        }
        
        .next-steps li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
          color: #155724;
        }
        
        .next-steps li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #28a745;
          font-weight: bold;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        
        .footer p {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #495057;
          font-size: 14px;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .email-wrapper {
            border-radius: 16px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .ticket-card {
            padding: 20px;
          }
          
          .ticket-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <h1>🎫 Support Ticket Update</h1>
            <p>We're here to help you with your request</p>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello ${customerName || 'there'},
          </div>
          
          <p style="font-size: 16px; color: #2c3e50; margin-bottom: 25px;">
            Thank you for reaching out to our support team. We've received your ticket and want to keep you informed about its current status.
          </p>
          
          <div class="ticket-card">
            <div class="ticket-header">
              <div class="ticket-id">Ticket #${supportTicketId}</div>
              <div class="status-badge">
                ${getStatusIcon(supportTicketStatus)} ${supportTicketStatus}
              </div>
            </div>
            
            <div class="ticket-details">
              <div class="detail-item">
                <div class="detail-label">Subject</div>
                <div class="detail-value">${supportTicketSubject}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Description</div>
                <div class="description-box">
                  ${supportTicketDescription}
                </div>
              </div>
              
             
            </div>
          </div>
          
          <div class="next-steps">
            <h3>📋 What happens next?</h3>
            <ul>
              <li>Our support team will review your ticket within 24 hours</li>
              <li>You'll receive updates via email as we work on your request</li>
              <li>We may reach out for additional information if needed</li>
              <li>Once resolved, you'll receive a confirmation email</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #2c3e50; margin-top: 25px;">
            If you have any urgent questions or need immediate assistance, please don't hesitate to contact us directly.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>WOOPSA Support Team</strong></p>
          <p>We're committed to providing you with the best possible support experience.</p>
          
          <div class="contact-info">
            <div class="contact-item">
              📧 support@woopsa.com
            </div>
            <div class="contact-item">
              📞 +1 (555) 123-4567
            </div>
            <div class="contact-item">
              🌐 www.woopsa.com/support
            </div>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
export function generateSupportTicketForDistributor(
  supportTicketId: number,
  supportTicketSubject: string,
  supportTicketDescription: string,
  supportTicketStatus: string,
  customerName?: string,
  customerNumber?: number,

): string {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#ff6b35';
      case 'in progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#3498db';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '🔴';
      case 'in progress': return '🟡';
      case 'resolved': return '🟢';
      case 'closed': return '⚫';
      default: return '🔵';
    }
  };

  const getPriorityColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#e74c3c';
      case 'in progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#3498db';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Support Ticket Alert -  Admin</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          min-height: 100vh;
          line-height: 1.6;
        }
        
        .email-wrapper {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .header {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header p {
          font-size: 18px;
          opacity: 0.95;
          font-weight: 300;
        }
        
        .alert-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 15px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .content {
          padding: 40px 30px;
        }
        
        .greeting {
          font-size: 18px;
          color: #2c3e50;
          margin-bottom: 25px;
          font-weight: 500;
        }
        
        .ticket-card {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          border: 2px solid #ffebee;
          border-radius: 16px;
          padding: 30px;
          margin: 25px 0;
          position: relative;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }
        
        .ticket-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, ${getStatusColor(supportTicketStatus)}, ${getStatusColor(supportTicketStatus)}80);
          border-radius: 16px 16px 0 0;
        }
        
        .ticket-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #ffebee;
        }
        
        .ticket-id {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: ${getStatusColor(supportTicketStatus)}15;
          color: ${getStatusColor(supportTicketStatus)};
          border: 2px solid ${getStatusColor(supportTicketStatus)}30;
          border-radius: 25px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .priority-indicator {
          background: ${getPriorityColor(supportTicketStatus)};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .ticket-details {
          margin-bottom: 25px;
        }
        
        .detail-item {
          margin-bottom: 15px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #34495e;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .detail-value {
          color: #2c3e50;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .description-box {
          background: #ffffff;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          padding: 20px;
          margin-top: 10px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .customer-info {
          background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
          border: 2px solid #e3f2fd;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        
        .customer-info h3 {
          color: #1976d2;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        
        .customer-item {
          background: #ffffff;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e3f2fd;
        }
        
        .customer-item-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .customer-item-value {
          font-size: 16px;
          color: #2c3e50;
          font-weight: 500;
        }
        
        .distributor-info {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
          border: 2px solid #ffcc02;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        
        .distributor-info h3 {
          color: #f57c00;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .attachment-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #ffebee;
        }
        
        .attachment-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #ffffff;
          border: 2px solid #e1e8ed;
          border-radius: 10px;
          text-decoration: none;
          color: #3498db;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .attachment-item:hover {
          border-color: #3498db;
          background: #f8f9ff;
        }
        
        .action-required {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 2px solid #ffc107;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        
        .action-required h3 {
          color: #856404;
          font-size: 18px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .action-required ul {
          list-style: none;
          padding-left: 0;
        }
        
        .action-required li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
          color: #856404;
        }
        
        .action-required li::before {
          content: '⚠️';
          position: absolute;
          left: 0;
          font-weight: bold;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e9ecef;
        }
        
        .footer p {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
        }
        
        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #495057;
          font-size: 14px;
        }
        
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          
          .email-wrapper {
            border-radius: 16px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .header h1 {
            font-size: 24px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .ticket-card {
            padding: 20px;
          }
          
          .ticket-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .customer-grid {
            grid-template-columns: 1fr;
          }
          
          .contact-info {
            flex-direction: column;
            gap: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <h1>🚨 Support Ticket Alert</h1>
            <p>New support ticket requires immediate attention</p>
            <div class="alert-badge">ADMIN NOTIFICATION</div>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Hello Admin Team,
          </div>
          
          <p style="font-size: 16px; color: #2c3e50; margin-bottom: 25px;">
            A new support ticket has been submitted and requires your immediate attention. Please review the details below and take appropriate action.
          </p>
          
          <div class="ticket-card">
            <div class="ticket-header">
              <div class="ticket-id">Ticket #${supportTicketId}</div>
              <div class="status-badge">
                ${getStatusIcon(supportTicketStatus)} ${supportTicketStatus}
                <span class="priority-indicator">HIGH PRIORITY</span>
              </div>
            </div>
            
            <div class="ticket-details">
              <div class="detail-item">
                <div class="detail-label">Subject</div>
                <div class="detail-value">${supportTicketSubject}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Description</div>
                <div class="description-box">
                  ${supportTicketDescription}
                </div>
              </div>
            
            </div>
          </div>
          
          <div class="customer-info">
            <h3>👤 Customer Information</h3>
            <div class="customer-grid">
              <div class="customer-item">
                <div class="customer-item-label">Customer Name</div>
                <div class="customer-item-value">${customerName || 'Not provided'}</div>
              </div>
              <div class="customer-item">
                <div class="customer-item-label">Customer Number</div>
                <div class="customer-item-value">${customerNumber || 'Not provided'}</div>
              </div>
            </div>
          </div>
          
       
          
          <div class="action-required">
            <h3>⚡ Required Actions</h3>
            <ul>
              <li>Review the support ticket details immediately</li>
              <li>Assign appropriate team member to handle the case</li>
              <li>Contact customer if additional information is needed</li>
              <li>Update ticket status and provide resolution timeline</li>
              <li>Follow up with customer to ensure satisfaction</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #2c3e50; margin-top: 25px;">
            Please prioritize this ticket and ensure timely resolution. The customer is waiting for your response.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>WOOPSA Admin Team</strong></p>
          <p>This is an automated notification for immediate action required.</p>
          
          <div class="contact-info">
            <div class="contact-item">
              📧 admin@woopsa.com
            </div>
            <div class="contact-item">
              📞 +1 (555) 123-4567
            </div>
            <div class="contact-item">
              🌐 www.woopsa.app
            </div>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
     `;
}


export function generateReturnOrderNotificationEmail(
  distributorName: string,
  customerName: string,
  customerNumber: number,
  customerEmail: string,
  customerPhone: string,
  returnNumber: number,
  returnDate: string,
  returnSource: string,
  returnItems: any[] = []
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #ffffff;
        color: #333;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 800px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ddd;
        background-color: #fafafa;
      }
      h2 {
        color: #c0392b;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        padding: 10px;
        border: 1px solid #ccc;
        text-align: left;
        font-size: 14px;
      }
      th {
        background-color: #f7f7f7;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #888;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Return Request – Return #${returnNumber}</h2>

      <p>Hi ${distributorName},</p>

      <p><strong>Return Requested By:</strong> ${customerName} – ${customerNumber}</p>
      <p><strong>Return Date:</strong> ${returnDate}</p>
      <p><strong>Return Source:</strong> ${returnSource}</p>

      <p>
        <strong>Total Return Value:</strong> 
        $${returnItems
          .reduce(
            (total, item) =>
              total + ((item.Price || 0) * (item.Return_Quantity || 0)),
            0
          )
          .toFixed(2)}
      </p>

      <h3>Return Details</h3>

      <table>
        <thead>
          <tr>
            <th>Item No</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Return Qty</th>
            <th>Case</th>
            <th>Size</th>
            <th>Pack</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          ${returnItems
            .map(
              (item) => `
            <tr>
              <td>${item.Item_Number || 'N/A'}</td>
              <td>${item.ItemDescription || 'N/A'}</td>
              <td>${item.Return_Reason || 'N/A'}</td>
              <td>${item.Return_Quantity || 0}</td>
              <td>${item.CaseCount || 0}</td>
              <td>${item.UOM || 'N/A'}</td>
              <td>${item.Pack || 0}</td>
              <td>$${(item.Price || 0).toFixed(2)}</td>
              <td>$${((item.Price || 0) * (item.Return_Quantity || 0)).toFixed(
                2
              )}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">This is a system-generated email. Please do not reply.</div>
    </div>
  </body>
</html>
  `;
}

import * as nodemailer from 'nodemailer';

// Cấu hình transporter cho Gmail
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Hàm gửi email lead
export async function sendLeadEmail(leadData: {
  name: string;
  company: string;
  email: string;
  phone: string;
  nhuCau: string;
  industry: string;
  companySize: string;
}) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'admakeapp@gmail.com',
    subject: `Lead mới từ ${leadData.company} - ${leadData.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          🎯 Lead mới từ website
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Thông tin khách hàng</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 120px;">Họ và tên:</td>
              <td style="padding: 8px;">${leadData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Công ty:</td>
              <td style="padding: 8px;">${leadData.company}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;">
                <a href="mailto:${leadData.email}" style="color: #007bff;">${leadData.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Điện thoại:</td>
              <td style="padding: 8px;">
                <a href="tel:${leadData.phone}" style="color: #007bff;">${leadData.phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Ngành nghề:</td>
              <td style="padding: 8px;">${leadData.industry}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Quy mô:</td>
              <td style="padding: 8px;">${leadData.companySize}</td>
            </tr>
          </table>
        </div>
        
        ${leadData.nhuCau ? `
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0056b3; margin-top: 0;">Nhu cầu / Ghi chú</h3>
          <p style="margin: 0; line-height: 1.6;">${leadData.nhuCau}</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Email này được gửi tự động từ form lead trên website.<br>
            Thời gian: ${new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email đã được gửi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    throw error;
  }
}

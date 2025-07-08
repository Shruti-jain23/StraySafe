import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.transporter.sendMail({
        from: `"StraySafe" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to StraySafe!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">Welcome to StraySafe, ${name}!</h1>
            <p>Thank you for joining our mission to help stray animals find safety and care.</p>
            <p>With your help, we can make a real difference in animal welfare. Here's what you can do:</p>
            <ul>
              <li>Report stray animals in your area</li>
              <li>Track rescue progress</li>
              <li>Connect with local NGOs and volunteers</li>
            </ul>
            <p>Together, we're saving lives, one report at a time.</p>
            <p>Best regards,<br>The StraySafe Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Send welcome email error:', error);
    }
  }

  async sendReportNotification(email: string, name: string, report: any) {
    try {
      await this.transporter.sendMail({
        from: `"StraySafe" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `New ${report.urgency.toLowerCase()} priority report: ${report.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">New Report Alert</h1>
            <p>Hello ${name},</p>
            <p>A new ${report.urgency.toLowerCase()} priority report has been submitted in your area:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${report.title}</h3>
              <p><strong>Description:</strong> ${report.description}</p>
              <p><strong>Location:</strong> ${report.address}</p>
              <p><strong>Urgency:</strong> ${report.urgency}</p>
              <p><strong>Reported by:</strong> ${report.reportedBy.name}</p>
            </div>
            <p>Please log in to your StraySafe account to view full details and take action.</p>
            <p>Best regards,<br>The StraySafe Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Send report notification error:', error);
    }
  }

  async sendStatusUpdateNotification(email: string, name: string, report: any, newStatus: string) {
    try {
      await this.transporter.sendMail({
        from: `"StraySafe" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Report Update: ${report.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">Report Status Update</h1>
            <p>Hello ${name},</p>
            <p>Your report "${report.title}" has been updated:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>New Status:</strong> ${newStatus.replace('_', ' ')}</p>
              ${report.assignedNGO ? `<p><strong>Assigned to:</strong> ${report.assignedNGO.organizationName}</p>` : ''}
            </div>
            <p>Thank you for helping make a difference in animal welfare!</p>
            <p>Best regards,<br>The StraySafe Team</p>
          </div>
        `
      });
    } catch (error) {
      console.error('Send status update notification error:', error);
    }
  }
}

export const emailService = new EmailService();
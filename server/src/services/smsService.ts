import twilio from 'twilio';

class SMSService {
  private client: twilio.Twilio;

  constructor() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendCriticalAlert(phoneNumber: string, title: string, address: string) {
    try {
      if (!this.client) {
        console.log('Twilio not configured, skipping SMS');
        return;
      }

      await this.client.messages.create({
        body: `🚨 CRITICAL ALERT: ${title} at ${address}. Please check StraySafe app immediately.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
    } catch (error) {
      console.error('Send SMS error:', error);
    }
  }

  async sendStatusUpdate(phoneNumber: string, reportTitle: string, newStatus: string) {
    try {
      if (!this.client) {
        console.log('Twilio not configured, skipping SMS');
        return;
      }

      await this.client.messages.create({
        body: `StraySafe Update: "${reportTitle}" status changed to ${newStatus.replace('_', ' ')}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
    } catch (error) {
      console.error('Send SMS error:', error);
    }
  }
}

export const smsService = new SMSService();
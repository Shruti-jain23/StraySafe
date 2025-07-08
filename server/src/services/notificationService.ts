import prisma from '../config/database';
import { emailService } from './emailService';
import { smsService } from './smsService';

class NotificationService {
  async notifyNearbyNGOs(report: any) {
    try {
      // Find NGOs within 50km radius (simplified calculation)
      const radiusInDegrees = 50 / 111; // Rough conversion
      
      const nearbyNGOs = await prisma.nGOProfile.findMany({
        where: {
          isVerified: true,
          // In production, use proper geospatial queries
        },
        include: {
          user: true
        }
      });

      // Send notifications to nearby NGOs
      const notificationPromises = nearbyNGOs.map(async (ngo) => {
        // Send email notification
        await emailService.sendReportNotification(
          ngo.user.email,
          ngo.user.name,
          report
        );

        // Send SMS for critical cases
        if (report.urgency === 'CRITICAL' && ngo.user.phone) {
          await smsService.sendCriticalAlert(
            ngo.user.phone,
            report.title,
            report.address
          );
        }
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Notify nearby NGOs error:', error);
    }
  }

  async notifyStatusChange(report: any, newStatus: string) {
    try {
      await emailService.sendStatusUpdateNotification(
        report.reportedBy.email,
        report.reportedBy.name,
        report,
        newStatus
      );
    } catch (error) {
      console.error('Notify status change error:', error);
    }
  }

  async notifyReportUpdate(report: any, update: any) {
    try {
      // Notify report owner if update is from NGO
      if (update.author.role === 'NGO' && update.authorId !== report.reportedById) {
        await emailService.sendStatusUpdateNotification(
          report.reportedBy.email,
          report.reportedBy.name,
          report,
          `New update: ${update.message}`
        );
      }

      // Notify NGO if update is from report owner
      if (report.assignedNGO && update.authorId === report.reportedById) {
        await emailService.sendStatusUpdateNotification(
          report.assignedNGO.user.email,
          report.assignedNGO.user.name,
          report,
          `Update from reporter: ${update.message}`
        );
      }
    } catch (error) {
      console.error('Notify report update error:', error);
    }
  }

  async notifyReportAssigned(report: any) {
    try {
      await emailService.sendStatusUpdateNotification(
        report.reportedBy.email,
        report.reportedBy.name,
        report,
        'IN_PROGRESS'
      );
    } catch (error) {
      console.error('Notify report assigned error:', error);
    }
  }
}

export const notificationService = new NotificationService();
import cron from 'node-cron';
import prisma from '../config/database';
import { emailService } from './emailService';

export const startCronJobs = () => {
  // Send daily summary to NGOs (runs at 9 AM every day)
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily NGO summary job...');
    
    try {
      const ngos = await prisma.nGOProfile.findMany({
        where: { isVerified: true },
        include: { user: true }
      });

      for (const ngo of ngos) {
        const pendingReports = await prisma.report.count({
          where: {
            status: 'REPORTED',
            // Add location-based filtering here
          }
        });

        const activeReports = await prisma.report.count({
          where: {
            assignedNGOId: ngo.id,
            status: 'IN_PROGRESS'
          }
        });

        if (pendingReports > 0 || activeReports > 0) {
          // Send daily summary email
          console.log(`Sending daily summary to ${ngo.organizationName}`);
        }
      }
    } catch (error) {
      console.error('Daily summary job error:', error);
    }
  });

  // Clean up old notifications (runs weekly)
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running cleanup job...');
    
    try {
      // Clean up old report updates (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      await prisma.reportUpdate.deleteMany({
        where: {
          createdAt: {
            lt: sixMonthsAgo
          }
        }
      });

      console.log('Cleanup job completed');
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  });

  // Check for stale reports (runs every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const staleReports = await prisma.report.findMany({
        where: {
          status: 'REPORTED',
          urgency: { in: ['HIGH', 'CRITICAL'] },
          createdAt: {
            lt: oneDayAgo
          }
        },
        include: {
          reportedBy: true
        }
      });

      // Send escalation notifications for stale critical reports
      for (const report of staleReports) {
        console.log(`Escalating stale report: ${report.title}`);
        // Send escalation notifications
      }
    } catch (error) {
      console.error('Stale reports check error:', error);
    }
  });

  console.log('Cron jobs started');
};
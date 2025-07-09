import cron from 'node-cron';
import prisma from '../config/database';

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
          }
        });

        const activeReports = await prisma.report.count({
          where: {
            assignedNGOId: ngo.id,
            status: 'IN_PROGRESS'
          }
        });

        if (pendingReports > 0 || activeReports > 0) {
          console.log(`Daily summary for ${ngo.organizationName}: ${pendingReports} pending, ${activeReports} active`);
        }
      }
    } catch (error) {
      console.error('Daily summary job error:', error);
    }
  });

  // Clean up old data (runs weekly)
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running cleanup job...');
    
    try {
      // Clean up old report updates (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const deletedCount = await prisma.reportUpdate.deleteMany({
        where: {
          createdAt: {
            lt: sixMonthsAgo
          }
        }
      });

      console.log(`Cleanup job completed: ${deletedCount.count} old updates removed`);
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

      // Log stale critical reports for escalation
      for (const report of staleReports) {
        console.log(`Stale critical report detected: ${report.title} (${report.urgency})`);
      }
    } catch (error) {
      console.error('Stale reports check error:', error);
    }
  });

  console.log('Cron jobs started');
};
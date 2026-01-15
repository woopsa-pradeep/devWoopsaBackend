// src/workers/emailNotificationWorker.ts
import { Worker, Job } from 'bullmq';
import { EMAIL_NOTIFICATION_QUEUE_NAME, redisConnection, emailNotificationQueue } from '../configuration/config';
import { BulkEmailJobData } from '../interfaces/redis.interface';
import { sendEmail } from '../utils/sendMail';
import { EmailMarketing } from '../models/postgres/emailMarketing.model';

// Helper function to check and update campaign status when all emails are processed
async function checkAndUpdateCampaignStatus(campaignId: number) {
  console.log(`🚀 checkAndUpdateCampaignStatus called for campaign ${campaignId}`);
  try {
    // Wait a bit for job to be fully processed and removed from queue
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh the email marketing record to get latest data
    const updatedCampaign: any = await EmailMarketing.findByPk(campaignId);
    if (!updatedCampaign) {
      console.log(`⚠️ Campaign ${campaignId} not found`);
      return;
    }

    const totalRecipients = Array.isArray(updatedCampaign.to) ? updatedCampaign.to.length : 0;
    const currentFailed = Array.isArray(updatedCampaign.failed_emails) ? updatedCampaign.failed_emails : [];
    
    if (totalRecipients === 0) {
      console.log(`⚠️ Campaign ${campaignId} has no recipients`);
      return;
    }

    console.log(`📊 Campaign ${campaignId}: ${totalRecipients} total, ${currentFailed.length} failed, ${totalRecipients - currentFailed.length} sent`);

    // Check if there are any active, waiting, or delayed jobs for this campaign
    const allJobs = await emailNotificationQueue.getJobs(['active', 'waiting', 'delayed']);
    const campaignActiveJobs = allJobs.filter((job: any) => {
      try {
        return job.data?.id === campaignId;
      } catch (e) {
        return false;
      }
    });
    
    console.log(`🔍 Campaign ${campaignId}: ${campaignActiveJobs.length} active/waiting jobs remaining`);
    
    // If there are no active/waiting jobs, all jobs have been processed
    if (campaignActiveJobs.length === 0) {
      // Calculate how many emails have been processed
      const processedCount = currentFailed.length; // failed emails
      const successfullySent = totalRecipients - currentFailed.length;
      
      console.log(`✅ All jobs completed for campaign ${campaignId}. Processed: ${processedCount} failed, ${successfullySent} sent`);
      
      // Update status based on results
      if (currentFailed.length === 0) {
        // All emails sent successfully
        if (updatedCampaign.status !== 'sent') {
          await updatedCampaign.update({ status: 'sent' });
          console.log(`✅ Campaign ${campaignId} status updated to 'sent' - all ${totalRecipients} emails sent successfully`);
        } else {
          console.log(`ℹ️ Campaign ${campaignId} already marked as 'sent'`);
        }
      } else if (currentFailed.length >= totalRecipients) {
        // All emails failed
        if (updatedCampaign.status !== 'failed') {
          await updatedCampaign.update({ status: 'failed' });
          console.log(`❌ Campaign ${campaignId} status updated to 'failed' - all ${totalRecipients} emails failed`);
        } else {
          console.log(`ℹ️ Campaign ${campaignId} already marked as 'failed'`);
        }
      } else {
        // Some emails sent, some failed - mark as 'sent' (partial success)
        if (updatedCampaign.status !== 'sent') {
          await updatedCampaign.update({ status: 'sent' });
          console.log(`⚠️ Campaign ${campaignId} status updated to 'sent' - ${successfullySent} sent, ${currentFailed.length} failed`);
        } else {
          console.log(`ℹ️ Campaign ${campaignId} already marked as 'sent' (partial)`);
        }
      }
    } else {
      // Still processing jobs for this campaign
      console.log(`⏳ Campaign ${campaignId} still has ${campaignActiveJobs.length} active/waiting jobs - status remains 'queued'`);
    }
  } catch (error: any) {
    console.error(`⚠️ Error checking campaign status for ${campaignId}:`, error.message);
    console.error(error.stack);
  }
}

const worker = new Worker(
  EMAIL_NOTIFICATION_QUEUE_NAME,
  async (job) => {
    const { to, subject, html, attachments, id, cc } = job.data;

    console.log(`📬 Sending notification email to: ${to} (Campaign ID: ${id})`);

    try {
      const success = await sendEmail({
        to,
        subject,
        html,
        attachments,
      });

      if (!success) {
        throw new Error("Notification email sending failed");
      }

      console.log(`✅ Notification email sent to: ${to}`);

      // Update EmailMarketing record on success
      if (id) {
        try {
          const emailMarketing: any = await EmailMarketing.findByPk(id);
          if (emailMarketing) {
            // Remove this email from failed_emails if it was there (in case of retry)
            const existingFailed = Array.isArray(emailMarketing.failed_emails)
              ? emailMarketing.failed_emails
              : [];
            const updatedFailed = existingFailed.filter((email: string) => email.toLowerCase() !== to.toLowerCase());

            const totalRecipients = Array.isArray(emailMarketing.to) ? emailMarketing.to.length : 0;
            
            // Update failed_emails list (remove this email since it was sent successfully)
            await emailMarketing.update({
              failed_emails: updatedFailed,
            });
            
            // For single email campaigns, update status immediately
            if (totalRecipients === 1 && updatedFailed.length === 0) {
              if (emailMarketing.status !== 'sent') {
                await emailMarketing.update({ status: 'sent' });
                console.log(`✅ Single email campaign ${id} status updated to 'sent' immediately`);
              }
            }
            
            // Note: Status will also be updated in the "completed" event handler
            // after checking if all jobs for this campaign are finished
          }
        } catch (updateError) {
          console.error(`⚠️ Failed to update EmailMarketing record ${id}:`, updateError);
          // Don't fail the job if DB update fails - email was sent successfully
        }
      }
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      throw error; // Re-throw to mark job as failed
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // send 1 email at a time
  }
);

worker.on("completed", async (job) => {
  console.log(`🎉 Notification job ${job.id} completed for: ${job.data?.to || 'unknown'}`);
  console.log(`📋 Job data:`, JSON.stringify(job.data, null, 2));
  
  // Check if all emails for this campaign have been processed
  if (job.data && job.data.id) {
    console.log(`🔍 Job completed for campaign ID: ${job.data.id}`);
    try {
      await checkAndUpdateCampaignStatus(job.data.id);
    } catch (error: any) {
      console.error(`⚠️ Error in completed handler for campaign ${job.data.id}:`, error.message);
      console.error(error.stack);
    }
  } else {
    console.log(`⚠️ No campaign ID found in job data. Job data:`, job.data);
  }
});

worker.on("failed", async (job, err) => {
  if (!job) {
    console.error('❌ Job failed but job data is missing');
    return;
  }

  console.log(`📋 Failed job data:`, JSON.stringify(job.data, null, 2));
  const { to, id } = job.data;
  const toEmail = Array.isArray(to) ? to[0] : to;

  console.error(`❌ Notification job ${job.id} failed for ${toEmail}: ${err.message}`);

  // Update EmailMarketing record on failure
  if (id) {
    console.log(`🔍 Processing failure for campaign ID: ${id}`);
    try {
      const emailMarketing: any = await EmailMarketing.findByPk(id);
      if (emailMarketing) {
        const existingFailed = Array.isArray(emailMarketing.failed_emails)
          ? emailMarketing.failed_emails
          : [];

        // Add failed email if not already in the list
        if (!existingFailed.includes(toEmail)) {
          const newFailed = [...existingFailed, toEmail];

          // Check if all emails have failed
          const totalRecipients = Array.isArray(emailMarketing.to) ? emailMarketing.to.length : 0;
          const allFailed = newFailed.length >= totalRecipients;

          await emailMarketing.update({
            failed_emails: newFailed,
          });

          console.log(`📝 Updated EmailMarketing ${id}: ${newFailed.length} failed emails`);
          
          // Check if all emails for this campaign have been processed
          await checkAndUpdateCampaignStatus(id);
        } else {
          console.log(`ℹ️ Email ${toEmail} already in failed list, skipping duplicate`);
        }
      } else {
        console.log(`⚠️ EmailMarketing record not found for campaign ${id}`);
      }
    } catch (updateError: any) {
      console.error(`⚠️ Failed to update EmailMarketing record ${id} on job failure:`, updateError);
      console.error(updateError.stack);
    }
  } else {
    console.log(`⚠️ No campaign ID found in failed job data`);
  }
});

worker.on("error", (error) => {
  console.error('❌ Email notification worker error:', error);
});

worker.on("ready", () => {
  console.log(`✅ Email notification worker is ready and listening for jobs on queue: ${EMAIL_NOTIFICATION_QUEUE_NAME}`);
  console.log(`🔒 This worker will ONLY process emails for this server's queue`);
});

worker.on("active", (job) => {
  console.log(`🔄 Processing notification job ${job.id} for: ${job.data.to}`);
});

worker.on("stalled", (jobId) => {
  console.warn(`⚠️ Notification job ${jobId} stalled`);
});

console.log(`🚀 Email notification worker initializing for queue: ${EMAIL_NOTIFICATION_QUEUE_NAME}`);
console.log(`🔒 Server-specific queue isolation enabled - this server will only process its own emails`);

export default worker;


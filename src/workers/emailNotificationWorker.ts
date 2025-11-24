// src/workers/emailNotificationWorker.ts
import { Worker, Job } from 'bullmq';
import { EMAIL_NOTIFICATION_QUEUE_NAME } from '../configuration/config';
import { BulkEmailJobData } from '../interfaces/redis.interface';
import { sendEmail } from '../utils/sendMail';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
};

const worker = new Worker(
  EMAIL_NOTIFICATION_QUEUE_NAME,
  async (job) => {
    const { to, subject, html, attachments, id } = job.data;

    console.log(`📬 Sending notification email to: ${to}`);

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
  },
  {
    connection,
    concurrency: 1, // send 1 email at a time
  }
);

worker.on("completed", (job) => {
    console.log(job.data,'the job data')
  console.log(`🎉 Notification job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed: ${err.message}`);
});

console.log(`✅ Email notification worker started and listening for jobs on queue: ${EMAIL_NOTIFICATION_QUEUE_NAME}`);

export default worker;


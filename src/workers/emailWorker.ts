// src/workers/emailWorker.ts
import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, redisConnection } from '../configuration/config';
import { BulkEmailJobData } from '../interfaces/redis.interface';
import { sendEmail } from '../utils/sendMail';
import { EmailMarketing } from '../models/postgres/emailMarketing.model';

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const { to, subject, html, text, attachments } = job.data;

    console.log(`📨 Sending email to: ${to}`);

    const success = await sendEmail({
      to,
      subject,
      html,
      text,
      attachments,
    });

    if (!success) {
      throw new Error("Email sending failed");
    }

    console.log(`✅ Email sent to: ${to}`);
  },
  {
    connection: redisConnection,
    concurrency: 1, // send 1 email at a time
  }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", async(job, err) => {

  if (!job) return;

  const { id, to, subject, html, attachments } = job.data;

  const toArray: string[] = Array.isArray(to) ? to : [to];

    // Fetch existing email_marketing row
    const email :any = await EmailMarketing.findByPk(id);
    if (!email) return;

    const existingFailed = Array.isArray(email?.failed_emails)
        ? email?.failed_emails
        : [];

    const newFailed = [...existingFailed, ...toArray];

    await email.update({ failed_emails: newFailed });

  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

worker.on("failed", (job:any, err:any) => {
  console.log(job.data);
  console.error(`❌ Notification job ${job?.id} failed: ${err.message}`);
});

worker.on("drained", () => {
  console.log("✅ All email jobs in this queue are done (queue is empty for now).");
  // put your "all done" logic here (e.g., mark campaign finished, send summary, etc.)
});

worker.on("ready", () => {
  console.log(`✅ Email worker is ready and listening for jobs on queue: ${EMAIL_QUEUE_NAME}`);
  console.log(`🔒 This worker will ONLY process emails for this server's queue`);
});

worker.on("active", (job) => {
  console.log(`🔄 Processing email job ${job.id} for: ${job.data.to}`);
});

worker.on("error", (error) => {
  console.error('❌ Email worker error:', error);
});

worker.on("stalled", (jobId) => {
  console.warn(`⚠️ Email job ${jobId} stalled`);
});

console.log(`🚀 Email worker initializing for queue: ${EMAIL_QUEUE_NAME}`);
console.log(`🔒 Server-specific queue isolation enabled - this server will only process its own emails`);

export default worker;
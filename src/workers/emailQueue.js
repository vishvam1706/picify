import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import { sendEmail } from '../lib/email.js';

export const emailQueueWorker = new Worker(
  'email-queue',
  async (job) => {
    const { to, subject, template, context } = job.data;
    console.log(`[Worker] Sending email to ${to} (Subject: ${subject})`);

    try {
      // Re-use logic from /lib/email.js
      await sendEmail(to, subject, template, context);
      console.log(`[Worker] Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`[Worker] Failed to send email to ${to}:`, error.message);
      throw error; // Retries automatically handled by BullMQ
    }
  },
  { connection: redisConnection, concurrency: 10, skipConfigCheck: true }
);

emailQueueWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

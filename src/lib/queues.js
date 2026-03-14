import { Queue } from 'bullmq';
import getRedisClient from './redis';

let connection = null;

function getConnection() {
  if (connection) return connection;
  const client = getRedisClient();
  if (!client) return null;
  connection = { connection: client };
  return connection;
}

function createQueue(name) {
  const conn = getConnection();
  if (!conn) return null;
  return new Queue(name, {
    connection: conn.connection,
    skipConfigCheck: true,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    },
  });
}

// ── Queue instances ───────────────────────────────────────────
export const imageOptQueue = createQueue('image-optimization');
export const nsfwQueue = createQueue('nsfw-detection');
export const emailQueue = createQueue('email');
export const analyticsQueue = createQueue('analytics');

// ── Job helpers ───────────────────────────────────────────────
export async function enqueueImageOptimization(pinId, imageIndex, cloudinaryPublicId) {
  if (!imageOptQueue) return;
  await imageOptQueue.add('optimize', { pinId, imageIndex, cloudinaryPublicId });
}

export async function enqueueNsfwDetection(pinId, imageUrl) {
  if (!nsfwQueue) return;
  await nsfwQueue.add('detect', { pinId, imageUrl });
}

export async function enqueueEmail(emailData) {
  if (!emailQueue) return;
  await emailQueue.add('send', emailData, { priority: 1 });
}

export async function enqueueAnalytics(data) {
  if (!analyticsQueue) return;
  await analyticsQueue.add('record', data);
}

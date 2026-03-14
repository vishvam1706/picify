import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import Pin from '../models/Pin.js';
import Report from '../models/Report.js';
import fetch from 'node-fetch';

// In a real production setup, we would load the ML model once here
// Note: @tensorflow/tfjs-node was omitted due to windows build issues.
// For the sake of this MVP, if the model isn't available, we use an external API / mock.

export const nsfwDetectionWorker = new Worker(
  'nsfw-detection',
  async (job) => {
    const { pinId, imageUrl } = job.data;
    console.log(`[Worker] Scanning image ${imageUrl} for Pin ${pinId} for NSFW content`);

    try {
      const pin = await Pin.findById(pinId);
      if (!pin || pin.isDeleted) return;

      // Note: Because we removed tfjs-node, we will simulate the detection
      // by flagging images that have "nsfw" in the title or tags as a fallback mock logic.
      // In a real app, you would pass `buffer` into `nsfwjs.classify(image)`.

      let isNsfw = false;
      const combinedText = `${pin.title} ${pin.description} ${pin.tags?.join(' ')}`.toLowerCase();
      
      if (combinedText.includes('nsfw') || combinedText.includes('nude') || combinedText.includes('porn')) {
        isNsfw = true;
      }

      if (isNsfw) {
        // Auto-hide the pin
        pin.isDeleted = true; // Soft delete or put in a specific "quarantine" state
        pin.isPublic = false;
        await pin.save();

        // Create an automatic admin report
        await Report.create({
          pinId: pin._id,
          reporterId: pin.userId, // System flags it under the owner
          reason: 'Other',
          details: 'Automated NSFW Detection Flagged this content.',
          status: 'pending'
        });

        console.log(`[Worker] Image flagged as NSFW: ${imageUrl}`);
      } else {
        console.log(`[Worker] Image is clean: ${imageUrl}`);
      }
    } catch (error) {
      console.error(`[Worker] NSFW detection failed for ${imageUrl}:`, error.message);
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 2, skipConfigCheck: true }
);

nsfwDetectionWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

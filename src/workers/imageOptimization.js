import { Worker } from 'bullmq';
import { redisConnection } from '../lib/redis.js';
import Pin from '../models/Pin.js';
import { uploadBuffer, deleteAsset } from '../lib/cloudinary.js';
import { compressImage } from '../lib/imageProcessor.js';
import fetch from 'node-fetch'; // need a way to fetch the stream back from cloudinary for sharp

export const imageOptimizationWorker = new Worker(
  'image-optimization',
  async (job) => {
    const { pinId, imageIndex, publicId } = job.data;
    console.log(`[Worker] Optimizing image ${publicId} for Pin ${pinId}`);

    try {
      const pin = await Pin.findById(pinId);
      if (!pin || pin.isDeleted) return;

      const imgData = pin.images[imageIndex];
      // If already compressed, skip
      if (imgData.isCompressed) {
        console.log(`[Worker] Image ${publicId} already optimized. Skipping.`);
        return;
      }

      // Download original from Cloudinary to buffer
      const response = await fetch(imgData.url);
      const buffer = await response.buffer();

      // Compress via Sharp
      const compressedBuffer = await compressImage(buffer, imgData.format);

      // Re-upload to Cloudinary (overwrite existing)
      const cldRes = await uploadBuffer(compressedBuffer, {
        public_id: publicId,
        overwrite: true,
        invalidate: true
      });

      // Update Pin document
      pin.images[imageIndex].url = cldRes.secure_url;
      pin.images[imageIndex].size = cldRes.bytes;
      pin.images[imageIndex].isCompressed = true;
      
      pin.markModified('images');
      await pin.save();

      console.log(`[Worker] Successfully optimized ${publicId}`);
    } catch (error) {
      console.error(`[Worker] Image optimization failed for ${publicId}:`, error.message);
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 5, skipConfigCheck: true }
);

imageOptimizationWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

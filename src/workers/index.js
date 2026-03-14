import dotenv from 'dotenv';
// Load env vars if running locally outside of Next.js
dotenv.config({ path: '.env.local' });

import dbConnect from '../lib/db.js';
import { imageOptimizationWorker } from './imageOptimization.js';
import { nsfwDetectionWorker } from './nsfwDetection.js';
import { emailQueueWorker } from './emailQueue.js';

async function startWorkers() {
  console.log('🔄 Starting BullMQ Background Workers...');
  
  try {
    // Attempt DB connection
    await dbConnect();
    console.log('✅ Connected to MongoDB for workers');
  } catch (err) {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1);
  }

  // Workers are initialized by merely importing them & starting their processes.
  console.log('✅ Image Optimization Worker listening...');
  console.log('✅ NSFW Detection Worker listening...');
  console.log('✅ Email Worker listening...');
  
  // Optional healthcheck/shutdown logic
  process.on('SIGINT', async () => {
    console.log('Shutting down workers...');
    await imageOptimizationWorker.close();
    await nsfwDetectionWorker.close();
    await emailQueueWorker.close();
    process.exit(0);
  });
}

startWorkers();

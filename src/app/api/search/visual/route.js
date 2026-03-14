import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import { withAuth, parseMultiFormData, apiSuccess, apiError } from '@/lib/apiHelpers';
import { computeImageHash } from '@/lib/imageProcessor';

// Helper to calculate Hamming distance between two 64-bit hex strings
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2) return Infinity; // Max penalty
  try {
    const hex1 = BigInt('0x' + hash1);
    const hex2 = BigInt('0x' + hash2);
    let xor = hex1 ^ hex2;
    let distance = 0;
    while (xor > 0n) {
      if (xor & 1n) distance++;
      xor >>= 1n;
    }
    return distance;
  } catch (e) {
    return Infinity;
  }
}

export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { files } = await parseMultiFormData(request);

    if (!files || files.length === 0) {
      return apiError('An image is required for visual search', 400);
    }

    // 1. Compute perceptual hash of uploaded image
    const searchHash = await computeImageHash(files[0].buffer);
    if (!searchHash) {
      return apiError('Could not process image for visual search', 500);
    }

    // 2. Fetch all public pins that have a hash (This is a simplified approach)
    // In a massive production DB, you'd use a dedicated vector DB (Milvus, Pinecone, or Atlas Vector Search on embeddings).
    // For this MVP, we fetch recent/popular pins and filter by hamming distance in memory.
    
    const candidatePins = await Pin.find({
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      imageHash: { $ne: null }
    })
    .sort({ savesCount: -1, views: -1 })
    .limit(1000) // Bound the search space to the top 1000 popular pins
    .populate('userId', 'username displayName profileImage')
    .lean();

    // 3. Compute Hamming Distance for all candidates
    const scoredPins = candidatePins.map(pin => {
      const distance = hammingDistance(searchHash, pin.imageHash);
      return { ...pin, visualDistance: distance };
    });

    // 4. Sort by distance (lower is better, e.g., < 10 is very similar)
    scoredPins.sort((a, b) => a.visualDistance - b.visualDistance);

    // 5. Return top 20 visually similar results
    const results = scoredPins.filter(p => p.visualDistance <= 25).slice(0, 20); // Arbitrary threshold

    return apiSuccess({ docs: results, computedSearchHash: searchHash });
  } catch (err) {
    console.error('[POST search visual]', err);
    return apiError('Visual search failed', 500);
  }
});

import { checkNsfw } from '@/lib/gemini';
import { withOptionalAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// POST /api/ai/nsfw-check
// Body: { imageBase64, mimeType }
// Returns: { isNSFW, nsfwScore, reason }
export const POST = withOptionalAuth(async (request) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return apiSuccess({ isNSFW: false, nsfwScore: 0, reason: 'NSFW check unavailable' });
    }

    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64) return apiError('imageBase64 is required', 400);

    const result = await checkNsfw(imageBase64, mimeType || 'image/jpeg');
    return apiSuccess(result);
  } catch (err) {
    console.error('[POST /api/ai/nsfw-check]', err);
    return apiSuccess({ isNSFW: false, nsfwScore: 0 }); // fail open — never block upload on error
  }
});

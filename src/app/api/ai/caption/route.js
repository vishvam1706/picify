import { generateCaption } from '@/lib/gemini';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = withAuth(async (request) => {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return apiError('imageBase64 and mimeType are required', 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      return apiError('AI configuration is missing', 503);
    }

    const caption = await generateCaption(imageBase64, mimeType);
    
    return apiSuccess({ caption });
  } catch (err) {
    console.error('[POST ai caption]', err);
    return apiError('Failed to generate caption', 500);
  }
});

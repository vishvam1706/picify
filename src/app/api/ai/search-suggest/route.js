import { generateSearchSuggestions } from '@/lib/gemini';
import { apiSuccess, apiError } from '@/lib/apiHelpers';

export const POST = async (request) => {
  try {
    const { query } = await request.json();

    if (!query) {
      return apiError('Query string is required', 400);
    }

    if (!process.env.GEMINI_API_KEY) {
      return apiError('AI configuration is missing', 503);
    }

    const suggestions = await generateSearchSuggestions(query);
    
    return apiSuccess({ suggestions });
  } catch (err) {
    console.error('[POST ai search suggest]', err);
    return apiError('Failed to generate suggestions', 500);
  }
};

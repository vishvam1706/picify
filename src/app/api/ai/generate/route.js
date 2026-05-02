import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST = withAuth(async (request) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return apiError('AI configuration is missing — GEMINI_API_KEY not set', 503);
    }

    const { imageBase64, mimeType } = await request.json();
    if (!imageBase64 || !mimeType) {
      return apiError('imageBase64 and mimeType are required', 400);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use stable model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this image and respond in valid JSON only. No markdown, no explanation, just raw JSON.
Return this exact structure:
{
  "title": "A short catchy Pinterest-style title (max 60 chars)",
  "description": "A detailed description of the image. Include what is shown, mood/aesthetic, and use-cases (max 250 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const raw = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return apiSuccess({
      title: parsed.title || '',
      description: parsed.description || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).toLowerCase().trim()) : [],
    });
  } catch (err) {
    console.error('[POST /api/ai/generate]', err);
    return apiError('AI generation failed: ' + err.message, 500);
  }
});

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
  if (genAI) return genAI;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

async function generateText(prompt) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateFromImage(imageBase64, mimeType, prompt) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } },
  ]);
  return result.response.text().trim();
}

export async function generateCaption(imageBase64, mimeType = 'image/jpeg') {
  return generateFromImage(
    imageBase64,
    mimeType,
    'Write a short, catchy Pinterest-style caption for this image. Max 120 characters. No hashtags.'
  );
}

export async function generateHashtags(imageBase64, mimeType = 'image/jpeg') {
  const raw = await generateFromImage(
    imageBase64,
    mimeType,
    'Generate 10 relevant Pinterest hashtags for this image. Return only the hashtags, comma-separated, without # symbols.'
  );
  return raw.split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
}

export async function generateTitle(imageBase64, mimeType = 'image/jpeg') {
  return generateFromImage(
    imageBase64,
    mimeType,
    'Generate a short, descriptive title for this Pinterest pin. Max 60 characters.'
  );
}

export async function generateDescription(imageBase64, mimeType = 'image/jpeg') {
  return generateFromImage(
    imageBase64,
    mimeType,
    'Write a detailed description for this Pinterest pin. Include what is shown, the mood/aesthetic, and potential use-cases. Max 300 characters.'
  );
}

export async function generateSearchSuggestions(query) {
  const raw = await generateText(
    `Suggest 8 related Pinterest search queries for: "${query}". Return only the suggestions, one per line, no numbering.`
  );
  return raw.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8);
}

export async function generateSmartSearchKeywords(query) {
  const raw = await generateText(
    `Expand the search query "${query}" into relevant keywords for a Pinterest-like search. Return 5 keywords, comma-separated.`
  );
  return raw.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 5);
}

const NSFW_PROMPT = `Analyze this image for NSFW (Not Safe For Work) content.
NSFW includes: nudity, sexual content, graphic violence, gore, or explicit adult material.
Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{"isNSFW": false, "score": 0.05, "reason": "safe image"}
- "isNSFW" must be true or false
- "score" must be a number between 0.0 (completely safe) and 1.0 (extremely NSFW)
- "reason" is a brief explanation (max 10 words)
Use score > 0.6 as the threshold for isNSFW = true.`;

function parseNsfwResponse(text) {
  const clean = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(clean);
  const score = parseFloat(parsed.score) || 0;
  const isNSFW = parsed.isNSFW === true || score > 0.6;
  console.log(`[NSFW] score=${score} isNSFW=${isNSFW} reason="${parsed.reason}"`);
  return { isNSFW, nsfwScore: score };
}

/**
 * checkNsfw — Analyse an image using a base64 string + mimeType.
 * Useful when the buffer is already in memory.
 */
export async function checkNsfw(imageBase64, mimeType = 'image/jpeg') {
  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      NSFW_PROMPT,
      { inlineData: { data: imageBase64, mimeType } },
    ]);
    return parseNsfwResponse(result.response.text());
  } catch (err) {
    // If Gemini's own safety filters block the response entirely, it's definitely NSFW
    if (err.message && err.message.includes('Response was blocked due to')) {
      console.warn(`[NSFW] Gemini hard-blocked the image: ${err.message}`);
      return { isNSFW: true, nsfwScore: 1.0 };
    }
    console.warn('[NSFW] checkNsfw failed (non-blocking):', err.message);
    return { isNSFW: false, nsfwScore: 0 };
  }
}

/**
 * checkNsfwFromUrl — Fetch an image from a public URL (e.g. Cloudinary)
 * and send it to Gemini Vision for NSFW analysis.
 * Preferred over checkNsfw when the image is already uploaded — no need
 * to keep the raw buffer in memory.
 */
export async function checkNsfwFromUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${imageUrl}`);

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const model = getClient().getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      NSFW_PROMPT,
      { inlineData: { data: base64, mimeType } },
    ]);
    return parseNsfwResponse(result.response.text());
  } catch (err) {
    // If Gemini's own safety filters block the response entirely, it's definitely NSFW
    if (err.message && err.message.includes('Response was blocked due to')) {
      console.warn(`[NSFW] Gemini hard-blocked the image from URL: ${err.message}`);
      return { isNSFW: true, nsfwScore: 1.0 };
    }
    console.warn('[NSFW] checkNsfwFromUrl failed (non-blocking):', err.message);
    return { isNSFW: false, nsfwScore: 0 };
  }
}

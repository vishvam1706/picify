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
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateFromImage(imageBase64, mimeType, prompt) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

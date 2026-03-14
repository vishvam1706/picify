import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Activity from '@/models/Activity';
import Board from '@/models/Board';
import { withAuth, withOptionalAuth, parseMultiFormData, apiSuccess, apiError } from '@/lib/apiHelpers';
import { uploadBuffer } from '@/lib/cloudinary';
import {
  getImageMetadata,
  extractColorPalette,
  computeImageHash,
} from '@/lib/imageProcessor';
import {
  enqueueImageOptimization,
  enqueueNsfwDetection,
} from '@/lib/queues';
import {
  generateCaption,
  generateHashtags,
  generateTitle,
  generateDescription,
} from '@/lib/gemini';

export const POST = withAuth(async (request) => {
  try {
    await dbConnect();
    const { fields, files } = await parseMultiFormData(request);

    if (!files || files.length === 0) {
      return apiError('At least one image is required', 400);
    }

    if (files.length > 10) {
      return apiError('Maximum 10 images allowed per pin', 400);
    }

    // Prepare arrays for uploaded images and parallel AI tasks
    const uploadedImages = [];
    let dominantColorPalette = [];
    let imageHash = null;

    // Process all images concurrently for fast upload
    const uploadPromises = files.map(async (file, index) => {
      // Get base metadata (width/height/format before upload)
      const meta = await getImageMetadata(file.buffer);

      // Upload raw to Cloudinary immediately
      const cldRes = await uploadBuffer(file.buffer, {
        folder: `picify/pins/${request.user.username}`,
        resource_type: 'image',
      });

      // Extract colors & hash from the FIRST image only (primary)
      if (index === 0) {
        try {
          // Parallelize vibrant & imghash
          const [colors, hash] = await Promise.all([
            extractColorPalette(file.buffer),
            computeImageHash(file.buffer),
          ]);
          dominantColorPalette = colors;
          imageHash = hash;
        } catch (e) {
          console.error('[Pin Create] Color/Hash Extraction Error:', e.message);
        }
      }

      return {
        url: cldRes.secure_url,
        publicId: cldRes.public_id,
        width: meta.width,
        height: meta.height,
        size: meta.size,
        format: meta.format,
        isCompressed: false, // BullMQ worker will compress it later
      };
    });

    uploadedImages.push(...(await Promise.all(uploadPromises)));

    // Handle AI Generation if requested
    let aiTitle = fields.title;
    let aiDescription = fields.description;
    let aiCaption = null;
    let aiHashtags = [];

    const generateAi = fields.autoGenerate === 'true';
    if (generateAi && process.env.GEMINI_API_KEY) {
      try {
        const primaryImgBuffer = files[0].buffer;
        const mime = files[0].mimetype;
        const b64 = primaryImgBuffer.toString('base64');

        const tasks = [
          generateCaption(b64, mime).catch(() => null),
          generateHashtags(b64, mime).catch(() => []),
        ];

        if (!aiTitle) tasks.push(generateTitle(b64, mime).catch(() => fields.title || 'Untitled'));
        if (!aiDescription) tasks.push(generateDescription(b64, mime).catch(() => ''));

        const [cap, tags, autoT, autoD] = await Promise.all(tasks);

        aiCaption = cap;
        aiHashtags = tags;
        if (!aiTitle && autoT) aiTitle = autoT;
        if (!aiDescription && autoD) aiDescription = autoD;
      } catch (err) {
        console.error('[Pin Create] AI Gen Error:', err.message);
      }
    }

    if (!aiTitle) aiTitle = 'Untitled Pin';

    // Build the pin object
    const pinData = {
      userId: request.user._id,
      title: aiTitle,
      description: aiDescription,
      images: uploadedImages,
      isPrimaryCarousel: uploadedImages.length > 1,
      sourceLink: fields.sourceLink || null,
      tags: [...new Set([...(fields.tags ? fields.tags.split(',') : []), ...aiHashtags])].map((t) => t.trim().toLowerCase()).filter(Boolean),
      categories: fields.categories ? fields.categories.split(',').map((c) => c.trim()) : [],
      colorPalette: dominantColorPalette,
      aiCaption,
      aiDescription,
      aiTitle,
      aiHashtags,
      imageHash,
      isPublic: fields.isPublic !== 'false', // default true
      isDraft: fields.isDraft === 'true',
      orientation: uploadedImages[0].width > uploadedImages[0].height ? 'landscape' : uploadedImages[0].width < uploadedImages[0].height ? 'portrait' : 'square',
      boardId: fields.boardId || null,
      publishedAt: fields.isDraft === 'true' ? null : new Date(),
    };

    const newPin = await Pin.create(pinData);

    // If attached to board, increment count
    if (fields.boardId) {
      await Board.findByIdAndUpdate(fields.boardId, { $inc: { pinsCount: 1 } });
    }

    // Activity feed
    if (!newPin.isDraft && newPin.isPublic) {
      await Activity.create({
        userId: request.user._id,
        type: 'pin_created',
        entityId: newPin._id,
        entityType: 'pin'
      });
    }

    // Background jobs
    // 1. Image Optimization worker
    uploadedImages.forEach((img, idx) => {
      enqueueImageOptimization(newPin._id.toString(), idx, img.publicId);
    });

    // 2. NSFW Detection worker (on primary image)
    enqueueNsfwDetection(newPin._id.toString(), uploadedImages[0].url);

    return apiSuccess(newPin, 201);
  } catch (err) {
    console.error('[POST pin create]', err);
    return apiError('Failed to create pin', 500);
  }
});

export const GET = withOptionalAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    // Filters
    const userId = searchParams.get('userId');
    const boardId = searchParams.get('boardId');
    const tag = searchParams.get('tag');
    const category = searchParams.get('category');

    await dbConnect();

    // Default: Only public, non-deleted, published pins
    const query = {
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      publishedAt: { $lte: new Date() }
    };

    // Apply specific filters
    if (userId) query.userId = userId;
    if (boardId) query.boardId = boardId;
    if (tag) query.tags = tag.toLowerCase();
    if (category) query.categories = category;

    // If viewing own pins, allow seeing drafts and private pins
    if (request.user && userId === request.user._id.toString()) {
      delete query.isPublic;
      delete query.isDraft;
      delete query.publishedAt; // user sees their own future scheduled pins too
    }

    const pins = await Pin.paginate(query, {
      page,
      limit,
      sort: { publishedAt: -1, createdAt: -1 },
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true
    });

    return apiSuccess({
      docs: pins.docs,
      totalDocs: pins.totalDocs,
      page: pins.page,
      totalPages: pins.totalPages,
      hasNextPage: pins.hasNextPage,
    });
  } catch (err) {
    console.error('[GET pins]', err);
    return apiError('Failed to fetch pins', 500);
  }
});

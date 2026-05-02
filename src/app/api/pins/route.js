import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Activity from '@/models/Activity';
import Board from '@/models/Board';
import { withAuth, withOptionalAuth, parseMultiFormData, apiSuccess, apiError } from '@/lib/apiHelpers';
import { uploadBuffer } from '@/lib/cloudinary';
import { getBlockedUserIds, applyBlockFilter } from '@/lib/blockFilter';
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
  checkNsfwFromUrl,
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

    // Handle AI Generation on primary image
    let aiTitle = fields.title;
    let aiDescription = fields.description;
    let aiCaption = null;
    let aiHashtags = [];

    const primaryImgBuffer = files[0].buffer;
    const primaryMime = files[0].mimetype;
    const primaryB64 = primaryImgBuffer.toString('base64');

    const generateAi = fields.autoGenerate === 'true';

    if (generateAi && process.env.GEMINI_API_KEY) {
      const aiTasks = [
        generateCaption(primaryB64, primaryMime).catch(() => null),
        generateHashtags(primaryB64, primaryMime).catch(() => []),
      ];
      if (!aiTitle) aiTasks.push(generateTitle(primaryB64, primaryMime).catch(() => fields.title || 'Untitled'));
      if (!aiDescription) aiTasks.push(generateDescription(primaryB64, primaryMime).catch(() => ''));

      const [cap, tags, autoT, autoD] = await Promise.all(aiTasks);
      aiCaption = cap;
      aiHashtags = tags || [];
      if (!aiTitle && autoT) aiTitle = autoT;
      if (!aiDescription && autoD) aiDescription = autoD;
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
      isPublic: fields.isPublic !== 'false',
      isDraft: fields.isDraft === 'true',
      orientation: uploadedImages[0].width > uploadedImages[0].height ? 'landscape' : uploadedImages[0].width < uploadedImages[0].height ? 'portrait' : 'square',
      boardId: fields.boardId || null,
      publishedAt: fields.isDraft === 'true' ? null : new Date(),
      affiliateLink: fields.affiliateLink || null,
      isSponsored: fields.isSponsored === 'true',
    };

    const newPin = await Pin.create(pinData);

    // Board count + Activity feed (only for clean, non-NSFW pins)
    const boardUpdate = fields.boardId
      ? Board.findByIdAndUpdate(fields.boardId, { $inc: { pinsCount: 1 } })
      : Promise.resolve();

    const activityCreate = (!newPin.isDraft && newPin.isPublic)
      ? Activity.create({ userId: request.user._id, type: 'pin_created', entityId: newPin._id, entityType: 'pin' })
      : Promise.resolve();

    await Promise.all([boardUpdate, activityCreate]);

    // Background image optimisation
    uploadedImages.forEach((img, idx) => {
      enqueueImageOptimization(newPin._id.toString(), idx, img.publicId);
    });

    // ── Post-publish NSFW check ──────────────────────────────────────────
    // Uses the Cloudinary URL of the uploaded image — no raw buffer needed.
    if (process.env.GEMINI_API_KEY) {
      try {
        const cloudinaryUrl = uploadedImages[0].url;
        console.log(`[NSFW check] starting for pin ${newPin._id} with URL: ${cloudinaryUrl}`);
        
        const { isNSFW, nsfwScore } = await checkNsfwFromUrl(cloudinaryUrl);
        console.log(`[NSFW check] complete for pin ${newPin._id}: isNSFW=${isNSFW}, score=${nsfwScore}`);

        if (isNSFW) {
          // 1. Hard-delete the pin
          await Pin.findByIdAndDelete(newPin._id);

          // 2. Send a system notification warning the user
          const Notification = (await import('@/models/Notification')).default;
          await Notification.create({
            userId: request.user._id,
            type: 'system',
            message: `⚠️ Your pin “${newPin.title}” was automatically removed. Our AI detected potentially NSFW content (${Math.round(nsfwScore * 100)}% confidence). Repeated violations may result in account restrictions.`,
          });

          console.warn(`[NSFW] Pin ${newPin._id} removed — score=${nsfwScore}`);

          return apiError(
            `Your pin was removed after our AI detected NSFW content (${Math.round(nsfwScore * 100)}% confidence). You have been notified.`,
            422
          );
        }
      } catch (nsfwErr) {
        // NSFW check failed — do NOT block publishing. Pin stays live.
        console.error('[NSFW post-check] error (non-blocking):', nsfwErr);
      }
    } else {
      console.log('[NSFW check] skipped: GEMINI_API_KEY is missing');
    }

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

    // Default: Only public, non-deleted, published, safe-for-work pins
    let query = {
      isPublic: true,
      isDeleted: false,
      isDraft: false,
      isNSFW: { $ne: true }, // hide NSFW from default feed
      publishedAt: { $lte: new Date() }
    };

    // Apply specific filters
    if (userId && userId !== 'undefined') query.userId = userId;
    if (boardId && boardId !== 'undefined') query.boardId = boardId;
    if (tag) query.tags = tag.toLowerCase();
    if (category) query.categories = category;

    // If viewing own pins, allow seeing drafts and private pins
    if (request.user && userId === request.user._id.toString()) {
      delete query.isPublic;
      delete query.isDraft;
      delete query.publishedAt; // user sees their own future scheduled pins too
    }

    // Filter out pins from blocked users (only for authenticated users viewing a feed, not their own profile)
    if (request.user && userId !== request.user._id.toString()) {
      const blockedIds = await getBlockedUserIds(request.user._id);
      query = applyBlockFilter(query, blockedIds);
    }

    const pins = await Pin.paginate(query, {
      page,
      limit,
      sort: { publishedAt: -1, createdAt: -1 },
      populate: { path: 'userId', select: 'username displayName profileImage' },
      lean: true
    });

    let results = pins.docs;

    if (request.user) {
      const SavedPin = (await import('@/models/SavedPin')).default;
      const savedPinIds = await SavedPin.find({ userId: request.user._id, pinId: { $in: results.map(r => r._id) } }).distinct('pinId');
      const savedSet = new Set(savedPinIds.map(id => id.toString()));
      const userIdStr = request.user._id.toString();

      results = results.map(p => {
        const isSaved = savedSet.has(p._id.toString());
        const isLiked = p.likes && p.likes.some(id => id.toString() === userIdStr);
        const obj = { ...p, isSaved, isLiked };
        delete obj.likes;
        delete obj.saves;
        return obj;
      });
    } else {
      results = results.map(p => {
        const obj = { ...p };
        delete obj.likes;
        delete obj.saves;
        return obj;
      });
    }

    return apiSuccess({
      docs: results,
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

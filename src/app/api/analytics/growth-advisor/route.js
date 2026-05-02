import dbConnect from '@/lib/db';
import Pin from '@/models/Pin';
import Earnings from '@/models/Earnings';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/analytics/growth-advisor — AI-powered growth tips
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;

    const pins = await Pin.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('title tags categories likesCount savesCount commentsCount views publishedAt')
      .lean();

    const totalPins = pins.length;
    const totalViews = pins.reduce((s, p) => s + (p.views || 0), 0);
    const totalLikes = pins.reduce((s, p) => s + (p.likesCount || 0), 0);
    const totalSaves = pins.reduce((s, p) => s + (p.savesCount || 0), 0);
    const engRate = totalViews > 0 ? ((totalLikes + totalSaves) / totalViews * 100).toFixed(1) : 0;

    const topPin = pins.sort((a, b) =>
      ((b.views || 0) + (b.likesCount || 0) * 3 + (b.savesCount || 0) * 5) -
      ((a.views || 0) + (a.likesCount || 0) * 3 + (a.savesCount || 0) * 5)
    )[0];

    // Build advice based on actual stats (AI-style rules engine)
    const advice = [];

    if (totalPins < 5) {
      advice.push({
        type: 'growth',
        priority: 'high',
        title: 'Post More Content',
        body: 'Creators with 10+ pins see 3x more profile visits. Try posting at least 3 pins per week to build momentum.',
        icon: '📌',
      });
    }

    if (engRate < 2) {
      advice.push({
        type: 'engagement',
        priority: 'high',
        title: 'Boost Engagement',
        body: `Your engagement rate is ${engRate}%. Top creators average 5–8%. Use strong CTAs in descriptions and add more specific tags.`,
        icon: '💬',
      });
    }

    const tagsUsed = new Set(pins.flatMap(p => p.tags || []));
    if (tagsUsed.size < 5) {
      advice.push({
        type: 'discovery',
        priority: 'medium',
        title: 'Use More Tags',
        body: 'You\'re using very few unique tags. Tags help users discover your content. Use 5–10 relevant tags per pin.',
        icon: '🏷️',
      });
    }

    if (totalSaves > totalLikes * 2) {
      advice.push({
        type: 'insight',
        priority: 'info',
        title: 'Highly Saveable Content',
        body: 'Your saves-to-likes ratio is excellent! Your content is considered useful/reference-worthy. Keep creating how-to and inspirational pins.',
        icon: '⭐',
      });
    }

    if (topPin) {
      advice.push({
        type: 'opportunity',
        priority: 'medium',
        title: `Replicate Your Top Performer`,
        body: `Your pin "${topPin.title}" is your best performer. Create similar content in the same category and with similar tags to replicate its success.`,
        icon: '🚀',
      });
    }

    advice.push({
      type: 'timing',
      priority: 'info',
      title: 'Best Time to Post',
      body: 'Based on platform trends, posting between 7–9 PM local time on weekdays drives 40% more initial engagement.',
      icon: '⏰',
    });

    return apiSuccess({
      summary: { totalPins, totalViews, totalLikes, totalSaves, engagementRate: engRate },
      advice,
    });
  } catch (err) {
    console.error('[GET /api/analytics/growth-advisor]', err);
    return apiError('Failed to generate growth advice', 500);
  }
});

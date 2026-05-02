import dbConnect from '@/lib/db';
import Earnings from '@/models/Earnings';
import User from '@/models/User';
import { withAuth, apiSuccess, apiError } from '@/lib/apiHelpers';

// GET /api/monetization/overview
export const GET = withAuth(async (request) => {
  try {
    await dbConnect();
    const userId = request.user._id;

    const [earnings, user] = await Promise.all([
      Earnings.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      User.findById(userId).select('isCreator stripeConnectedAccountId stripeCustomerId tipsEnabled').lean(),
    ]);

    // Try to get live Stripe account status
    let chargesEnabled = false;
    let detailsSubmitted = false;
    if (user?.stripeConnectedAccountId) {
      try {
        const stripe = (await import('@/lib/stripe')).default;
        const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId);
        chargesEnabled = account.charges_enabled;
        detailsSubmitted = account.details_submitted;
      } catch { /* stripe call failed, ignore */ }
    }

    const totalEarnings = earnings
      .filter(e => e.status === 'completed')
      .reduce((s, e) => s + e.amount, 0);

    const pendingEarnings = earnings
      .filter(e => e.status === 'pending')
      .reduce((s, e) => s + e.amount, 0);

    const byType = earnings.reduce((acc, e) => {
      if (!acc[e.type]) acc[e.type] = 0;
      if (e.status === 'completed') acc[e.type] += e.amount;
      return acc;
    }, {});

    // Monthly breakdown (last 6 months)
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthEarnings = earnings
        .filter(e => e.status === 'completed' && new Date(e.createdAt) >= monthStart && new Date(e.createdAt) <= monthEnd)
        .reduce((s, e) => s + e.amount, 0);
      monthlyBreakdown.push({ month, amount: monthEarnings });
    }

    return apiSuccess({
      isStripeConnected: !!user?.stripeConnectedAccountId,
      detailsSubmitted,
      chargesEnabled,
      isCreator: user?.isCreator || false,
      tipsEnabled: user?.tipsEnabled || false,
      totalEarnings,      // in cents
      pendingEarnings,    // in cents
      byType,
      monthlyBreakdown,
      recentTransactions: earnings.slice(0, 10),
    });
  } catch (err) {
    console.error('[GET /api/monetization/overview]', err);
    return apiError('Failed to fetch monetization data', 500);
  }
});


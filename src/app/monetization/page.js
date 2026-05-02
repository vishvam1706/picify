'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, DollarSign, TrendingUp, CreditCard, Gift, CheckCircle2, BarChart3, Shield, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';

function MoneyCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

const PLANS = [
  {
    id: 'starter', name: 'Creator Starter', price: '$0', period: 'Forever free',
    features: ['Basic analytics', 'Unlimited pins & boards', 'Follow & like', 'Basic profile'],
    cta: 'Current Plan', disabled: true, highlight: false,
  },
  {
    id: 'pro', name: 'Creator Pro', price: '$9', period: '/month',
    features: ['Advanced analytics', 'Scheduled pins', 'Priority in explore', 'AI growth advisor', 'Custom profile badge', 'Export analytics'],
    cta: 'Upgrade to Pro', disabled: false, highlight: true,
  },
  {
    id: 'brand', name: 'Brand Creator', price: '$29', period: '/month',
    features: ['Everything in Pro', 'Sponsored pin campaigns', 'Affiliate link tracking', 'Brand collaboration inbox', 'Revenue dashboard', 'Dedicated support'],
    cta: 'Go Brand Creator', disabled: false, highlight: false,
  },
];

export default function MonetizationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [togglingTips, setTogglingTips] = useState(false);
  const [features, setFeatures] = useState({
    monetization: false,
    creator_subscriptions: false,
    affiliate_pins: false,
    sponsored_pins: false,
    brand_collaborations: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load feature flags from admin panel
  useEffect(() => {
    fetch('/api/system/status')
      .then(r => r.json())
      .then(d => { if (d.success && d.data.features) setFeatures(d.data.features); })
      .catch(() => {});
  }, []);

  // Handle Stripe return
  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      toast({ title: '🎉 Stripe Connected!', description: 'Your account is now linked. Enable tips to start earning.' });
    } else if (stripeStatus === 'refresh') {
      toast({ title: 'Onboarding incomplete', description: 'Please reconnect Stripe to finish setup.', variant: 'destructive' });
    }
  }, [searchParams, toast]);

  const fetchOverview = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/monetization/overview');
      const data = await res.json();
      if (data.success) setOverview(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/monetization/connect', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast({ title: data.error || 'Failed to connect Stripe', variant: 'destructive' });
        setConnectingStripe(false);
      }
    } catch {
      toast({ title: 'Error connecting Stripe', variant: 'destructive' });
      setConnectingStripe(false);
    }
  };

  const handleToggleTips = async () => {
    if (!overview?.isStripeConnected) {
      toast({ title: 'Connect Stripe first', description: 'You need a connected Stripe account to enable tips.', variant: 'destructive' });
      return;
    }
    if (!overview?.chargesEnabled) {
      toast({ title: 'Stripe onboarding incomplete', description: 'Please finish your Stripe account setup before enabling tips.', variant: 'destructive' });
      return;
    }
    setTogglingTips(true);
    try {
      const res = await fetch('/api/monetization/tips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !overview.tipsEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setOverview(prev => ({ ...prev, tipsEnabled: data.data.tipsEnabled }));
        toast({ title: data.data.tipsEnabled ? '✅ Tips Enabled!' : '🔕 Tips Disabled' });
      } else {
        toast({ title: data.error || 'Failed to update tips', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error updating tips setting', variant: 'destructive' });
    } finally {
      setTogglingTips(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const stripeConnected = overview?.isStripeConnected;
  const onboardingComplete = overview?.chargesEnabled;

  // Each card maps to a feature flag key. renderAction() shows when the flag is enabled.
  const featureCards = [
    {
      icon: '💰',
      title: 'Tips & Donations',
      desc: 'Fans can tip you directly on your pins and profile. You keep 90% of every tip.',
      flagKey: 'monetization',
      renderAction: () => (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{overview?.tipsEnabled ? '✅ Tips are enabled' : 'Tips are disabled'}</p>
            {!stripeConnected && <p className="text-xs text-muted-foreground mt-0.5">Connect Stripe to enable</p>}
            {stripeConnected && !onboardingComplete && <p className="text-xs text-amber-500 mt-0.5">Complete Stripe setup to enable</p>}
          </div>
          <button
            onClick={handleToggleTips}
            disabled={togglingTips || !stripeConnected || !onboardingComplete}
            className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${overview?.tipsEnabled ? 'bg-primary' : 'bg-secondary'}`}
          >
            {togglingTips
              ? <Loader2 className="absolute inset-0 m-auto w-3.5 h-3.5 animate-spin text-muted-foreground" />
              : <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${overview?.tipsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            }
          </button>
        </div>
      ),
    },
    {
      icon: '📌',
      title: 'Sponsored Pins',
      desc: 'Partner with brands to promote their products on your boards and get paid per impression.',
      flagKey: 'sponsored_pins',
      renderAction: () => (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Mark pins as sponsored when creating</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
        </div>
      ),
    },
    {
      icon: '🔗',
      title: 'Affiliate Pins',
      desc: 'Add affiliate links to any pin and earn commission on sales. Supports Amazon, ShareASale, and more.',
      flagKey: 'affiliate_pins',
      renderAction: () => (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Add affiliate links when creating pins</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
        </div>
      ),
    },
    {
      icon: '🤝',
      title: 'Brand Collaborations',
      desc: 'Get discovered by brands looking for creators in your niche. Accept or decline deal requests.',
      flagKey: 'brand_collaborations',
      renderAction: () => (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Brand Deal button visible on your profile</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
        </div>
      ),
    },
    {
      icon: '💎',
      title: 'Creator Subscriptions',
      desc: 'Charge a monthly fee for exclusive boards, early access, and behind-the-scenes content.',
      flagKey: 'creator_subscriptions',
      renderAction: () => (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Subscribe button visible on your profile</p>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#c0001e] to-[#7c3aed] text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8" />
            <h1 className="text-4xl font-black tracking-tight">Monetize Your Creativity</h1>
          </div>
          <p className="text-white/80 text-lg max-w-xl">Turn your passion into income. Earn from tips, brand deals, affiliate links, and creator subscriptions.</p>
          <div className="flex gap-3 mt-6">
            {!stripeConnected ? (
              <button onClick={handleConnectStripe} disabled={connectingStripe} className="bg-white text-primary font-bold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg disabled:opacity-70">
                {connectingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {connectingStripe ? 'Redirecting...' : 'Connect Stripe'}
              </button>
            ) : !onboardingComplete ? (
              <button onClick={handleConnectStripe} disabled={connectingStripe} className="bg-amber-400 text-black font-bold px-6 py-2.5 rounded-full flex items-center gap-2 hover:bg-amber-300 transition-all shadow-lg disabled:opacity-70">
                {connectingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                Complete Stripe Setup
              </button>
            ) : (
              <div className="bg-white/20 text-white font-semibold px-6 py-2.5 rounded-full flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-300" /> Stripe Connected
              </div>
            )}
            <a href="#plans" className="border border-white/30 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/10 transition-all">
              View Plans
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-12">

        {/* Stripe Status Banner */}
        {stripeConnected && !onboardingComplete && (
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Stripe onboarding incomplete</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">You must finish setting up your Stripe account to receive payments and enable tips.</p>
            </div>
            <button onClick={handleConnectStripe} disabled={connectingStripe} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex-shrink-0">
              Finish Setup <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Earnings Overview */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div>
            <h2 className="text-xl font-black mb-5">Your Earnings</h2>
            {!stripeConnected ? (
              <div className="glass-card rounded-2xl p-8 border-2 border-dashed border-primary/30 text-center">
                <CreditCard className="w-12 h-12 text-primary/50 mx-auto mb-3" />
                <p className="font-bold text-lg mb-1">No payment method connected</p>
                <p className="text-muted-foreground text-sm mb-5">Connect Stripe to start receiving payments from tips, subscriptions, and brand deals.</p>
                <Button onClick={handleConnectStripe} disabled={connectingStripe} className="rounded-full px-8 shadow-lg shadow-primary/20">
                  {connectingStripe ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  {connectingStripe ? 'Redirecting to Stripe...' : 'Connect Stripe'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MoneyCard title="Total Earned" value={`$${(overview.totalEarnings / 100).toFixed(2)}`} icon={DollarSign} color="#10b981" subtitle="All time" />
                <MoneyCard title="Pending" value={`$${(overview.pendingEarnings / 100).toFixed(2)}`} icon={TrendingUp} color="#f59e0b" subtitle="Processing" />
                <MoneyCard title="This Month" value={`$${((overview.monthlyBreakdown?.at(-1)?.amount || 0) / 100).toFixed(2)}`} icon={BarChart3} color="#7c3aed" subtitle="Current month" />
                <MoneyCard title="Tips Received" value={`$${((overview.byType?.tip || 0) / 100).toFixed(2)}`} icon={Gift} color="#e60023" subtitle="From fans" />
              </div>
            )}
          </div>
        )}

        {/* Monetization Methods — live flag-driven */}
        <div>
          <h2 className="text-xl font-black mb-2">Ways to Earn</h2>
          <p className="text-muted-foreground text-sm mb-6">Features below are controlled by the platform administrator.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featureCards.map(card => {
              const enabled = !!features[card.flagKey];
              return (
                <div
                  key={card.title}
                  className={`glass-card rounded-2xl p-5 border transition-all flex gap-4 ${enabled ? 'border-border hover:border-primary/30' : 'border-border/40 opacity-60'}`}
                >
                  <span className="text-3xl mt-0.5">{card.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold">{card.title}</p>
                      {enabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Available</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{card.desc}</p>
                    {enabled
                      ? card.renderAction()
                      : <p className="text-xs text-muted-foreground italic">This feature has been disabled by the platform administrator.</p>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plans */}
        <div id="plans">
          <h2 className="text-xl font-black mb-2">Creator Plans</h2>
          <p className="text-muted-foreground text-sm mb-6">Upgrade to unlock more powerful monetization and analytics tools</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.id} className={`glass-card rounded-2xl p-6 border-2 transition-all relative ${plan.highlight ? 'border-primary shadow-xl shadow-primary/10' : 'border-border'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
                )}
                <p className="font-bold text-lg mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={plan.disabled}
                  onClick={() => toast({ title: plan.id === 'starter' ? 'This is your current plan' : 'Upgrade coming soon!' })}
                  className={`w-full rounded-full font-bold ${plan.highlight ? 'shadow-lg shadow-primary/25' : ''}`}
                  variant={plan.highlight ? 'default' : 'secondary'}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="glass-card rounded-2xl p-5 border border-border flex items-center gap-4">
          <Shield className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Secure Payments via Stripe</p>
            <p className="text-xs text-muted-foreground">All payments are processed by Stripe with bank-level encryption. We never store your payment details. <a href="https://stripe.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Learn more →</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

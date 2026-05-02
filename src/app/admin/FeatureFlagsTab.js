'use client';
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';

export default function FeatureFlagsTab() {
  const { toast } = useToast();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      const d = await res.json();
      if (d.success) setFlags(d.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const handleToggle = async (flag) => {
    setSaving(flag.key);
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
      });
      if (res.ok) {
        setFlags(f => f.map(fl => fl.key === flag.key ? { ...fl, enabled: !fl.enabled } : fl));
        toast({ title: `${flag.label} ${!flag.enabled ? 'enabled' : 'disabled'}` });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(''); }
  };

  const GROUPS = {
    'AI Features': ['ai_captions', 'ai_hashtags', 'ai_toxic_filter', 'nsfw_detection'],
    'Monetization': ['monetization', 'creator_subscriptions', 'affiliate_pins', 'sponsored_pins', 'brand_collaborations'],
    'Creator Tools': ['private_vault', 'scheduled_pins', 'analytics_export'],
    'Safety': ['parental_controls', 'identity_verification'],
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const grouped = Object.values(GROUPS).flat();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Toggle platform features in real-time without a deployment</p>
        <button onClick={fetch_}><RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
      </div>
      {Object.entries(GROUPS).map(([name, keys]) => {
        const group = flags.filter(f => keys.includes(f.key));
        if (!group.length) return null;
        return (
          <div key={name} className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-secondary/30 border-b border-border"><h4 className="font-bold text-sm">{name}</h4></div>
            {group.map(flag => (
              <div key={flag.key} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
                <div className="flex-1 pr-4">
                  <p className="font-medium text-sm">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                </div>
                <button onClick={() => handleToggle(flag)} disabled={saving === flag.key}
                  className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${flag.enabled ? 'bg-primary' : 'bg-secondary'}`}>
                  {saving === flag.key
                    ? <Loader2 className="w-3 h-3 animate-spin absolute inset-0 m-auto" />
                    : <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${flag.enabled ? 'translate-x-6' : ''}`} />}
                </button>
              </div>
            ))}
          </div>
        );
      })}
      {(() => {
        const rest = flags.filter(f => !grouped.includes(f.key));
        if (!rest.length) return null;
        return (
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-secondary/30 border-b border-border"><h4 className="font-bold text-sm">Other</h4></div>
            {rest.map(flag => (
              <div key={flag.key} className="flex items-center justify-between px-5 py-4 border-b border-border last:border-0">
                <div className="flex-1 pr-4"><p className="font-medium text-sm">{flag.label}</p><p className="text-xs text-muted-foreground">{flag.description}</p></div>
                <button onClick={() => handleToggle(flag)} className={`relative w-12 h-6 rounded-full transition-colors ${flag.enabled ? 'bg-primary' : 'bg-secondary'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${flag.enabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

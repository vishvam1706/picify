'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, Ban, MessageCircle, Flag, Lock, Eye, EyeOff, UserX, AlertTriangle, CheckCircle2, Trash2, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toaster';
import Link from 'next/link';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'blocked', label: 'Blocked Users', icon: Ban },
  { id: 'reports', label: 'My Reports', icon: Flag },
  { id: 'privacy', label: 'Privacy Settings', icon: Lock },
  { id: 'safety_tips', label: 'Safety Tips', icon: AlertTriangle },
];

/* ─── Report Modal ─── */
function ReportModal({ target, onClose, onSubmit }) {
  const REASONS = ['spam', 'inappropriate', 'copyright', 'harassment', 'other'];
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    await onSubmit({ reason, description });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-[2rem] w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-black mb-1">Report Content</h2>
        <p className="text-sm text-muted-foreground mb-6">Help us keep the community safe. All reports are reviewed by our team.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Reason *</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button type="button" key={r} onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-all ${reason === r ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1.5">Additional details (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[80px]"
              maxLength={500} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-full">Cancel</Button>
            <Button type="submit" disabled={!reason || submitting} className="flex-1 rounded-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Blocked Users Tab ─── */
function BlockedUsersTab() {
  const { toast } = useToast();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null); // track which userId is being unblocked

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/blocked');
      const data = await res.json();
      if (data.success) setBlocked(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleUnblock = async (blockedUserId) => {
    setUnblocking(blockedUserId);
    try {
      const res = await fetch(`/api/users/${blockedUserId}/block`, { method: 'DELETE' });
      if (res.ok) {
        // Filter by blockedUserId (not document _id)
        setBlocked(prev => prev.filter(u => u.blockedUserId !== blockedUserId));
        toast({ title: '✅ User unblocked' });
      } else {
        const data = await res.json();
        toast({ title: data.error || 'Failed to unblock', variant: 'destructive' });
      }
    } catch { toast({ title: 'Failed to unblock', variant: 'destructive' }); }
    finally { setUnblocking(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">Blocked users cannot see your profile, pins, or boards. They also cannot follow, comment, or message you.</p>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {blocked.length === 0 ? (
          <div className="py-16 text-center">
            <UserX className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No blocked users</p>
          </div>
        ) : blocked.map(u => (
          <div key={u._id} className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
            <Avatar src={u.blockedUser?.profileImage} alt={u.blockedUser?.username} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{u.blockedUser?.displayName || u.blockedUser?.username}</p>
              <p className="text-sm text-muted-foreground">@{u.blockedUser?.username}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleUnblock(u.blockedUserId)}
              disabled={unblocking === u.blockedUserId}
              className="rounded-full min-w-[90px]"
            >
              {unblocking === u.blockedUserId
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : 'Unblock'
              }
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── My Reports Tab ─── */
function MyReportsTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSubmitReport = async ({ reason, description }) => {
    // For demo: report a generic "test" entity
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: '000000000000000000000000', entityType: 'pin', reason, description })
      });
      const data = await res.json();
      if (res.ok) { toast({ title: 'Report submitted' }); fetch_(); setShowModal(false); }
      else toast({ title: data.error || 'Failed', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const STATUS_COLOR = { pending: '#f97316', reviewed: '#06b6d4', resolved: '#10b981', dismissed: '#888' };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Reports you've submitted to our team</p>
        <Button size="sm" variant="secondary" onClick={() => setShowModal(true)} className="rounded-full">
          <Flag className="w-3.5 h-3.5 mr-1.5" /> New Report
        </Button>
      </div>

      {showModal && <ReportModal onClose={() => setShowModal(false)} onSubmit={handleSubmitReport} />}

      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {reports.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No reports submitted</p>
          </div>
        ) : reports.map(r => (
          <div key={r._id} className="flex items-start gap-4 p-4 border-b border-border last:border-0">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm capitalize">{r.reason}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: (STATUS_COLOR[r.status] || '#888') + '20', color: STATUS_COLOR[r.status] || '#888' }}>{r.status}</span>
              </div>
              <p className="text-xs text-muted-foreground">{r.description || 'No additional details'}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Privacy Settings Tab ─── */
function PrivacyTab({ user }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    isPublic: user?.privacy?.isPublic ?? true,
    showSavedPins: user?.privacy?.showSavedPins ?? true,
    showFollowers: user?.privacy?.showFollowers ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: settings }),
      });
      if (res.ok) toast({ title: 'Privacy settings saved' });
      else toast({ title: 'Failed to save', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const Toggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)} className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl">
      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Profile Visibility</h3>
        <p className="text-sm text-muted-foreground mb-4">Control who can see your profile and content</p>
        <Toggle label="Public Profile" desc="Anyone can view your profile and pins" value={settings.isPublic} onChange={v => setSettings(s => ({ ...s, isPublic: v }))} />
        <Toggle label="Show Saved Pins" desc="Let others see your saved pins section" value={settings.showSavedPins} onChange={v => setSettings(s => ({ ...s, showSavedPins: v }))} />
        <Toggle label="Show Followers List" desc="Let others see who follows you" value={settings.showFollowers} onChange={v => setSettings(s => ({ ...s, showFollowers: v }))} />
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Data & Security</h3>
        <p className="text-sm text-muted-foreground mb-4">Manage your account security settings</p>
        <Link href="/settings" className="flex items-center justify-between py-3 border-b border-border hover:text-primary transition-colors">
          <span className="text-sm font-medium">Change Password</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <Link href="/2fa" className="flex items-center justify-between py-3 border-b border-border hover:text-primary transition-colors">
          <span className="text-sm font-medium">Two-Factor Authentication</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
        <button className="flex items-center justify-between py-3 w-full text-left hover:text-primary transition-colors">
          <span className="text-sm font-medium">Download My Data</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-between py-3 w-full text-left text-red-500 hover:text-red-400 transition-colors">
          <span className="text-sm font-medium">Delete Account</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <Button onClick={handleSave} disabled={saving} className="rounded-full px-8 shadow-lg shadow-primary/20">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Privacy Settings
      </Button>
    </div>
  );
}

/* ─── Safety Tips Tab ─── */
function SafetyTipsTab() {
  const tips = [
    { icon: '🔒', title: 'Enable Two-Factor Authentication', desc: 'Add an extra layer of security to your account. Even if your password is stolen, 2FA keeps you protected.' },
    { icon: '🚨', title: 'Report Suspicious Content', desc: 'If you see spam, harassment, or inappropriate content, use the Report button. Our team reviews all reports within 24 hours.' },
    { icon: '🚫', title: 'Block Harrassing Users', desc: 'You can block any user from viewing your profile or contacting you. They won\'t be notified that you\'ve blocked them.' },
    { icon: '🔐', title: 'Use a Strong Password', desc: 'Use at least 12 characters with a mix of letters, numbers, and symbols. Never reuse passwords across sites.' },
    { icon: '👁️', title: 'Control Your Visibility', desc: 'Set your profile to private if you only want followers you approve to see your content.' },
    { icon: '💬', title: 'Restrict Who Comments', desc: 'You can restrict comments on your pins from non-followers or turn them off entirely from your pin settings.' },
    { icon: '📧', title: 'Watch for Phishing', desc: 'We will never ask for your password via email. If you receive suspicious emails claiming to be from Picify, report them.' },
    { icon: '👶', title: 'Parental Controls', desc: 'If you manage an account for a minor, enable Safe Mode in settings to filter mature content automatically.' },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="glass-card rounded-2xl p-4 bg-green-500/5 border border-green-500/20 flex items-center gap-3">
        <Shield className="w-8 h-8 text-green-500 shrink-0" />
        <div>
          <p className="font-bold text-sm">Your Account is Protected</p>
          <p className="text-xs text-muted-foreground">We use AES-256 encryption, rate limiting, and AI-powered abuse detection to keep your account safe.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {tips.map(tip => (
          <div key={tip.title} className="glass-card rounded-2xl p-4 border border-border flex gap-4">
            <span className="text-2xl mt-0.5">{tip.icon}</span>
            <div>
              <p className="font-bold text-sm mb-1">{tip.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-5 border border-border text-center">
        <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="font-semibold text-sm mb-1">Community Guidelines</p>
        <p className="text-xs text-muted-foreground mb-3">Read our full community guidelines to understand what's allowed on Picify.</p>
        <Link href="/guidelines" className="text-primary font-semibold text-sm hover:underline">Read Guidelines →</Link>
      </div>
    </div>
  );
}

/* ─── Main Safety Page ─── */
export default function SafetyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Safety & Privacy</h1>
              <p className="text-muted-foreground text-sm">Manage your privacy, blocked users, and safety settings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Ban, label: 'Blocked Users', desc: 'Manage users you\'ve blocked', tab: 'blocked', color: '#ef4444' },
                { icon: Flag, label: 'My Reports', desc: 'Track reports you\'ve submitted', tab: 'reports', color: '#f97316' },
                { icon: Lock, label: 'Privacy Settings', desc: 'Control your profile visibility', tab: 'privacy', color: '#7c3aed' },
                { icon: AlertTriangle, label: 'Safety Tips', desc: 'Stay safe on Picify', tab: 'safety_tips', color: '#10b981' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                    className="glass-card rounded-2xl p-5 border border-border hover:border-primary/30 transition-all text-left flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: item.color + '20' }}>
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-bold">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'blocked' && <BlockedUsersTab />}
        {activeTab === 'reports' && <MyReportsTab />}
        {activeTab === 'privacy' && <PrivacyTab user={user} />}
        {activeTab === 'safety_tips' && <SafetyTipsTab />}
      </div>
    </div>
  );
}

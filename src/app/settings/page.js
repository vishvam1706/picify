'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import {
  User, Lock, Eye, Palette, Shield, Loader2, Check,
  Camera, Globe, Moon, Sun, Monitor, ChevronRight, Bell, Download, Gift
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'monetization', label: 'Monetization', icon: Check },
];

function Section({ title, children }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, maxLength, readOnly, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`w-full h-11 bg-secondary/60 rounded-xl px-4 text-sm outline-none ring-2 ${error ? 'ring-destructive focus:ring-destructive/20' : 'ring-transparent focus:ring-primary/25'} transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {error && <p className="text-sm text-destructive mt-0.5">{error}</p>}
    </div>
  );
}

// Profile Tab
function ProfileTab({ user, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    profileImage: user?.profileImage || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { 
    setForm(f => ({ ...f, [k]: e.target.value })); 
    setErrors(prev => ({...prev, [k]: undefined}));
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors = {};
    if (form.username && form.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (form.username && !/^[a-zA-Z0-9_]+$/.test(form.username)) newErrors.username = 'Letters, numbers, and underscores only';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data.data);
        toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
      } else {
        toast({ title: data.error || 'Save failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Avatar picker */}
      <Section title="Profile Photo">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <Avatar src={form.profileImage} alt={form.username} size="xxl" />
            <button className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Profile Photo URL</p>
            <input
              type="url"
              value={form.profileImage}
              onChange={set('profileImage')}
              placeholder="https://..."
              className="w-full h-10 bg-secondary/60 rounded-xl px-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all"
            />
          </div>
        </div>
      </Section>

      <Section title="Basic Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Display Name" value={form.displayName} onChange={set('displayName')} placeholder="Your name" maxLength={50} error={errors.displayName} />
          <InputField label="Username" value={form.username} onChange={set('username')} placeholder="username" maxLength={30} error={errors.username} />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-muted-foreground">Bio</label>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            maxLength={200}
            rows={3}
            placeholder="Write a short bio..."
            className="w-full mt-1.5 bg-secondary/60 rounded-xl px-4 py-3 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{form.bio.length}/200</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="url"
            value={form.website}
            onChange={set('website')}
            placeholder="Your website URL"
            className="flex-1 h-10 bg-secondary/60 rounded-xl px-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all"
          />
        </div>
      </Section>

      <Button onClick={handleSave} disabled={saving} className="self-start rounded-full px-8">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Save Changes</>}
      </Button>
    </div>
  );
}

// Account / Password Tab
function AccountTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { 
    setForm(f => ({ ...f, [k]: e.target.value })); 
    setErrors(prev => ({...prev, [k]: undefined}));
  };

  const handleChange = async () => {
    setErrors({});
    const newErrors = {};
    
    if (!form.currentPassword && user.password) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password updated successfully!' });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast({ title: data.error || 'Failed to update password', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'An error occurred while saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This will delete your account and all your data. This action cannot be undone.')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Account deleted' });
        window.location.href = '/login';
      } else {
        toast({ title: 'Failed to delete account', variant: 'destructive' });
        setSaving(false);
      }
    } catch {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Email">
        <InputField label="Email Address" value={user?.email || ''} readOnly type="email" />
        <p className="text-xs text-muted-foreground mt-2">Contact support to change your email address.</p>
      </Section>

      <Section title="Change Password">
        <div className="flex flex-col gap-4">
          <InputField label="Current Password" value={form.currentPassword} onChange={set('currentPassword')} type="password" placeholder="••••••••" error={errors.currentPassword} />
          <InputField label="New Password" value={form.newPassword} onChange={set('newPassword')} type="password" placeholder="••••••••" error={errors.newPassword} />
          <InputField label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="••••••••" error={errors.confirmPassword} />
        </div>
        <Button onClick={handleChange} disabled={saving} className="mt-4 rounded-full px-6" size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update Password
        </Button>
      </Section>

      <Section title="Danger Zone">
        <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all of your data. This action cannot be undone.</p>
        <Button variant="destructive" className="rounded-full px-6" size="sm" onClick={handleDeleteAccount} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Delete Account
        </Button>
      </Section>
    </div>
  );
}

// Privacy & Features Tab
function PrivacyTab() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  // Sync from user whenever user object changes (fixes reset-on-tab-switch bug)
  const [settings, setSettings] = useState(() => ({
    profilePublic: user?.privacy?.isPublic ?? true,
    showFollowers: user?.privacy?.showFollowers ?? true,
    showSavedPins: user?.privacy?.showSavedPins ?? true,
    isCreator: user?.isCreator ?? false,
  }));

  useEffect(() => {
    if (user) {
      setSettings({
        profilePublic: user.privacy?.isPublic ?? true,
        showFollowers: user.privacy?.showFollowers ?? true,
        showSavedPins: user.privacy?.showSavedPins ?? true,
        isCreator: user.isCreator ?? false,
      });
    }
  }, [user]);

  const saveSettings = useCallback(async (newSettings) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privacy: {
            isPublic: newSettings.profilePublic,
            showFollowers: newSettings.showFollowers,
            showSavedPins: newSettings.showSavedPins,
          },
          isCreator: newSettings.isCreator,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.data.user);
        toast({ title: 'Privacy settings saved!' });
      } else {
        toast({ title: data.error || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [toast, updateUser]);

  const toggle = useCallback((k) => {
    setSettings(prev => {
      const next = { ...prev, [k]: !prev[k] };
      saveSettings(next);
      return next;
    });
  }, [saveSettings]);

  const privacyOptions = [
    { key: 'profilePublic', label: 'Public profile', desc: 'Anyone can see your profile and pins' },
    { key: 'showFollowers', label: 'Show followers', desc: 'Let others see who follows you' },
    { key: 'showSavedPins', label: 'Show saved pins', desc: 'Publicly show pins you saved' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Section title="Privacy Overview">
        <div className="flex flex-col divide-y divide-border">
          {privacyOptions.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                disabled={saving}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
                  settings[key] ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings[key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Creator Features">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Creator Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">Unlock scheduled pins and advanced analytics</p>
          </div>
          <button
            type="button"
            onClick={() => toggle('isCreator')}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
              settings.isCreator ? 'bg-[#7c3aed]' : 'bg-secondary'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.isCreator ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {settings.isCreator && (
          <div className="pt-4 border-t border-border mt-4">
            <h4 className="text-sm font-semibold mb-2">Analytics Export</h4>
            <p className="text-xs text-muted-foreground mb-4">Download your pin performance data as a CSV file.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { window.location.href = '/api/users/analytics/export'; }}
              className="rounded-full px-5 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV Data
            </Button>
          </div>
        )}
      </Section>

      {saving && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </p>
      )}
    </div>
  );
}

// Notifications Tab
function NotificationsTab() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState(() => ({
    likes: user?.notificationPreferences?.likes ?? true,
    comments: user?.notificationPreferences?.comments ?? true,
    follows: user?.notificationPreferences?.follows ?? true,
    saves: user?.notificationPreferences?.saves ?? true,
    weeklyDigest: user?.notificationPreferences?.weeklyDigest ?? false,
  }));

  // Re-sync whenever user object is refreshed (fixes reset-on-tab-switch)
  useEffect(() => {
    if (user) {
      setSettings({
        likes: user.notificationPreferences?.likes ?? true,
        comments: user.notificationPreferences?.comments ?? true,
        follows: user.notificationPreferences?.follows ?? true,
        saves: user.notificationPreferences?.saves ?? true,
        weeklyDigest: user.notificationPreferences?.weeklyDigest ?? false,
      });
    }
  }, [user]);

  const opts = [
    { key: 'likes', label: 'Likes', desc: 'When someone likes your pins' },
    { key: 'comments', label: 'Comments', desc: 'When someone comments on your pins' },
    { key: 'follows', label: 'New Followers', desc: 'When someone follows you' },
    { key: 'saves', label: 'Saves', desc: 'When someone saves your pins' },
    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly email summary of your activity' },
  ];

  const handleSave = useCallback(async (newSettings) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPreferences: newSettings }),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.data.user);
        toast({ title: 'Notification preferences saved!' });
      } else {
        toast({ title: data.error || 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [toast, updateUser]);

  const toggle = useCallback((k) => {
    setSettings(prev => {
      const next = { ...prev, [k]: !prev[k] };
      handleSave(next);
      return next;
    });
  }, [handleSave]);

  return (
    <Section title="Notification Preferences">
      <div className="flex flex-col divide-y divide-border">
        {opts.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${settings[key] ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
      {saving && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-3">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
        </p>
      )}
    </Section>
  );
}

// Appearance Tab
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <Section title="Theme">
      <div className="grid grid-cols-3 gap-3">
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
          >
            <Icon className={`w-6 h-6 ${theme === id ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${theme === id ? 'text-primary' : ''}`}>{label}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

// Monetization Tab
function MonetizationTab() {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  
  const [settings, setSettings] = useState({
    brandCollabsEnabled: user?.brandCollabsEnabled ?? false,
    creatorSubscriptionsEnabled: user?.creatorSubscriptionsEnabled ?? false,
    subscriptionPrice: (user?.subscriptionPrice || 499) / 100, // Show as dollars
    tipsEnabled: user?.tipsEnabled ?? false,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const opts = [
    { key: 'tipsEnabled', label: 'Creator Tips', desc: 'Allow users to send you tips/donations on your profile' },
    { key: 'brandCollabsEnabled', label: 'Brand Collaborations', desc: 'Add a Request Brand Deal button to your profile' },
    { key: 'creatorSubscriptionsEnabled', label: 'Creator Subscriptions', desc: 'Allow fans to subscribe to you for exclusive content' },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      payload.subscriptionPrice = Math.round(payload.subscriptionPrice * 100); // Convert to cents
      
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.data.user);
        toast({ title: 'Monetization settings saved!' });
      } else {
        toast({ title: 'Failed to save', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Monetization Features">
        <p className="text-sm text-muted-foreground mb-6">Earn money directly from your audience and brand partners.</p>
        <div className="flex flex-col divide-y divide-border">
          {opts.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-primary' : 'bg-secondary'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {settings.creatorSubscriptionsEnabled && (
        <Section title="Subscription Pricing">
          <div className="flex flex-col gap-2 max-w-sm">
            <label className="text-sm font-medium text-muted-foreground">Monthly Subscription Price ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                min="0.99"
                step="0.01"
                value={settings.subscriptionPrice}
                onChange={(e) => setSettings(s => ({ ...s, subscriptionPrice: parseFloat(e.target.value) }))}
                className="w-full h-11 bg-secondary/60 rounded-xl pl-8 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all"
              />
            </div>
          </div>
        </Section>
      )}

      <Button className="mt-2 rounded-full px-6 self-start" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Save Monetization Settings
      </Button>

      {/* Quick link to tip history */}
      <a
        href="/tip/history"
        className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors group mt-2"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Tip History</p>
          <p className="text-xs text-muted-foreground">See all tips you&apos;ve sent to creators</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </a>
    </div>
  );
}

// Main Page
export default function SettingsPage() {
  const { user, updateUser, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabMap = {
    profile: <ProfileTab user={user} onSave={updateUser} />,
    account: <AccountTab />,
    privacy: <PrivacyTab />,
    notifications: <NotificationsTab />,
    appearance: <AppearanceTab />,
    monetization: <MonetizationTab />,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-56 flex-shrink-0">
          <nav className="glass-card rounded-2xl overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all text-left border-l-2 ${activeTab === id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {activeTab === id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {tabMap[activeTab]}
        </main>
      </div>
    </div>
  );
}

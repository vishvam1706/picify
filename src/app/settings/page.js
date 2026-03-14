'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import {
  User, Lock, Eye, Palette, Shield, Loader2, Check,
  Camera, Globe, Moon, Sun, Monitor, ChevronRight, Bell
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Lock },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

function Section({ title, children }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, maxLength, readOnly }) {
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
        className={`w-full h-11 bg-secondary/60 rounded-xl px-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
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
          <InputField label="Display Name" value={form.displayName} onChange={set('displayName')} placeholder="Your name" maxLength={50} />
          <InputField label="Username" value={form.username} onChange={set('username')} placeholder="username" maxLength={30} />
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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleChange = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, password: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Password updated!' });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast({ title: data.error || 'Failed to update password', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to update password', variant: 'destructive' });
    } finally {
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
          <InputField label="Current Password" value={form.currentPassword} onChange={set('currentPassword')} type="password" placeholder="••••••••" />
          <InputField label="New Password" value={form.newPassword} onChange={set('newPassword')} type="password" placeholder="••••••••" />
          <InputField label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="••••••••" />
        </div>
        <Button onClick={handleChange} disabled={saving} className="mt-4 rounded-full px-6" size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update Password
        </Button>
      </Section>

      <Section title="Danger Zone">
        <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all of your data. This action cannot be undone.</p>
        <Button variant="destructive" className="rounded-full px-6" size="sm">Delete Account</Button>
      </Section>
    </div>
  );
}

// Privacy Tab
function PrivacyTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ profilePublic: true, showFollowers: true, showBoards: true, allowMessages: true, hideLikes: false });
  const toggle = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const privacyOptions = [
    { key: 'profilePublic', label: 'Public profile', desc: 'Anyone can see your profile and pins' },
    { key: 'showFollowers', label: 'Show followers', desc: 'Let others see who follows you' },
    { key: 'showBoards', label: 'Public boards', desc: 'Your boards are visible to everyone' },
    { key: 'allowMessages', label: 'Allow messages', desc: 'Let other users message you' },
    { key: 'hideLikes', label: 'Hide likes', desc: 'Don\'t show number of likes on your pins' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Section title="Privacy Settings">
        <div className="flex flex-col divide-y divide-border">
          {privacyOptions.map(({ key, label, desc }) => (
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
        <Button className="mt-4 rounded-full px-6" size="sm" onClick={() => toast({ title: 'Privacy settings saved!' })}>
          Save Settings
        </Button>
      </Section>
    </div>
  );
}

// Notifications Tab
function NotificationsTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ likes: true, comments: true, follows: true, saves: true, weeklyDigest: false });
  const toggle = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const opts = [
    { key: 'likes', label: 'Likes', desc: 'When someone likes your pins' },
    { key: 'comments', label: 'Comments', desc: 'When someone comments on your pins' },
    { key: 'follows', label: 'New Followers', desc: 'When someone follows you' },
    { key: 'saves', label: 'Saves', desc: 'When someone saves your pins' },
    { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly email summary of your activity' },
  ];

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
              onClick={() => toggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-primary' : 'bg-secondary'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
      <Button className="mt-4 rounded-full px-6" size="sm" onClick={() => toast({ title: 'Notification preferences saved!' })}>
        Save Preferences
      </Button>
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

// Main Page
export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  const tabMap = {
    profile: <ProfileTab user={user} onSave={updateUser} />,
    account: <AccountTab />,
    privacy: <PrivacyTab />,
    notifications: <NotificationsTab />,
    appearance: <AppearanceTab />,
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

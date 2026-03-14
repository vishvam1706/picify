'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toaster';
import Image from 'next/image';

export default function TwoFactorSetupPage() {
  const [loading, setLoading] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSetupData(data.data);
      } else {
        toast({ title: 'Failed to start 2FA setup', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length < 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        toast({ title: '2FA enabled successfully!' });
        router.push('/settings?tab=account');
      } else {
        const data = await res.json();
        toast({ title: data.error || 'Invalid code', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Verification failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Enable Two-Factor Auth</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Protect your account by requiring a code from your authenticator app when you sign in.
          </p>
        </div>

        {!setupData ? (
          <Button 
            className="w-full rounded-full h-12 text-base font-semibold font-bold" 
            onClick={handleStartSetup}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Begin Setup'}
          </Button>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-xl p-4 flex justify-center border-2 border-border shadow-sm">
              <Image 
                src={setupData.qrCode} 
                alt="QR Code for 2FA" 
                width={200} 
                height={200}
                className="rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Can't scan the QR code?</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-secondary/80 p-3 rounded-xl text-center font-mono text-sm border">
                  {setupData.secret}
                </code>
                <Button variant="secondary" className="px-4 rounded-xl" onClick={copySecret}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <label className="text-sm font-semibold text-foreground">Verify your code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={token}
                onChange={e => setToken(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 bg-secondary/80 rounded-xl px-4 font-mono text-center tracking-[0.5em] text-lg focus:bg-background border-2 border-transparent focus:border-primary outline-none transition-all"
              />
            </div>

            <Button 
              className="w-full rounded-full h-12 text-base font-semibold"
              onClick={handleVerify}
              disabled={loading || token.length < 6}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5 mr-2" /> Verify & Enable</>}
            </Button>
          </div>
        )}

        <button 
          onClick={() => router.push('/settings?tab=account')} 
          className="w-full mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium text-center"
        >
          Cancel setup
        </button>
      </div>
    </div>
  );
}

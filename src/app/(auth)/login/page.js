'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setFormError('');

    // Client-side validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email address is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Please enter a valid email address';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.data.requires2FA) {
          router.push(`/2fa?token=${data.data.tempToken}`);
        } else {
          login(data.data.user);
          toast({ title: 'Welcome back!' });
          router.push('/');
        }
      } else {
        const msg = data.error || 'Login failed';
        // Map common errors to inline field errors
        if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          setErrors({ password: 'Incorrect email or password. Please try again.' });
        } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('not found')) {
          setErrors({ email: 'No account found with this email address.' });
        } else if (msg.toLowerCase().includes('ban')) {
          setFormError('Your account has been suspended. Please contact support.');
        } else {
          setFormError(msg);
        }
      }
    } catch {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl mt-[-4rem]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-full text-white flex items-center justify-center font-bold text-3xl mb-4">
            P
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Picify</h1>
          <p className="text-muted-foreground mt-2">Find your next big idea</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Form-level error (ban, unknown errors) */}
          {formError && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); setFormError(''); }}
              autoComplete="email"
              className={`h-12 rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.email && <p className="text-sm text-destructive mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.email}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); setFormError(''); }}
              autoComplete="current-password"
              className={`h-12 rounded-xl ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.password && <p className="text-sm text-destructive mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.password}</p>}
            <div className="flex justify-end mt-1.5">
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-lg mt-2 font-semibold">
            {loading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
          <Link href="/api/auth/google" className="w-full">
             <Button variant="outline" className="w-full h-12 rounded-full">
               Continue with Google
             </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Not on Picify yet?{' '}
            <Link href="/register" className="font-semibold hover:underline text-foreground">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

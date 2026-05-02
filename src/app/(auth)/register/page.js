'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (!username || username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Username can only contain letters, numbers, and underscores';

    if (!email) newErrors.email = 'Email address is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Please enter a valid email address';

    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Account created!', description: 'Please check your email to verify your account.', variant: 'default' });
        // Auto-login after registration
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (loginRes.ok) {
          const authData = await loginRes.json();
          login(authData.data.user);
        }

        router.push('/');
      } else {
        toast({ title: 'Registration failed', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Internal server error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl mt-[-4rem]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full text-white flex items-center justify-center font-bold text-3xl mb-4">
            P
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Join Picify</h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Find new ideas to try
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({ ...prev, username: '' })); }}
              className={`h-12 rounded-xl ${errors.username ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
              maxLength={30}
            />
            {errors.username && <p className="text-sm text-destructive mt-1.5 ml-1">{errors.username}</p>}
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
              autoComplete="email"
              className={`h-12 rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.email && <p className="text-sm text-destructive mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
              autoComplete="new-password"
              className={`h-12 rounded-xl ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.password && <p className="text-sm text-destructive mt-1.5 ml-1">{errors.password}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-lg mt-2 font-semibold">
            {loading ? 'Creating account...' : 'Continue'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="text-xs text-center text-muted-foreground">
            By continuing, you agree to Picify's Terms of Service and acknowledge you've read our Privacy Policy.
          </div>

          <p className="text-sm text-muted-foreground">
            Already a member?{' '}
            <Link href="/login" className="font-semibold hover:underline text-foreground">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

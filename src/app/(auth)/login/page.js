'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
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
    if (!email) newErrors.email = 'Email address is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Please enter a valid email address';
    
    if (!password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
          toast({ title: 'Welcome back!', variant: 'default' });
          router.push('/');
        }
      } else {
        toast({ title: 'Login failed', description: data.error, variant: 'destructive' });
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-full text-white flex items-center justify-center font-bold text-3xl mb-4">
            P
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Picify</h1>
          <p className="text-muted-foreground mt-2">Find your next big idea</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: ''})); }}
              autoComplete="email"
              className={`h-12 rounded-xl ${errors.email ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.email && <p className="text-sm text-destructive mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div>
            <Input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: ''})); }}
              autoComplete="current-password"
              className={`h-12 rounded-xl ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
            />
            {errors.password && <p className="text-sm text-destructive mt-1.5 ml-1">{errors.password}</p>}
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

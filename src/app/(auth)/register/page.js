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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          <Input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-12 rounded-xl"
            minLength={3}
            maxLength={30}
          />
          <Input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 rounded-xl"
          />
          <Input 
            type="password" 
            placeholder="Create a password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 rounded-xl"
            minLength={8}
          />
          
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

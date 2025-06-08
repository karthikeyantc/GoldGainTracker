
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { AuthError } from 'firebase/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUpWithEmail, signInWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setIsSubmitting(true);
    let result;
    if (action === 'signUp') {
      result = await signUpWithEmail(email, password);
    } else {
      result = await signInWithEmail(email, password);
    }

    if (result && 'code' in result) { // Firebase AuthError has a 'code' property
        const authError = result as AuthError;
        let friendlyMessage = 'An error occurred. Please try again.';
        if (authError.code === 'auth/email-already-in-use') {
            friendlyMessage = 'This email is already in use. Try logging in.';
        } else if (authError.code === 'auth/weak-password') {
            friendlyMessage = 'Password is too weak. It should be at least 6 characters.';
        } else if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
            friendlyMessage = 'Invalid email or password.';
        }
        toast({ title: action === 'signUp' ? 'Sign Up Failed' : 'Sign In Failed', description: friendlyMessage, variant: 'destructive' });
    } else if (result) {
        toast({ title: action === 'signUp' ? 'Sign Up Successful!' : 'Sign In Successful!', description: 'Redirecting...' });
        router.push('/dashboard');
    } else {
         toast({ title: 'Authentication Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };


  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  if (user) {
    // Already handled by useEffect, but as a fallback
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Calculator</Link>
        </Button>
      </div>
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Sign In</CardTitle>
              <CardDescription>Access your GoldenGain dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction('signIn')} disabled={isSubmitting || loading}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
              <CardDescription>Create an account to track your investments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Password should be at least 6 characters.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleAuthAction('signUp')} disabled={isSubmitting || loading}>
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

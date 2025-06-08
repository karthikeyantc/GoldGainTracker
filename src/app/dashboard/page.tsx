
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from "@/components/theme-toggle";
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  if (!user) {
    // Should be caught by useEffect, but as a safeguard
    return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="mb-12">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
            My Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button variant="outline" onClick={signOutUser}>Logout</Button>
             <Button variant="ghost" asChild>
                <Link href="/">Calculator</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        <Card className="w-full max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome, {user.displayName || user.email}!</CardTitle>
            <CardDescription>This is your personal investment tracking area.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your UID: {user.uid}</p>
            <p className="mt-4">
              More features coming soon, including creating and managing your investment schemes!
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="text-center mt-16 py-8 border-t border-border text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GoldenGain Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

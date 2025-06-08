
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
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
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
          Welcome, {user.displayName || user.email}!
        </h1>
        <Button asChild>
          <Link href="/dashboard/create-scheme">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Scheme
          </Link>
        </Button>
      </div>
      
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Your Investment Schemes</CardTitle>
          <CardDescription>View and manage your gold investment schemes here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You don't have any schemes yet. Click "Create New Scheme" to get started.
          </p>
          {/* Scheme list will go here later */}
        </CardContent>
      </Card>
    </>
  );
}

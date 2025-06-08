
'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from "@/components/theme-toggle";
import Link from 'next/link';
import { LayoutDashboard, LogOut, Home } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-4 px-4 md:px-8 border-b border-border">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="font-headline text-2xl font-bold text-primary flex items-center">
            <LayoutDashboard className="mr-2 h-6 w-6" />
            GoldenGain Dashboard
          </Link>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/"><Home className="mr-1 h-4 w-4" /> Calculator</Link>
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOutUser}>
              <LogOut className="mr-2 h-4 w-4" />Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="text-center mt-12 py-6 border-t border-border text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} GoldenGain Tracker. Secure Investment Tracking.</p>
      </footer>
    </div>
  );
}

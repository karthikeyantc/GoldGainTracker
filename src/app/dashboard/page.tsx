
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PlusCircle, ListChecks, Banknote, CalendarClock, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';

interface InvestmentScheme {
  id: string;
  schemeName: string;
  investmentType: 'monthly' | 'lumpsum';
  startDate: Date | null;
  totalInvestedAmount: number;
  status: string;
  createdAt: Date | null;
  // transactions will be handled later
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [schemes, setSchemes] = useState<InvestmentScheme[]>([]);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchSchemes = async () => {
        setIsLoadingSchemes(true);
        try {
          const q = query(collection(db, 'investmentSchemes'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedSchemes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              schemeName: data.schemeName,
              investmentType: data.investmentType,
              startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : null,
              totalInvestedAmount: data.totalInvestedAmount,
              status: data.status,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
            } as InvestmentScheme;
          });
          setSchemes(fetchedSchemes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0) ));
        } catch (error) {
          console.error("Error fetching schemes: ", error);
          // Optionally, set an error state and display it to the user
        } finally {
          setIsLoadingSchemes(false);
        }
      };
      fetchSchemes();
    }
  }, [user]);

  if (authLoading || (!user && !authLoading) ) { // Added condition to prevent brief flash of dashboard
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">
          Welcome, {user?.displayName || user?.email}!
        </h1>
        <Button asChild>
          <Link href="/dashboard/create-scheme">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Scheme
          </Link>
        </Button>
      </div>
      
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-accent" />
            Your Investment Schemes
          </CardTitle>
          <CardDescription>View and manage your gold investment schemes here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSchemes ? (
            <p>Loading your schemes...</p>
          ) : schemes.length === 0 ? (
            <p className="text-muted-foreground">
              You don't have any schemes yet. Click "Create New Scheme" to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemes.map(scheme => (
                <Card key={scheme.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="font-headline text-xl text-primary">{scheme.schemeName}</CardTitle>
                    <div className="flex gap-2 mt-1">
                        <Badge variant={scheme.investmentType === 'monthly' ? 'secondary' : 'outline'} className="capitalize">
                            {scheme.investmentType}
                        </Badge>
                        <Badge variant={scheme.status === 'ongoing' ? 'default' : 'destructive'} className="capitalize">
                            {scheme.status}
                        </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="flex items-center text-sm">
                      <Banknote className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Total Invested: {formatCurrency(scheme.totalInvestedAmount)}</span>
                    </div>
                    {scheme.startDate && (
                      <div className="flex items-center text-sm">
                        <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Start Date: {format(scheme.startDate, 'dd MMM yyyy')}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/dashboard/scheme/${scheme.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

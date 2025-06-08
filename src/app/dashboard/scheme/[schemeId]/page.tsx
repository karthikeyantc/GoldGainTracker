
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Banknote, CalendarClock, Edit, Coins, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '@/lib/formatters';

// Mirroring the structure from dashboard page, potentially expand later
interface InvestmentScheme {
  id: string;
  userId: string;
  schemeName: string;
  investmentType: 'monthly' | 'lumpsum';
  startDate: Date | null;
  totalInvestedAmount: number;
  totalAccumulatedGoldGrams: number;
  status: 'ongoing' | 'matured' | 'redeemed' | 'closed';
  createdAt: Date | null;
  // transactions: Array<any>; // Define transaction structure later
  // redemptionDetails?: any; // Define redemption structure later
}

export default function SchemeDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.schemeId as string;

  const [scheme, setScheme] = useState<InvestmentScheme | null>(null);
  const [isLoadingScheme, setIsLoadingScheme] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }

    if (user && schemeId) {
      const fetchScheme = async () => {
        setIsLoadingScheme(true);
        setError(null);
        try {
          const schemeDocRef = doc(db, 'investmentSchemes', schemeId);
          const docSnap = await getDoc(schemeDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userId !== user.uid) {
              setError("You don't have permission to view this scheme.");
              setScheme(null);
            } else {
              setScheme({
                id: docSnap.id,
                userId: data.userId,
                schemeName: data.schemeName,
                investmentType: data.investmentType,
                startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : null,
                totalInvestedAmount: data.totalInvestedAmount,
                totalAccumulatedGoldGrams: data.totalAccumulatedGoldGrams || 0,
                status: data.status,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
              });
            }
          } else {
            setError("Scheme not found.");
            setScheme(null);
          }
        } catch (e) {
          console.error("Error fetching scheme details: ", e);
          setError("Failed to load scheme details. Please try again.");
          setScheme(null);
        } finally {
          setIsLoadingScheme(false);
        }
      };
      fetchScheme();
    }
  }, [user, authLoading, schemeId, router]);

  if (authLoading || isLoadingScheme) {
    return <div className="flex justify-center items-center min-h-screen">Loading scheme details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 py-8 text-center">
        <p className="text-destructive text-xl mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!scheme) {
     return <div className="flex justify-center items-center min-h-screen">Scheme data unavailable.</div>;
  }
  
  const statusIcons = {
    ongoing: <Hourglass className="mr-2 h-4 w-4 text-blue-500" />,
    matured: <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />,
    redeemed: <Coins className="mr-2 h-4 w-4 text-yellow-500" />,
    closed: <XCircle className="mr-2 h-4 w-4 text-red-500" />,
  };

  return (
    <>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>

      <Card className="w-full shadow-xl mb-8">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl text-primary">{scheme.schemeName}</CardTitle>
            <CardDescription>Detailed overview of your investment scheme.</CardDescription>
          </div>
          <Badge variant={scheme.status === 'ongoing' ? 'default' : (scheme.status === 'redeemed' || scheme.status === 'matured' ? 'secondary' : 'destructive')} className="capitalize text-sm px-3 py-1 flex items-center">
             {statusIcons[scheme.status]} {scheme.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Investment Type</p>
            <p className="font-medium capitalize">{scheme.investmentType}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">{scheme.startDate ? format(scheme.startDate, 'dd MMM yyyy') : 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Invested Amount</p>
            <p className="font-medium">{formatCurrency(scheme.totalInvestedAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Accumulated Gold</p>
            <p className="font-medium">{formatNumber(scheme.totalAccumulatedGoldGrams, 3)} grams</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Scheme Created On</p>
            <p className="font-medium">{scheme.createdAt ? format(scheme.createdAt, 'dd MMM yyyy, hh:mm a') : 'N/A'}</p>
          </div>
        </CardContent>
        <CardFooter>
            {/* Future: Button to edit scheme details if applicable */}
            {/* <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Scheme (Coming Soon)</Button> */}
        </CardFooter>
      </Card>

      {/* Placeholder for Transactions Section */}
      <Card className="w-full shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">Transactions</CardTitle>
          <CardDescription>History of investments made into this scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Transaction logging feature coming soon!</p>
          {/* Future: List transactions here */}
        </CardContent>
        <CardFooter>
             {/* Future: Button to add new transaction */}
            {/* <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Transaction (Coming Soon)</Button> */}
        </CardFooter>
      </Card>

      {/* Placeholder for Redemption Details Section */}
      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">Redemption Details</CardTitle>
          <CardDescription>Information about scheme redemption, if applicable.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Redemption tracking feature coming soon!</p>
          {/* Future: Display redemption details here */}
        </CardContent>
      </Card>
    </>
  );
}


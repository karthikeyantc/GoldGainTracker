
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Banknote, CalendarClock, Edit, Coins, Hourglass, CheckCircle2, XCircle, PlusCircle, Landmark, GaugeIcon, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  date: Date; // Firestore Timestamps will be converted to Date objects
  investedAmount: number;
  goldRate: number;
  goldPurchasedGrams: number;
}

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
  transactions: Transaction[];
}

export default function SchemeDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const schemeId = params?.schemeId as string;
  const { toast } = useToast();

  const [scheme, setScheme] = useState<InvestmentScheme | null>(null);
  const [isLoadingScheme, setIsLoadingScheme] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionGoldRate, setNewTransactionGoldRate] = useState('');
  const [isLoggingTransaction, setIsLoggingTransaction] = useState(false);

  const fetchSchemeData = useCallback(async () => {
    if (!user || !schemeId) return;
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
            transactions: data.transactions ? data.transactions
              .map((t: any) => ({
                ...t,
                date: t.date instanceof Timestamp ? t.date.toDate() : (t.date?.seconds ? new Date(t.date.seconds * 1000) : new Date()),
              }))
              .sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime()) : [],
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
  }, [user, schemeId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchSchemeData();
  }, [user, authLoading, router, fetchSchemeData]);


  const handleLogInvestment = async () => {
    if (!scheme || !user) return;
    const amount = parseFloat(newTransactionAmount);
    const rate = parseFloat(newTransactionGoldRate);

    if (isNaN(amount) || amount <= 0 || isNaN(rate) || rate <= 0) {
        toast({ title: "Invalid Input", description: "Please enter valid positive numbers for amount and gold rate.", variant: "destructive" });
        return;
    }
    setIsLoggingTransaction(true);
    try {
        const goldPurchased = amount / rate;
        const newTransactionData = {
            date: serverTimestamp(), 
            investedAmount: amount,
            goldRate: rate,
            goldPurchasedGrams: goldPurchased,
        };

        const schemeDocRef = doc(db, 'investmentSchemes', scheme.id);
        await updateDoc(schemeDocRef, {
            transactions: arrayUnion(newTransactionData),
            totalInvestedAmount: increment(amount),
            totalAccumulatedGoldGrams: increment(goldPurchased),
        });
        
        // Refetch data to show the new transaction and updated totals
        await fetchSchemeData(); 

        setNewTransactionAmount('');
        setNewTransactionGoldRate('');
        toast({ title: "Success", description: "Investment logged successfully." });

    } catch (error) {
        console.error("Error logging transaction: ", error);
        toast({ title: "Error", description: "Failed to log transaction.", variant: "destructive" });
    } finally {
        setIsLoggingTransaction(false);
    }
};


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
            <p className="font-medium text-green-600">{formatCurrency(scheme.totalInvestedAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Accumulated Gold</p>
            <p className="font-medium text-yellow-600">{formatNumber(scheme.totalAccumulatedGoldGrams, 3)} grams</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Scheme Created On</p>
            <p className="font-medium">{scheme.createdAt ? format(scheme.createdAt, 'dd MMM yyyy, hh:mm a') : 'N/A'}</p>
          </div>
        </CardContent>
        {/* <CardFooter>
            {/* Future: Button to edit scheme details if applicable
            {/* <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Scheme (Coming Soon)</Button>
        </CardFooter> */}
      </Card>

      <Card className="w-full shadow-xl mb-8">
        <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent flex items-center">
                <PlusCircle className="mr-2 h-6 w-6" /> Log New Investment
            </CardTitle>
            <CardDescription>Add a new investment transaction to this scheme.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Label htmlFor="newTransactionAmount" className="flex items-center"><Landmark className="mr-2 h-4 w-4 text-muted-foreground"/>Investment Amount (₹)</Label>
                <Input 
                    id="newTransactionAmount" 
                    type="number" 
                    value={newTransactionAmount} 
                    onChange={(e) => setNewTransactionAmount(e.target.value)}
                    placeholder="e.g., 5000" 
                    min="0.01"
                    step="0.01"
                />
            </div>
            <div>
                <Label htmlFor="newTransactionGoldRate" className="flex items-center"><GaugeIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Gold Rate on Investment Date (₹/gram)</Label>
                <Input 
                    id="newTransactionGoldRate" 
                    type="number" 
                    value={newTransactionGoldRate}
                    onChange={(e) => setNewTransactionGoldRate(e.target.value)} 
                    placeholder="e.g., 7000"
                    min="0.01"
                    step="0.01"
                />
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleLogInvestment} disabled={isLoggingTransaction} className="w-full md:w-auto">
                {isLoggingTransaction ? 'Logging...' : <><PlusCircle className="mr-2 h-5 w-5"/>Log Investment</>}
            </Button>
        </CardFooter>
      </Card>
      

      <Card className="w-full shadow-xl mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent flex items-center">
            <ListOrdered className="mr-2 h-6 w-6" />Transactions
            </CardTitle>
          <CardDescription>History of investments made into this scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          {scheme.transactions && scheme.transactions.length > 0 ? (
            <ul className="space-y-4">
              {scheme.transactions.map((transaction, index) => (
                <li key={index} className="p-4 border rounded-md shadow-sm bg-background/70">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-primary">
                      {format(transaction.date, 'dd MMM yyyy, hh:mm a')}
                    </p>
                    <Badge variant="secondary">{formatCurrency(transaction.investedAmount)}</Badge>
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Gold Rate: {formatCurrency(transaction.goldRate)}/g</p>
                    <p>Gold Purchased: <span className="font-medium text-yellow-700">{formatNumber(transaction.goldPurchasedGrams, 3)} g</span></p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No transactions logged yet for this scheme.</p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">Redemption Details</CardTitle>
          <CardDescription>Information about scheme redemption, if applicable.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Redemption tracking feature coming soon!</p>
        </CardContent>
      </Card>
    </>
  );
}
    
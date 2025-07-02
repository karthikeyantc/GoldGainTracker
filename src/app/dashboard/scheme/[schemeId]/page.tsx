
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp, updateDoc, arrayUnion, increment, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Banknote, Coins, Hourglass, CheckCircle2, XCircle, PlusCircle, Landmark, GaugeIcon, ListOrdered, Trash2, Edit, Receipt, RotateCcw, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RedemptionForm, type RedemptionInputState } from '@/components/dashboard/RedemptionForm';
import { RedemptionResultsDisplay } from '@/components/dashboard/RedemptionResultsDisplay';
import type { CalculationResults } from '@/components/calculator/CalculatorResults';
import { GST_RATE, MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD, STANDARD_DISCOUNT_RATE_CAP } from '@/lib/constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Transaction {
  date: Date;
  investedAmount: number;
  goldRate: number;
  goldPurchasedGrams: number;
}

interface RedemptionData {
  inputs: RedemptionInputState;
  results: CalculationResults;
  redeemedAt: Date;
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
  redemptionDetails?: RedemptionData | null;
}

const initialRedemptionInputs: RedemptionInputState = {
  intendedJewelleryWeight: '',
  currentGoldPrice: '',
  makingChargePercentage: '',
  isPrematureRedemption: false,
  prematureRedemptionCapPercentage: 11,
};


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
  const [newTransactionDate, setNewTransactionDate] = useState<Date | undefined>(new Date());
  const [isLoggingTransaction, setIsLoggingTransaction] = useState(false);
  const [isDeletingScheme, setIsDeletingScheme] = useState(false);

  const [isRedemptionFormOpen, setIsRedemptionFormOpen] = useState(false);
  const [currentRedemptionInputs, setCurrentRedemptionInputs] = useState<RedemptionInputState>(initialRedemptionInputs);
  const [isSavingRedemption, setIsSavingRedemption] = useState(false);

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
            redemptionDetails: data.redemptionDetails ? {
              ...data.redemptionDetails,
              redeemedAt: data.redemptionDetails.redeemedAt instanceof Timestamp ? data.redemptionDetails.redeemedAt.toDate() : new Date(),
            } : null,
          });
          if (data.redemptionDetails) {
            setIsRedemptionFormOpen(false);
          }
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
    if (!newTransactionDate) {
        toast({ title: "Invalid Input", description: "Please select an investment date.", variant: "destructive" });
        return;
    }

    setIsLoggingTransaction(true);
    try {
        const goldPurchased = amount / rate;
        const newTransactionData = {
            date: newTransactionDate,
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
        
        await fetchSchemeData(); 

        setNewTransactionAmount('');
        setNewTransactionGoldRate('');
        setNewTransactionDate(new Date());
        toast({ title: "Success", description: "Investment logged successfully." });

    } catch (error) {
        console.error("Error logging transaction: ", error);
        toast({ title: "Error", description: "Failed to log transaction.", variant: "destructive" });
    } finally {
        setIsLoggingTransaction(false);
    }
  };

  const handleDeleteScheme = async () => {
    if (!scheme || !user) return;
    setIsDeletingScheme(true);
    try {
      const schemeDocRef = doc(db, 'investmentSchemes', scheme.id);
      await deleteDoc(schemeDocRef);
      toast({ title: "Scheme Deleted", description: `Scheme "${scheme.schemeName}" has been successfully deleted.` });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error deleting scheme: ", error);
      toast({ title: "Error Deleting Scheme", description: "Could not delete the scheme. Please try again.", variant: "destructive" });
      setIsDeletingScheme(false);
    }
  };

  const handleRedemptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRedemptionInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleRedemptionCheckboxChange = (checked: boolean) => {
    setCurrentRedemptionInputs(prev => ({
      ...prev,
      isPrematureRedemption: checked,
    }));
  };

  const handleRedemptionSliderChange = (value: number[]) => {
    setCurrentRedemptionInputs(prev => ({ ...prev, prematureRedemptionCapPercentage: value[0] }));
  };

  const performRedemptionCalculations = (): CalculationResults | null => {
    if (!scheme) return null;

    const {
      intendedJewelleryWeight,
      currentGoldPrice,
      makingChargePercentage,
      isPrematureRedemption,
      prematureRedemptionCapPercentage
    } = currentRedemptionInputs;

    const accGold = scheme.totalAccumulatedGoldGrams;
    const ijw = parseFloat(intendedJewelleryWeight);
    const cgp = parseFloat(currentGoldPrice);
    const mcpInput = parseFloat(makingChargePercentage);

    if (isNaN(ijw) || isNaN(cgp) || isNaN(mcpInput) || ijw <=0 || cgp <=0 || mcpInput < 0) {
      toast({ title: "Invalid Redemption Input", description: "Please enter valid numbers for redemption. Gold price, jewellery weight must be positive. Making charge cannot be negative.", variant: "destructive" });
      return null;
    }
    
    const yourGoldValue = accGold * cgp;
    
    const baseJewelleryCostForInvoice = ijw * cgp;
    const makingChargesForInvoice_Raw = (mcpInput / 100) * baseJewelleryCostForInvoice;
    
    const invoiceSubtotalBeforeGst = baseJewelleryCostForInvoice + makingChargesForInvoice_Raw;
    const invoiceGstAmount = GST_RATE * invoiceSubtotalBeforeGst;
    const totalInvoice = invoiceSubtotalBeforeGst + invoiceGstAmount;
    
    const goldValueDeduction = yourGoldValue;

    const potentialDiscountRate = (mcpInput / 100) * MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD;
    const applicableCapRate = isPrematureRedemption
      ? (prematureRedemptionCapPercentage / 100)
      : STANDARD_DISCOUNT_RATE_CAP;
    
    let actualAppliedDiscountRate = Math.min(potentialDiscountRate, applicableCapRate);
    actualAppliedDiscountRate = Math.max(0, actualAppliedDiscountRate);

    let calculatedDiscount = actualAppliedDiscountRate * yourGoldValue;
    
    const mcOnAccumulatedGoldPortionInJewellery = (mcpInput / 100) * (Math.min(accGold, ijw) * cgp);
    let finalMakingChargeDiscount = Math.min(calculatedDiscount, mcOnAccumulatedGoldPortionInJewellery);
    finalMakingChargeDiscount = Math.min(finalMakingChargeDiscount, makingChargesForInvoice_Raw);
    finalMakingChargeDiscount = Math.max(0, finalMakingChargeDiscount);

    const totalSavings = goldValueDeduction + finalMakingChargeDiscount;
    let finalAmountToPayCalculated = totalInvoice - totalSavings;
    finalAmountToPayCalculated = Math.max(0, finalAmountToPayCalculated);

    const displayAdditionalGoldGrams = ijw - accGold;
    const displayAdditionalGoldValue = displayAdditionalGoldGrams > 0 ? displayAdditionalGoldGrams * cgp : 0;

    const breakdown_additionalGoldCost = displayAdditionalGoldValue;
    const breakdown_mcOnAdditionalGold = displayAdditionalGoldGrams > 0 ? (mcpInput / 100) * displayAdditionalGoldValue : 0;
    const mcOnAccumulatedGoldPortionInJewellery_Raw = (mcpInput / 100) * (Math.min(accGold, ijw) * cgp);
    const breakdown_netMcOnAccumulatedGold = Math.max(0, mcOnAccumulatedGoldPortionInJewellery_Raw - finalMakingChargeDiscount);
    const breakdown_gst = invoiceGstAmount;

    return {
      inputAccumulatedGoldGrams: accGold,
      inputIntendedJewelleryWeight: ijw,
      inputCurrentGoldPrice: cgp,
      inputMakingChargePercentage: mcpInput,
      isPrematureRedemption: isPrematureRedemption,
      appliedMakingChargeDiscountCapPercentage: applicableCapRate * 100,
      actualAppliedDiscountRate: actualAppliedDiscountRate,

      yourGoldValue,
      additionalGoldGrams: displayAdditionalGoldGrams,
      additionalGoldValue: displayAdditionalGoldValue,

      goldAnalysisYouHaveGrams: accGold,
      goldAnalysisYouHaveWorth: yourGoldValue,
      goldAnalysisNeedAdditionalGrams: displayAdditionalGoldGrams,
      goldAnalysisNeedAdditionalWorth: displayAdditionalGoldValue,

      invoiceBaseJewelleryCost: baseJewelleryCostForInvoice,
      invoiceMakingCharges: makingChargesForInvoice_Raw,
      invoiceSubtotalBeforeGst: invoiceSubtotalBeforeGst,
      invoiceGstAmount: invoiceGstAmount,
      invoiceTotalInvoice: totalInvoice,
      invoiceGoldValueDeduction: goldValueDeduction,
      invoiceMakingChargeDiscount: finalMakingChargeDiscount,
      invoiceTotalSavings: totalSavings,
      finalAmountToPay: finalAmountToPayCalculated,

      breakdown_additionalGoldCost,
      breakdown_mcOnAdditionalGold,
      breakdown_netMcOnAccumulatedGold,
      breakdown_gst,
    };
  };

  const handleSaveRedemption = async () => {
    if (!scheme || !user) return;
    const calculationResults = performRedemptionCalculations();
    if (!calculationResults) return; 

    setIsSavingRedemption(true);
    try {
      const redemptionData: RedemptionData = {
        inputs: { ...currentRedemptionInputs }, 
        results: calculationResults,
        redeemedAt: new Date(),
      };
      const schemeDocRef = doc(db, 'investmentSchemes', scheme.id);
      await updateDoc(schemeDocRef, {
        redemptionDetails: redemptionData,
        status: 'redeemed',
      });
      toast({ title: "Success", description: "Redemption details saved." });
      setIsRedemptionFormOpen(false);
      await fetchSchemeData();
    } catch (error) {
      console.error("Error saving redemption: ", error);
      toast({ title: "Error", description: "Failed to save redemption details.", variant: "destructive" });
    } finally {
      setIsSavingRedemption(false);
    }
  };

  const handleClearRedemption = async () => {
    if (!scheme || !user) return;
    setIsSavingRedemption(true);
    try {
      const schemeDocRef = doc(db, 'investmentSchemes', scheme.id);
      await updateDoc(schemeDocRef, {
        redemptionDetails: null,
        status: 'ongoing',
      });
      toast({ title: "Success", description: "Redemption details cleared." });
      await fetchSchemeData();
    } catch (error) {
      console.error("Error clearing redemption: ", error);
      toast({ title: "Error", description: "Failed to clear redemption details.", variant: "destructive" });
    } finally {
      setIsSavingRedemption(false);
    }
  };
  
  const openLogRedemptionForm = () => {
    setCurrentRedemptionInputs(initialRedemptionInputs);
    setIsRedemptionFormOpen(true);
  };

  const openEditRedemptionForm = () => {
    if (scheme?.redemptionDetails?.inputs) {
      setCurrentRedemptionInputs(scheme.redemptionDetails.inputs);
    } else {
      setCurrentRedemptionInputs(initialRedemptionInputs);
    }
    setIsRedemptionFormOpen(true);
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
          {scheme.redemptionDetails?.redeemedAt && (
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm text-muted-foreground">Redeemed On</p>
              <p className="font-medium">{format(scheme.redemptionDetails.redeemedAt, 'dd MMM yyyy, hh:mm a')}</p>
            </div>
          )}
        </CardContent>
         <CardFooter className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeletingScheme}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeletingScheme ? 'Deleting...' : 'Delete Scheme'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the scheme
                    "{scheme.schemeName}" and all its associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeletingScheme}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteScheme} disabled={isDeletingScheme} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingScheme ? 'Deleting...' : 'Yes, delete scheme'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>

      {scheme.status !== 'redeemed' && (
        <Card className="w-full shadow-xl mb-8">
          <CardHeader>
              <CardTitle className="font-headline text-2xl text-accent flex items-center">
                  <PlusCircle className="mr-2 h-6 w-6" /> Log New Investment
              </CardTitle>
              <CardDescription>Add a new investment transaction to this scheme. This option is disabled if scheme is redeemed.</CardDescription>
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
              <div>
                  <Label htmlFor="newTransactionDate" className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Investment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTransactionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTransactionDate ? format(newTransactionDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTransactionDate}
                        onSelect={setNewTransactionDate}
                        disabled={(d) => d > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              </div>
          </CardContent>
          <CardFooter>
              <Button onClick={handleLogInvestment} disabled={isLoggingTransaction} className="w-full md:w-auto">
                  {isLoggingTransaction ? 'Logging...' : <><PlusCircle className="mr-2 h-5 w-5"/>Log Investment</>}
              </Button>
          </CardFooter>
        </Card>
      )}
      

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
                      {format(transaction.date, 'dd MMM yyyy')}
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
          <CardTitle className="font-headline text-2xl text-accent flex items-center">
            <Receipt className="mr-2 h-6 w-6" /> Redemption Details
          </CardTitle>
          <CardDescription>Log or view the details of your scheme redemption.</CardDescription>
        </CardHeader>
        <CardContent>
          {isRedemptionFormOpen ? (
            <RedemptionForm
              inputs={currentRedemptionInputs}
              onInputChange={handleRedemptionInputChange}
              onCheckboxChange={handleRedemptionCheckboxChange}
              onSliderChange={handleRedemptionSliderChange}
              onSubmit={handleSaveRedemption}
              isLoading={isSavingRedemption}
              maxMcDiscountCap={STANDARD_DISCOUNT_RATE_CAP * 100}
              accumulatedGoldGrams={scheme.totalAccumulatedGoldGrams}
            />
          ) : scheme.redemptionDetails?.results ? (
            <>
              <RedemptionResultsDisplay 
                results={scheme.redemptionDetails.results}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
              <div className="mt-4 flex gap-2">
                <Button onClick={openEditRedemptionForm} variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Redemption</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive"><RotateCcw className="mr-2 h-4 w-4"/>Clear Redemption</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to clear redemption details?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will remove the logged redemption details and set the scheme status back to "ongoing".
                        This cannot be undone easily.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearRedemption} className="bg-destructive hover:bg-destructive/90">
                        Yes, Clear Redemption
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          ) : (
            <Button onClick={openLogRedemptionForm}>
              <Receipt className="mr-2 h-4 w-4"/> Log Redemption
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
    

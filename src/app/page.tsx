
'use client';

import React, { useState, useCallback } from 'react';
import { CalculatorForm, type CalculatorInputState } from '@/components/calculator/CalculatorForm';
import { CalculatorResults, type CalculationResults } from '@/components/calculator/CalculatorResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { GST_RATE, MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD, STANDARD_DISCOUNT_RATE_CAP } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Calculator, Gem, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const initialCalculatorInputs: CalculatorInputState = {
  accumulatedGoldGrams: '',
  intendedJewelleryWeight: '',
  currentGoldPrice: '',
  makingChargePercentage: '',
  isPrematureRedemption: false,
  prematureRedemptionCapPercentage: 11,
};

export default function GoldenGainTrackerPage() {
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputState>(initialCalculatorInputs);
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const { toast } = useToast();
  const { user, loading: authLoading, signOutUser } = useAuth();

  const handleCalculatorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCalculatorInputs(prev => ({ ...prev, [name]: value }));
    setCalculationResults(null);
  };
  
  const handleGoldRateUpdate = (rate: string) => {
    setCalculatorInputs(prev => ({...prev, currentGoldPrice: rate}));
    setCalculationResults(null);
  }

  const handleCheckboxChange = (checked: boolean) => {
    setCalculatorInputs(prev => ({
      ...prev,
      isPrematureRedemption: checked,
    }));
    setCalculationResults(null);
  };

  const handleSliderChange = (value: number[]) => {
    setCalculatorInputs(prev => ({ ...prev, prematureRedemptionCapPercentage: value[0] }));
    setCalculationResults(null);
  };

  const performCalculations = useCallback(() => {
    setIsCalculating(true);
    setCalculationResults(null);

    const {
      accumulatedGoldGrams,
      intendedJewelleryWeight,
      currentGoldPrice,
      makingChargePercentage,
      isPrematureRedemption,
      prematureRedemptionCapPercentage
    } = calculatorInputs;

    const accGold = parseFloat(accumulatedGoldGrams);
    const ijw = parseFloat(intendedJewelleryWeight);
    const cgp = parseFloat(currentGoldPrice);
    const mcpInput = parseFloat(makingChargePercentage);

    if (isNaN(accGold) || isNaN(ijw) || isNaN(cgp) || isNaN(mcpInput) || accGold < 0 || ijw <=0 || cgp <=0 || mcpInput < 0) {
      toast({ title: "Invalid Input", description: "Please enter valid numbers. Gold price, jewellery weight must be positive. Making charge cannot be negative.", variant: "destructive" });
      setIsCalculating(false);
      return;
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

    setCalculationResults({
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
    });
    setIsCalculating(false);
  }, [calculatorInputs, toast]);
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="text-center mb-12">
        <div className="flex justify-between items-center mb-2">
            <div className="w-1/3"> {/* Left Spacer / Future Links */} </div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary w-1/3">
              GoldenGain Tracker
            </h1>
            <div className="w-1/3 flex justify-end items-center space-x-2">
              <ThemeToggle />
              {authLoading ? (
                <Button variant="outline" disabled>Loading...</Button>
              ) : user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={signOutUser}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/auth">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
              )}
            </div>
        </div>
        <p className="text-muted-foreground text-lg">
          Your companion for gold investment planning & jewellery purchase calculations.
        </p>
      </header>

      <main className="container mx-auto px-0 md:px-4">
        <Tabs defaultValue="calculator" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-1 mb-6"> {/* Updated to grid-cols-1 */}
            <TabsTrigger value="calculator" className="text-lg py-3">
              <Calculator className="mr-2" /> Gold Value Calculator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-3xl text-center text-accent flex items-center justify-center">
                  <Gem className="mr-2 h-7 w-7" /> Gold Scheme Value Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <CalculatorForm
                  inputs={calculatorInputs}
                  onInputChange={handleCalculatorInputChange}
                  onCheckboxChange={handleCheckboxChange}
                  onSliderChange={handleSliderChange}
                  onGoldRateUpdate={handleGoldRateUpdate}
                  onSubmit={performCalculations}
                  isLoading={isCalculating}
                  maxMcDiscountCap={STANDARD_DISCOUNT_RATE_CAP * 100}
                />
                {isCalculating && <div className="flex justify-center items-center md:col-span-1"><p>Calculating results...</p></div>}
                {calculationResults && !isCalculating && (
                  <CalculatorResults
                    results={calculationResults}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      <footer className="text-center mt-16 py-8 border-t border-border text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GoldenGain Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

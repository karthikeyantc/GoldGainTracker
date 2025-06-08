
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
import { Calculator, Gem, FileText, Activity, BookOpen, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
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
  const { user, loading, signOutUser } = useAuth();

  const handleCalculatorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCalculatorInputs(prev => ({ ...prev, [name]: value }));
    setCalculationResults(null);
  };

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

  console.log('Pre-render log for GoldenGainTrackerPage');
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="text-center mb-12">
        <div className="flex justify-between items-center mb-2">
            <div className="w-1/3"> {/* Left Spacer / Future Links */} </div>
            <div className="w-1/3 flex justify-center">
                <div className="inline-flex items-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg" className="mr-3">
                        <path d="M12 2L14.24 7.68L20 8.71L15.61 12.66L16.92 18.32L12 15.19L7.08 18.32L8.39 12.66L4 8.71L9.76 7.68L12 2ZM12 5.36L10.39 9.84L5.5 10.53L9.04 13.71L7.92 18.16L12 15.88L16.08 18.16L14.96 13.71L18.5 10.53L13.61 9.84L12 5.36Z"/>
                    </svg>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">
                        GoldenGain Tracker
                    </h1>
                </div>
            </div>
            <div className="w-1/3 flex justify-end items-center space-x-2">
                <ThemeToggle />
                {!loading && user && (
                    <>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={signOutUser}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </>
                )}
                {!loading && !user && (
                    <Button variant="outline" size="sm" asChild>
                         <Link href="/auth"><LogIn className="mr-2 h-4 w-4" /> Login / Sign Up</Link>
                    </Button>
                )}
            </div>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          This is a Gold Investment scheme tracker built for the Tanishq's Rivaah Gold Advantage savings scheme.
        </p>
      </header>

      <Tabs defaultValue="calculator" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-1 mb-8 bg-accent/10 p-2 rounded-lg">
          <TabsTrigger value="calculator" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <Calculator className="mr-2" /> Gold Value Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card className="shadow-xl border-primary/20">
            <CardHeader>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <CalculatorForm
                    inputs={calculatorInputs}
                    onInputChange={handleCalculatorInputChange}
                    onCheckboxChange={handleCheckboxChange}
                    onSliderChange={handleSliderChange}
                    onSubmit={performCalculations}
                    isLoading={isCalculating}
                    maxMcDiscountCap={STANDARD_DISCOUNT_RATE_CAP * 100}
                  />
                </div>
                <div className="md:mt-[4.25rem]"> 
                  {calculationResults ? (
                    <CalculatorResults
                      results={calculationResults}
                      formatCurrency={formatCurrency}
                      formatNumber={formatNumber}
                    />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground h-full flex flex-col justify-center items-center">
                      <Gem className="mx-auto h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">Enter your gold details and click "Calculate Gold Value" to see your breakdown.</p>
                    </div>
                  )}
                </div>
              </div>
               {calculationResults && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-muted-foreground">
                                Calculation Summary
                                <FileText className="h-5 w-5 text-accent" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• Your accumulated gold {formatNumber(calculationResults.inputAccumulatedGoldGrams, 3)}g worth {formatCurrency(calculationResults.yourGoldValue)}.</p>
                            {calculationResults.additionalGoldGrams >= 0 ? (
                                <p>• {calculationResults.additionalGoldGrams > 0 ? `Additional gold needed ${formatNumber(calculationResults.additionalGoldGrams, 3)}g worth ${formatCurrency(calculationResults.additionalGoldValue)}` : "You have the exact amount of gold."}.</p>
                            ) : (
                                <p>• You have a surplus of {formatNumber(Math.abs(calculationResults.additionalGoldGrams), 3)}g worth {formatCurrency(Math.abs(calculationResults.additionalGoldValue))}.</p>
                            )}
                            <p>• Potential scheme discount rate ({formatNumber(MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * 100,0)}% of input MC %): {formatNumber(((calculationResults.inputMakingChargePercentage / 100) * MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD) * 100, 1)}%.</p>
                             <p>
                                • Applicable cap for this rate: {formatNumber(calculationResults.appliedMakingChargeDiscountCapPercentage, 0)}%
                                {calculationResults.isPrematureRedemption ? " (Premature Redemption)" : " (Standard Redemption)"}.
                            </p>
                            <p>• Actual discount rate applied: {formatNumber(calculationResults.actualAppliedDiscountRate * 100, 2)}% (on accumulated gold value).</p>
                            <p>• Final Making Charge Discount applied: {formatCurrency(calculationResults.invoiceMakingChargeDiscount)}.</p>
                            <p>• Total savings from gold value + MC discount: {formatCurrency(calculationResults.invoiceTotalSavings)}.</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                        <CardHeader>
                             <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-green-700 dark:text-green-300">
                                Your Gold Portfolio Summary
                                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </CardTitle>
                        </Header>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400">Your Gold Value</p>
                                <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatCurrency(calculationResults.yourGoldValue)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400">Total Savings (Gold + MC Discount)</p>
                                <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatCurrency(calculationResults.invoiceTotalSavings)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-amber-600 dark:text-amber-400">Final Payment</p>
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(calculationResults.finalAmountToPay)}</p>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-muted-foreground">
                                How This Calculator Works Guide
                                <BookOpen className="h-5 w-5 text-accent" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-1">
                           <p>• Your scheme offers a potential making charge discount rate equal to {MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD*100}% of the input jewellery's making charge percentage.</p>
                           <p>• This potential rate is then capped. Standard cap: {STANDARD_DISCOUNT_RATE_CAP*100}%. Premature redemption: {calculatorInputs.isPrematureRedemption ? calculatorInputs.prematureRedemptionCapPercentage : STANDARD_DISCOUNT_RATE_CAP*100 }%.</p>
                           <p>• The final capped discount rate is applied to the value of your accumulated gold to determine the initial discount amount.</p>
                           <p>• This initial discount is practically limited by: a) the making charges on your accumulated gold portion in the new jewellery, and b) the total making charges for the new jewellery.</p>
                           <p>• Your gold value and this final, practically-limited making charge discount are deducted from the total invoice.</p>
                        </CardContent>
                    </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <footer className="text-center mt-16 py-8 border-t border-border text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GoldenGain Tracker. All rights reserved.</p>
        <p className="text-xs mt-1">Your smart companion for gold investments.</p>
      </footer>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorForm, type CalculatorInputState } from '@/components/calculator/CalculatorForm';
import { CalculatorResults, type CalculationResults } from '@/components/calculator/CalculatorResults';
import { InvestmentForecastForm } from '@/components/forecast/InvestmentForecastForm';
import { InvestmentForecastResult } from '@/components/forecast/InvestmentForecastResult';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle as UICardTitle } from '@/components/ui/card'; // Renamed CardTitle to avoid conflict
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { GST_RATE, MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD, MAKING_CHARGE_DISCOUNT_CAP_PERCENTAGE_OF_TOTAL_INVOICE } from '@/lib/constants';
import type { InvestmentForecastInput, InvestmentForecastOutput } from '@/ai/flows/investment-forecast';
import { investmentForecast as generateInvestmentForecast } from '@/ai/flows/investment-forecast';
import { useToast } from "@/hooks/use-toast";
import { Calculator, BarChartBig, Coins, Gem, Sparkles, Activity, FileTextIcon, PercentIcon, BookOpen } from 'lucide-react';

const initialCalculatorInputs: CalculatorInputState = {
  accumulatedGoldGrams: '',
  intendedJewelleryWeight: '',
  currentGoldPrice: '',
  makingChargePercentage: '',
  isPrematureRedemption: false,
  prematureRedemptionCapPercentage: 6, // Default for slider if premature, e.g. 6%
};

const initialForecastInputs: Partial<InvestmentForecastInput> = {
  monthlyInvestment: undefined,
  monthsPaid: undefined,
  currentGoldPrice: undefined,
  intendedJewelleryWeight: undefined,
  makingChargePercentage: undefined,
};

export default function GoldenGainTrackerPage() {
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputState>(initialCalculatorInputs);
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [forecastInputs, setForecastInputs] = useState<Partial<InvestmentForecastInput>>(initialForecastInputs);
  const [forecastResult, setForecastResult] = useState<InvestmentForecastOutput | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const { toast } = useToast();

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

  const handleForecastInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = value ? parseFloat(value) : undefined;
    setForecastInputs(prev => ({ ...prev, [name]: parsedValue }));
    setForecastResult(null);
  };

  const prefillForecastInputs = useCallback(() => {
    setForecastInputs(prev => ({
        ...prev,
        currentGoldPrice: calculatorInputs.currentGoldPrice ? parseFloat(calculatorInputs.currentGoldPrice) : prev.currentGoldPrice,
        intendedJewelleryWeight: calculatorInputs.intendedJewelleryWeight ? parseFloat(calculatorInputs.intendedJewelleryWeight) : prev.intendedJewelleryWeight,
        makingChargePercentage: calculatorInputs.makingChargePercentage ? parseFloat(calculatorInputs.makingChargePercentage) : prev.makingChargePercentage,
    }));
  }, [calculatorInputs]);


  const performCalculations = () => {
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
    const mcp = parseFloat(makingChargePercentage);

    if (isNaN(accGold) || isNaN(ijw) || isNaN(cgp) || isNaN(mcp) || accGold < 0 || ijw <=0 || cgp <=0 || mcp < 0) {
      toast({ title: "Invalid Input", description: "Please enter valid numbers. Gold price, jewellery weight must be positive. Making charge cannot be negative.", variant: "destructive" });
      setIsCalculating(false);
      return;
    }
    
    const yourGoldValue = accGold * cgp;
    const additionalGoldGrams = Math.max(0, ijw - accGold);
    const additionalGoldValue = additionalGoldGrams * cgp;

    const baseJewelleryCostForInvoice = ijw * cgp;
    const makingChargesForInvoice = (mcp / 100) * baseJewelleryCostForInvoice;
    const subtotalBeforeGst = baseJewelleryCostForInvoice + makingChargesForInvoice;
    const gstAmount = GST_RATE * subtotalBeforeGst;
    const totalInvoice = subtotalBeforeGst + gstAmount;
    
    const goldValueDeduction = yourGoldValue;

    const goldWeightEligibleForMcDiscount = Math.min(accGold, ijw);
    const makingChargesOnAccumulatedGoldPortion = (mcp / 100) * (goldWeightEligibleForMcDiscount * cgp);
    const potentialMcDiscount = MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * makingChargesOnAccumulatedGoldPortion;

    const appliedCapPercentage = isPrematureRedemption
      ? prematureRedemptionCapPercentage
      : (MAKING_CHARGE_DISCOUNT_CAP_PERCENTAGE_OF_TOTAL_INVOICE * 100);

    const capAmountForMcDiscount = isPrematureRedemption
      ? (appliedCapPercentage / 100) * yourGoldValue // Cap based on accumulated gold value if premature
      : (appliedCapPercentage / 100) * totalInvoice; // Cap based on total invoice if not premature

    const finalMakingChargeDiscount = Math.min(potentialMcDiscount, capAmountForMcDiscount);

    const totalSavings = goldValueDeduction + finalMakingChargeDiscount;
    let finalAmountToPayCalculated = totalInvoice - totalSavings;
    finalAmountToPayCalculated = Math.max(0, finalAmountToPayCalculated);

    const displayAdditionalGoldGrams = ijw - accGold;
    const displayAdditionalGoldValue = displayAdditionalGoldGrams * cgp;

    setCalculationResults({
      inputAccumulatedGoldGrams: accGold,
      inputIntendedJewelleryWeight: ijw,
      inputCurrentGoldPrice: cgp,
      inputMakingChargePercentage: mcp,
      isPrematureRedemption: isPrematureRedemption,
      appliedMakingChargeDiscountCapPercentage: appliedCapPercentage,

      yourGoldValue,
      additionalGoldGrams: displayAdditionalGoldGrams,
      additionalGoldValue: displayAdditionalGoldValue,

      goldAnalysisYouHaveGrams: accGold,
      goldAnalysisYouHaveWorth: yourGoldValue,
      goldAnalysisNeedAdditionalGrams: displayAdditionalGoldGrams,
      goldAnalysisNeedAdditionalWorth: displayAdditionalGoldValue,

      invoiceBaseJewelleryCost: baseJewelleryCostForInvoice,
      invoiceMakingCharges: makingChargesForInvoice,
      invoiceSubtotalBeforeGst: subtotalBeforeGst,
      invoiceGstAmount: gstAmount,
      invoiceTotalInvoice: totalInvoice,
      invoiceGoldValueDeduction: goldValueDeduction,
      invoiceMakingChargeDiscount: finalMakingChargeDiscount,
      invoiceTotalSavings: totalSavings,
      finalAmountToPay: finalAmountToPayCalculated,
    });
    setIsCalculating(false);
  };

  const handleForecastSubmit = async () => {
    setIsForecasting(true);
    setForecastResult(null);

    const { monthlyInvestment, monthsPaid, currentGoldPrice: forecastGoldPrice, intendedJewelleryWeight: forecastJewelleryWeight, makingChargePercentage: forecastMcPercentage } = forecastInputs;

    if (!monthlyInvestment || !monthsPaid || !forecastGoldPrice || !forecastJewelleryWeight || !forecastMcPercentage ||
        monthlyInvestment <= 0 || monthsPaid <= 0 || forecastGoldPrice <= 0 || forecastJewelleryWeight <= 0 || forecastMcPercentage < 0) {
       toast({ title: "Invalid Forecast Input", description: "Please ensure all forecast fields are filled with valid positive numbers.", variant: "destructive" });
       setIsForecasting(false);
       return;
    }

    try {
      const result = await generateInvestmentForecast(forecastInputs as InvestmentForecastInput);
      setForecastResult(result);
    } catch (error) {
      console.error("Error generating forecast:", error);
      toast({ title: "Forecast Error", description: "Could not generate forecast. Please try again.", variant: "destructive" });
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="text-center mb-12">
        <div className="inline-flex items-center">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="hsl(var(--primary))" xmlns="http://www.w3.org/2000/svg" className="mr-3">
            <path d="M12 2L14.24 7.68L20 8.71L15.61 12.66L16.92 18.32L12 15.19L7.08 18.32L8.39 12.66L4 8.71L9.76 7.68L12 2ZM12 5.36L10.39 9.84L5.5 10.53L9.04 13.71L7.92 18.16L12 15.88L16.08 18.16L14.96 13.71L18.5 10.53L13.61 9.84L12 5.36Z"/>
          </svg>
          <h1 className="font-headline text-5xl font-bold text-primary">
            GoldenGain Tracker
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Plan your gold investments and jewellery purchases with ease.
        </p>
      </header>

      <Tabs defaultValue="calculator" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-accent/10 p-2 rounded-lg">
          <TabsTrigger value="calculator" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <Calculator className="mr-2" /> Gold Value Calculator
          </TabsTrigger>
          <TabsTrigger value="forecast" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <BarChartBig className="mr-2" /> Investment AI Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card className="shadow-xl border-primary/20">
            <CardHeader>
               {/* Title is now inside CalculatorForm */}
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
                    maxMcDiscountCap={MAKING_CHARGE_DISCOUNT_CAP_PERCENTAGE_OF_TOTAL_INVOICE * 100}
                  />
                </div>
                <div className="md:mt-[4.25rem]"> {/* Align with button from form */}
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
                            <UICardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-muted-foreground">
                                Calculation Summary
                                <FileTextIcon className="h-5 w-5 text-accent" />
                            </UICardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <p>• Your accumulated gold {formatNumber(calculationResults.inputAccumulatedGoldGrams, 3)}g worth {formatCurrency(calculationResults.yourGoldValue)}.</p>
                            {calculationResults.additionalGoldGrams >= 0 ? (
                                <p>• {calculationResults.additionalGoldGrams > 0 ? `Additional gold needed ${formatNumber(calculationResults.additionalGoldGrams, 3)}g worth ${formatCurrency(calculationResults.additionalGoldValue)}` : "You have the exact amount of gold."}.</p>
                            ) : (
                                <p>• You have a surplus of {formatNumber(Math.abs(calculationResults.additionalGoldGrams), 3)}g worth {formatCurrency(Math.abs(calculationResults.additionalGoldValue))}.</p>
                            )}
                            <p>• {MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * 100}% discount on making charges for your accumulated gold ({formatCurrency(calculationResults.invoiceMakingChargeDiscount)}).</p>
                             <p>
                                • Discount capped at {formatNumber(calculationResults.appliedMakingChargeDiscountCapPercentage, 0)}%
                                {calculationResults.isPrematureRedemption 
                                  ? ` of your accumulated gold value (${formatCurrency(calculationResults.yourGoldValue)})`
                                  : ` of total invoice value (${formatCurrency(calculationResults.invoiceTotalInvoice)})`}
                                {calculationResults.isPrematureRedemption ? " (Premature Redemption)" : ""}.
                            </p>
                            <p>• Total savings from gold value + discount: {formatCurrency(calculationResults.invoiceTotalSavings)}.</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                        <CardHeader>
                             <UICardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-green-700 dark:text-green-300">
                                Your Gold Portfolio Summary
                                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </UICardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400">Gold Value</p>
                                <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatCurrency(calculationResults.yourGoldValue)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400">Total Savings</p>
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
                            <UICardTitle className="flex flex-row items-center justify-between space-y-0 pb-2 text-sm font-medium text-muted-foreground">
                                How This Calculator Works
                                <BookOpen className="h-5 w-5 text-accent" />
                            </UICardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-1">
                            <p>• Enter your accumulated gold weight from schemes.</p>
                            <p>• Add the weight of jewellery you want to purchase.</p>
                            <p>• Get {MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * 100}% discount on making charges for your accumulated gold portion.</p>
                             {calculationResults.isPrematureRedemption ? (
                                <p>• For premature redemption, your making charge discount cap is set to {formatNumber(calculationResults.appliedMakingChargeDiscountCapPercentage,0)}% of your accumulated gold's value.</p>
                              ) : (
                                <p>• Discount capped at {formatNumber(calculationResults.appliedMakingChargeDiscountCapPercentage,0)}% of total invoice value.</p>
                              )}
                            <p>• Your gold value is deducted from the total invoice.</p>
                            <p>• Pay only the remaining amount after all deductions.</p>
                        </CardContent>
                    </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast">
           <Card className="shadow-xl border-primary/20">
            <CardHeader>
              <SectionTitle title="Investment AI Forecast" icon={BarChartBig} />
            </CardHeader>
            <CardContent>
               <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <InvestmentForecastForm
                    inputs={forecastInputs}
                    onInputChange={handleForecastInputChange}
                    onSubmit={handleForecastSubmit}
                    isLoading={isForecasting}
                  />
                   <Button variant="outline" onClick={prefillForecastInputs} className="mt-4 w-full border-primary text-primary hover:bg-primary/10">
                    Use Calculator Inputs (Gold Rate, Weight, MC%)
                  </Button>
                </div>
                 <div>
                   <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">AI Generated Outlook</h3>
                    <InvestmentForecastResult
                      result={forecastResult}
                      isLoading={isForecasting}
                      formatCurrency={formatCurrency}
                      formatNumber={formatNumber}
                    />
                    {!isForecasting && !forecastResult && (
                       <div className="text-center py-10 text-muted-foreground">
                        <BarChartBig className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>Fill in the details and click "Get AI Forecast" to see your potential investment outcome.</p>
                      </div>
                    )}
                 </div>
               </div>
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

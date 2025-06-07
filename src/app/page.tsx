
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalculatorForm, type CalculatorInputState } from '@/components/calculator/CalculatorForm';
import { CalculatorResults, type CalculationResults } from '@/components/calculator/CalculatorResults';
import { InvestmentForecastForm } from '@/components/forecast/InvestmentForecastForm';
import { InvestmentForecastResult } from '@/components/forecast/InvestmentForecastResult';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { GST_RATE } from '@/lib/constants';
import type { InvestmentForecastInput, InvestmentForecastOutput } from '@/ai/flows/investment-forecast';
import { investmentForecast as generateInvestmentForecast } from '@/ai/flows/investment-forecast';
import { useToast } from "@/hooks/use-toast";
import { Calculator, BarChartBig, Coins, Gem } from 'lucide-react';

const initialCalculatorInputs: CalculatorInputState = {
  monthlyInvestment: '',
  monthsPaid: '',
  currentGoldPrice: '',
  intendedJewelleryWeight: '',
  makingChargePercentage: '',
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
    setCalculationResults(null); // Clear results on input change
  };

  const handleForecastInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForecastInputs(prev => ({ ...prev, [name]: value ? parseFloat(value) : undefined }));
    setForecastResult(null); // Clear results on input change
  };
  
  const prefillForecastInputs = useCallback(() => {
    setForecastInputs({
        monthlyInvestment: calculatorInputs.monthlyInvestment ? parseFloat(calculatorInputs.monthlyInvestment) : undefined,
        monthsPaid: calculatorInputs.monthsPaid ? parseFloat(calculatorInputs.monthsPaid) : undefined, // User might want to change this to total scheme duration
        currentGoldPrice: calculatorInputs.currentGoldPrice ? parseFloat(calculatorInputs.currentGoldPrice) : undefined,
        intendedJewelleryWeight: calculatorInputs.intendedJewelleryWeight ? parseFloat(calculatorInputs.intendedJewelleryWeight) : undefined,
        makingChargePercentage: calculatorInputs.makingChargePercentage ? parseFloat(calculatorInputs.makingChargePercentage) : undefined,
    });
  }, [calculatorInputs]);

  useEffect(() => {
    prefillForecastInputs();
  }, [calculatorInputs, prefillForecastInputs]);


  const performCalculations = () => {
    setIsCalculating(true);
    const { monthlyInvestment, monthsPaid, currentGoldPrice, intendedJewelleryWeight, makingChargePercentage } = calculatorInputs;

    const mi = parseFloat(monthlyInvestment);
    const mp = parseInt(monthsPaid);
    const cgp = parseFloat(currentGoldPrice);
    const ijw = parseFloat(intendedJewelleryWeight);
    const mcp = parseFloat(makingChargePercentage);

    if (isNaN(mi) || isNaN(mp) || isNaN(cgp) || isNaN(ijw) || isNaN(mcp) || mi <=0 || mp <=0 || cgp <=0 || ijw <=0 || mcp < 0) {
      toast({ title: "Invalid Input", description: "Please enter valid positive numbers for all fields.", variant: "destructive" });
      setIsCalculating(false);
      return;
    }
    
    // Simulate calculation delay for visual feedback
    setTimeout(() => {
      const totalInvested = mi * mp;
      const accumulatedGoldGrams = totalInvested / cgp;
      
      const jewelleryBaseCost = ijw * cgp;
      const makingChargesRaw = (mcp / 100) * jewelleryBaseCost;
      
      // Gross bill calculation (before scheme discount is subtracted from the total)
      const subTotalBeforeGst = jewelleryBaseCost + makingChargesRaw;
      const gstOnGrossSubTotal = GST_RATE * subTotalBeforeGst; // Tax on the full undiscounted amount
      const grossInvoiceTotal = subTotalBeforeGst + gstOnGrossSubTotal;

      // Scheme discount value: 1 month's investment, capped by making charges (raw)
      const schemeDiscountValue = Math.min(mi, makingChargesRaw);

      // Final payable amount: Gross total MINUS the scheme discount value
      const finalPayable = grossInvoiceTotal - schemeDiscountValue;
      
      // For display consistency in CalculatorResults:
      // "Final Making Charges" can represent the conceptual net cost of making charges to the customer.
      const effectiveFinalMakingCharges = makingChargesRaw - schemeDiscountValue;
      // "Final GST" refers to the GST component of the grossInvoiceTotal, as discount is post-total.
      const gstAppliedInBill = gstOnGrossSubTotal;

      setCalculationResults({
        accumulatedGoldGrams,
        totalInvested,
        jewelleryBaseCost,
        makingChargesRaw,
        subTotalBeforeGst,          // Gross subtotal before any discount
        gstOnSubtotal: gstAppliedInBill, // GST calculated on the gross subtotal
        grossInvoiceTotal,          // Gross total before discount subtraction

        schemeDiscountOnMakingCharges: schemeDiscountValue, // The discount amount itself
        finalMakingCharges: effectiveFinalMakingCharges,     // Net effect on making charges for display
        finalGst: gstAppliedInBill,                         // GST remains on the gross amount, as discount is post-total
        finalPayable,                                       // Final bill: Gross Total - Discount Value
      });
      setIsCalculating(false);
    }, 500);
  };

  const handleForecastSubmit = async () => {
    setIsForecasting(true);
    setForecastResult(null);

    const allFieldsPresent = forecastInputs.monthlyInvestment && forecastInputs.monthsPaid && forecastInputs.currentGoldPrice && forecastInputs.intendedJewelleryWeight && forecastInputs.makingChargePercentage;

    if (!allFieldsPresent || Object.values(forecastInputs).some(v => v === undefined || v <= 0) || (forecastInputs.makingChargePercentage !== undefined && forecastInputs.makingChargePercentage < 0) ) {
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
            <Calculator className="mr-2" /> Redemption Calculator
          </TabsTrigger>
          <TabsTrigger value="forecast" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
            <BarChartBig className="mr-2" /> Investment AI Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card className="shadow-xl border-primary/20">
            <CardHeader>
              <SectionTitle title="Redemption Calculator" icon={Coins} />
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <CalculatorForm 
                    inputs={calculatorInputs} 
                    onInputChange={handleCalculatorInputChange} 
                    onSubmit={performCalculations}
                    isLoading={isCalculating}
                  />
                </div>
                <div>
                  <h3 className="font-headline text-2xl font-semibold mb-4 text-primary">Calculation Summary</h3>
                  {calculationResults ? (
                    <CalculatorResults 
                      results={calculationResults} 
                      formatCurrency={formatCurrency} 
                      formatNumber={formatNumber} 
                    />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Gem className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Enter your details and click "Calculate Final Bill" to see your redemption summary.</p>
                    </div>
                  )}
                </div>
              </div>
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
                    Use Calculator Inputs
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


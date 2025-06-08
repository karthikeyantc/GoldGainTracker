
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, TrendingUp, FileText, ListChecks, BookOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD, STANDARD_DISCOUNT_RATE_CAP } from '@/lib/constants';

export interface CalculationResults {
  inputAccumulatedGoldGrams: number;
  inputIntendedJewelleryWeight: number;
  inputCurrentGoldPrice: number;
  inputMakingChargePercentage: number;
  isPrematureRedemption: boolean;
  appliedMakingChargeDiscountCapPercentage: number; // The cap rate (e.g., 12% or user-selected premature %)
  actualAppliedDiscountRate: number; // The final rate (e.g. 0.12 or 0.11) after Math.min

  yourGoldValue: number;
  additionalGoldGrams: number;
  additionalGoldValue: number;

  goldAnalysisYouHaveGrams: number;
  goldAnalysisYouHaveWorth: number;
  goldAnalysisNeedAdditionalGrams: number;
  goldAnalysisNeedAdditionalWorth: number;

  invoiceBaseJewelleryCost: number;
  invoiceMakingCharges: number;
  invoiceSubtotalBeforeGst: number;
  invoiceGstAmount: number;
  invoiceTotalInvoice: number;
  invoiceGoldValueDeduction: number;
  invoiceMakingChargeDiscount: number;
  invoiceTotalSavings: number;
  finalAmountToPay: number;

  breakdown_additionalGoldCost: number;
  breakdown_mcOnAdditionalGold: number;
  breakdown_netMcOnAccumulatedGold: number;
  breakdown_gst: number;
}

interface CalculatorResultsProps {
  results: CalculationResults | null;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, precision?: number) => string;
}

const DetailRow: React.FC<{ label: string; value: string; isEmphasized?: boolean; subValue?: string; className?: string }> = ({ label, value, isEmphasized, subValue, className }) => (
  <div className={`flex justify-between items-center py-2 ${isEmphasized ? 'font-semibold text-lg' : 'text-sm'} ${className}`}>
    <span className="text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className={isEmphasized ? 'text-primary' : 'text-foreground'}>{value}</span>
      {subValue && <span className="block text-xs text-muted-foreground">{subValue}</span>}
    </div>
  </div>
);

export function CalculatorResults({ results, formatCurrency, formatNumber }: CalculatorResultsProps) {
  if (!results) return null;
  
  const potentialRawDiscountRate = (results.inputMakingChargePercentage / 100) * MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD;

  const howItWorksItems = [
    {
      trigger: "1. What's the scheme's potential discount rate?",
      content: `The scheme offers a discount rate equal to ${formatNumber(MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * 100, 0)}% of the making charge percentage you enter. With your input MC of ${formatNumber(results.inputMakingChargePercentage,1)}%, this scheme's potential discount rate is ${formatNumber(potentialRawDiscountRate * 100, 2)}%.`
    },
    {
      trigger: "2. Is there a cap on this discount rate?",
      content: `Yes. This potential rate (${formatNumber(potentialRawDiscountRate * 100, 2)}%) is then capped. For standard redemptions, the cap is ${formatNumber(STANDARD_DISCOUNT_RATE_CAP * 100, 0)}%. For premature redemptions, the cap was ${formatNumber(results.appliedMakingChargeDiscountCapPercentage, 0)}%. The final effective rate applied to your gold value is the lower of the scheme's potential rate and this cap, resulting in an actual applied rate of ${formatNumber(results.actualAppliedDiscountRate * 100, 2)}%.`
    },
    {
      trigger: "3. How is the discount amount calculated from this rate?",
      content: `This final capped discount rate (${formatNumber(results.actualAppliedDiscountRate * 100, 2)}%) is applied to the total value of your accumulated gold (${formatCurrency(results.yourGoldValue)}) to determine an initial discount amount of ${formatCurrency(results.actualAppliedDiscountRate * results.yourGoldValue)}.`
    },
    {
      trigger: "4. Are there practical limits to this discount amount?",
      content: `Yes, this calculated discount amount is further limited. Firstly, it cannot be more than the making charges that would apply to your accumulated gold portion if it were part of the new jewellery. Secondly, it also cannot exceed the total making charges (${formatCurrency(results.invoiceMakingCharges)}) for the entire new jewellery item you are purchasing. The final discount applied (${formatCurrency(results.invoiceMakingChargeDiscount)}) respects these practical limits.`
    },
    {
      trigger: "5. How is the final payable amount calculated?",
      content: `The total invoice for your new jewellery (${formatCurrency(results.invoiceTotalInvoice)}) is calculated first (gold cost + total making charges + GST). From this, we deduct the value of your accumulated gold (${formatCurrency(results.invoiceGoldValueDeduction)}) and the final, practically-limited making charge discount (${formatCurrency(results.invoiceMakingChargeDiscount)}) to arrive at the amount you need to pay (${formatCurrency(results.finalAmountToPay)}).`
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <Gem className="mr-2 h-5 w-5" /> Calculation Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <DetailRow label="Your Gold Value" value={formatCurrency(results.yourGoldValue)} />
          <DetailRow label="Total Jewelry Weight" value={`${formatNumber(results.inputIntendedJewelleryWeight, 3)} g`} />
          {results.additionalGoldGrams >= 0 ? (
            <DetailRow
              label="Additional Gold Needed"
              value={`${formatNumber(results.additionalGoldGrams, 3)} g`}
              subValue={results.additionalGoldGrams > 0 ? `Worth ${formatCurrency(results.additionalGoldValue)}` : ""}
            />
          ) : (
             <DetailRow
              label="Surplus Gold Value"
              value={formatCurrency(Math.abs(results.additionalGoldValue))}
              subValue={`${formatNumber(Math.abs(results.additionalGoldGrams), 3)} g`}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" /> Gold Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-primary/5 rounded-md">
            <p className="text-sm font-medium text-primary">You Have</p>
            <p className="text-lg font-semibold">{formatNumber(results.goldAnalysisYouHaveGrams, 3)} g</p>
            <p className="text-xs text-muted-foreground">Worth {formatCurrency(results.goldAnalysisYouHaveWorth)}</p>
          </div>
          <div className={`p-3 rounded-md ${results.goldAnalysisNeedAdditionalGrams > 0 ? 'bg-amber-500/10 dark:bg-amber-700/20' : 'bg-green-500/10 dark:bg-green-700/20'}`}>
            <p className={`text-sm font-medium ${results.goldAnalysisNeedAdditionalGrams > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
              {results.goldAnalysisNeedAdditionalGrams > 0 ? 'Need Additional' : (results.goldAnalysisNeedAdditionalGrams === 0 ? 'Exact Amount' : 'Surplus Gold')}
            </p>
            <p className="text-lg font-semibold">{formatNumber(Math.abs(results.goldAnalysisNeedAdditionalGrams), 3)} g</p>
            <p className="text-xs text-muted-foreground">Worth {formatCurrency(Math.abs(results.goldAnalysisNeedAdditionalWorth))}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl text-primary flex items-center">
            <FileText className="mr-2 h-5 w-5" /> Complete Invoice Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-accent mb-1">Step 1: Base Jewelry Cost</h4>
            <DetailRow label={`Total Jewelry (${formatNumber(results.inputIntendedJewelleryWeight,3)}g @ ${formatCurrency(results.inputCurrentGoldPrice)}/g)`} value={formatCurrency(results.invoiceBaseJewelleryCost)} />
            <DetailRow label={`Making Charges (${results.inputMakingChargePercentage}%)`} value={formatCurrency(results.invoiceMakingCharges)} />
            <DetailRow label="Subtotal Before GST" value={formatCurrency(results.invoiceSubtotalBeforeGst)} />
          </div>
          <hr className="border-border" />
          <div>
            <h4 className="font-semibold text-accent mb-1">Step 2: Add GST</h4>
            <DetailRow label="GST (3% on Subtotal)" value={formatCurrency(results.invoiceGstAmount)} />
            <DetailRow label="Total Invoice" value={formatCurrency(results.invoiceTotalInvoice)} isEmphasized />
          </div>
          <hr className="border-border" />
          <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
            <h4 className="font-semibold text-green-700 dark:text-green-300 mb-1">Step 3: Apply Deductions</h4>
            <DetailRow label="Your Gold Value Deduction" value={`-${formatCurrency(results.invoiceGoldValueDeduction)}`} />
            <DetailRow
              label={`Making Charge Discount`}
              subValue={`(Rate ${formatNumber(results.actualAppliedDiscountRate * 100, 2)}% on your gold val, capped & limited)`}
              value={`-${formatCurrency(results.invoiceMakingChargeDiscount)}`}
            />
            <DetailRow label="Total Savings" value={formatCurrency(results.invoiceTotalSavings)} />
          </div>
           <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Final Amount to Pay</p>
            <p className="font-headline text-3xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(results.finalAmountToPay)}</p>
          </div>
        </CardContent>
      </Card>

      {results.finalAmountToPay > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
              <ListChecks className="mr-2 h-5 w-5" /> Final Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              {results.breakdown_additionalGoldCost > 0 && (
                <DetailRow label="For Additional Gold" value={formatCurrency(results.breakdown_additionalGoldCost)} />
              )}
              {results.breakdown_mcOnAdditionalGold > 0 && (
                <DetailRow label="Making Charges (on Additional Gold)" value={formatCurrency(results.breakdown_mcOnAdditionalGold)} />
              )}
              {results.breakdown_netMcOnAccumulatedGold >= 0 && ( 
                   <DetailRow label="Making Charges (on Your Gold Portion, Net of Discount)" value={formatCurrency(results.breakdown_netMcOnAccumulatedGold)} />
              )}
               <DetailRow label="GST (on Original Invoice Subtotal)" value={formatCurrency(results.breakdown_gst)} />
            </div>
            <hr className="my-2 border-dashed border-border" />
            <DetailRow label="Total Payable (Reconciled)" value={formatCurrency(results.finalAmountToPay)} isEmphasized className="text-amber-700 dark:text-amber-500" />
             <p className="text-xs text-muted-foreground pt-2">
                Note: The reconciled total is the sum of above components. GST is calculated on the original jewellery subtotal before any gold/MC deductions.
            </p>
          </CardContent>
        </Card>
      )}

       <Card>
        <CardHeader>
            <CardTitle className="font-headline text-xl text-primary flex items-center">
                <BookOpen className="mr-2 h-5 w-5" /> How This Calculator Works
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                {howItWorksItems.map((item, index) => (
                    <AccordionItem value={`item-${index + 1}`} key={index}>
                        <AccordionTrigger className="text-sm text-left hover:no-underline text-muted-foreground data-[state=open]:text-primary">
                            {item.trigger}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-foreground/80 dark:text-foreground/70">
                            {item.content}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

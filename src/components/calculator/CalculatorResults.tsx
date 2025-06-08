
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard'; // Might not be used as much with new layout
import { Gem, Gift, TrendingUp, ChevronsUp, FileText, ShieldCheck, Percent } from 'lucide-react'; // Adjusted icons
import { MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD } from '@/lib/constants';

export interface CalculationResults {
  // Pass through inputs for display in summary
  inputAccumulatedGoldGrams: number;
  inputIntendedJewelleryWeight: number;
  inputCurrentGoldPrice: number;
  inputMakingChargePercentage: number;

  // Calculation Results section
  yourGoldValue: number;
  additionalGoldGrams: number;
  additionalGoldValue: number;

  // Gold Analysis section
  goldAnalysisYouHaveGrams: number;
  goldAnalysisYouHaveWorth: number;
  goldAnalysisNeedAdditionalGrams: number;
  goldAnalysisNeedAdditionalWorth: number;

  // Complete Invoice Breakdown
  invoiceBaseJewelleryCost: number;
  invoiceMakingCharges: number;
  invoiceSubtotalBeforeGst: number;
  invoiceGstAmount: number;
  invoiceTotalInvoice: number;
  invoiceGoldValueDeduction: number;
  invoiceMakingChargeDiscount: number;
  invoiceTotalSavings: number;
  finalAmountToPay: number;
}

interface CalculatorResultsProps {
  results: CalculationResults | null;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, precision?: number) => string;
}

const DetailRow: React.FC<{ label: string; value: string; isEmphasized?: boolean; subValue?: string }> = ({ label, value, isEmphasized, subValue }) => (
  <div className={`flex justify-between items-center py-2 ${isEmphasized ? 'font-semibold text-lg' : 'text-sm'}`}>
    <span className="text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className={isEmphasized ? 'text-primary' : 'text-foreground'}>{value}</span>
      {subValue && <span className="block text-xs text-muted-foreground">{subValue}</span>}
    </div>
  </div>
);


export function CalculatorResults({ results, formatCurrency, formatNumber }: CalculatorResultsProps) {
  if (!results) return null;

  const mcDiscountPercentageDisplay = MAKING_CHARGE_DISCOUNT_PERCENTAGE_ON_ACCUMULATED_GOLD * 100;

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
          {results.additionalGoldGrams > 0 ? (
            <DetailRow 
              label="Additional Gold Needed" 
              value={`${formatNumber(results.additionalGoldGrams, 3)} g`}
              subValue={`Worth ${formatCurrency(results.additionalGoldValue)}`}
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
          <div className={`p-3 rounded-md ${results.additionalGoldGrams > 0 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
            <p className={`text-sm font-medium ${results.additionalGoldGrams > 0 ? 'text-amber-700' : 'text-green-700'}`}>
              {results.additionalGoldGrams > 0 ? 'Need Additional' : 'Surplus Gold'}
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
            <DetailRow label={`Total Jewelry (${formatNumber(results.inputIntendedJewelleryWeight,3)}g)`} value={formatCurrency(results.invoiceBaseJewelleryCost)} />
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
            <DetailRow label={`Making Charge Discount (${mcDiscountPercentageDisplay}% on your gold portion)`} value={`-${formatCurrency(results.invoiceMakingChargeDiscount)}`} />
            <DetailRow label="Total Savings" value={formatCurrency(results.invoiceTotalSavings)} />
          </div>
           <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">Final Amount to Pay</p>
            <p className="font-headline text-3xl font-bold text-amber-600">{formatCurrency(results.finalAmountToPay)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

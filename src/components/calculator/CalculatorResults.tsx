import React from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { TrendingUp, ShieldCheck, FileText, ShoppingBag, Gift } from 'lucide-react'; // Placeholder icons

export interface CalculationResults {
  accumulatedGoldGrams: number;
  totalInvested: number;
  jewelleryBaseCost: number;
  makingChargesRaw: number;
  subTotalBeforeGst: number;
  gstOnSubtotal: number;
  grossInvoiceTotal: number;
  schemeDiscountOnMakingCharges: number;
  finalMakingCharges: number;
  finalGst: number;
  finalPayable: number;
}

interface CalculatorResultsProps {
  results: CalculationResults | null;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, precision?: number) => string;
}

export function CalculatorResults({ results, formatCurrency, formatNumber }: CalculatorResultsProps) {
  if (!results) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Accumulated Gold" value={formatNumber(results.accumulatedGoldGrams, 3)} unit="grams" icon={TrendingUp} />
        <StatCard title="Total Invested" value={formatCurrency(results.totalInvested)} icon={FileText} />
      </div>

      <div className="p-4 border border-border rounded-lg bg-card/50 shadow">
        <h3 className="font-headline text-xl font-semibold mb-4 text-accent flex items-center">
          <ShoppingBag className="mr-2 h-6 w-6" /> Jewellery & Charges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Jewellery Base Cost" value={formatCurrency(results.jewelleryBaseCost)} />
          <StatCard title="Making Charges (Original)" value={formatCurrency(results.makingChargesRaw)} />
          <StatCard title="Subtotal (Jewellery + Original MC)" value={formatCurrency(results.subTotalBeforeGst)} />
          <StatCard title="GST (3% on Subtotal)" value={formatCurrency(results.gstOnSubtotal)} />
          <StatCard title="Gross Invoice Total" value={formatCurrency(results.grossInvoiceTotal)} />
        </div>
      </div>
      
      <div className="p-4 border border-border rounded-lg bg-card/50 shadow">
         <h3 className="font-headline text-xl font-semibold mb-4 text-accent flex items-center">
          <Gift className="mr-2 h-6 w-6" /> Scheme Benefits & Final Bill
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Making Charge Discount Applied" value={formatCurrency(results.schemeDiscountOnMakingCharges)} />
          <StatCard title="Final Making Charges" value={formatCurrency(results.finalMakingCharges)} />
          <StatCard title="Final GST (3%)" value={formatCurrency(results.finalGst)} />
        </div>
         <div className="mt-4">
            <StatCard 
                title="Final Amount Payable" 
                value={formatCurrency(results.finalPayable)} 
                icon={ShieldCheck} 
            />
        </div>
      </div>
    </div>
  );
}

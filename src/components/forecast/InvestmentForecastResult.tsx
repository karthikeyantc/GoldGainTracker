import React from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvestmentForecastOutput } from '@/ai/flows/investment-forecast';
import { TrendingUp, FileText, AlertTriangle } from 'lucide-react';

interface InvestmentForecastResultProps {
  result: InvestmentForecastOutput | null;
  isLoading: boolean;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, precision?: number) => string;
}

export function InvestmentForecastResult({ result, isLoading, formatCurrency, formatNumber }: InvestmentForecastResultProps) {
  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted-foreground/20 mb-2"></div>
        <div className="h-6 w-full animate-pulse rounded bg-muted-foreground/10"></div>
        <div className="h-6 w-5/6 animate-pulse rounded bg-muted-foreground/10"></div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">AI Investment Forecast</CardTitle>
        <CardDescription>Predictions based on your inputs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard 
            title="Forecasted Gold Accumulation" 
            value={formatNumber(result.forecastedGoldAmount, 3)} 
            unit="grams"
            icon={TrendingUp} 
          />
          <StatCard 
            title="Forecasted Jewellery Cost" 
            value={formatCurrency(result.forecastedJewelleryCost)} 
            icon={FileText}
          />
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-2 text-accent flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Forecast Summary
          </h4>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed p-4 bg-muted/30 rounded-md border border-border">
            {result.summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Coins, CalendarDays, CircleDollarSign, Gem, Percent, BarChart3 } from 'lucide-react';
import type { InvestmentForecastInput } from '@/ai/flows/investment-forecast';

interface InvestmentForecastFormProps {
  inputs: Partial<InvestmentForecastInput>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const iconProps = { className: "mr-2 h-4 w-4 text-accent" };

export function InvestmentForecastForm({ inputs, onInputChange, onSubmit, isLoading }: InvestmentForecastFormProps) {
  const formFields = [
    { id: 'monthlyInvestment', label: 'Monthly Investment (₹)', type: 'number', placeholder: 'e.g., ₹5000', value: inputs.monthlyInvestment, icon: <Coins {...iconProps} /> },
    { id: 'monthsPaid', label: 'Total Scheme Duration (Months)', type: 'number', placeholder: 'e.g., 12', value: inputs.monthsPaid, icon: <CalendarDays {...iconProps} /> },
    { id: 'currentGoldPrice', label: 'Expected Avg. Gold Price (₹/gram)', type: 'number', placeholder: 'e.g., ₹7200', value: inputs.currentGoldPrice, icon: <CircleDollarSign {...iconProps} /> },
    { id: 'intendedJewelleryWeight', label: 'Intended Jewellery Weight (grams)', type: 'number', placeholder: 'e.g., 10', value: inputs.intendedJewelleryWeight, icon: <Gem {...iconProps} /> },
    { id: 'makingChargePercentage', label: 'Expected Making Charge (%)', type: 'number', placeholder: 'e.g., 10', value: inputs.makingChargePercentage, icon: <Percent {...iconProps} /> },
  ];

  return (
    <div className="space-y-6">
      {formFields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`forecast-${field.id}`} className="flex items-center text-foreground/80">
            {field.icon}
            {field.label}
          </Label>
          <Input
            id={`forecast-${field.id}`}
            name={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={inputs[field.id as keyof InvestmentForecastInput] || ''}
            onChange={onInputChange}
            className="bg-background/80 border-border focus:ring-primary"
            min="0"
            step={field.id === 'makingChargePercentage' || field.id === 'intendedJewelleryWeight' ? "0.01" : "1"}
          />
        </div>
      ))}
      <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg">
        <BarChart3 className="mr-2 h-5 w-5" />
        {isLoading ? 'Generating Forecast...' : 'Get AI Forecast'}
      </Button>
    </div>
  );
}

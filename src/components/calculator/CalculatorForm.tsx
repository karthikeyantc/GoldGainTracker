
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Coins, CalendarDays, CircleDollarSign, Gem, Percent, CalculatorIcon } from 'lucide-react';

export interface CalculatorInputState {
  monthlyInvestment: string;
  monthsPaid: string;
  currentGoldPrice: string;
  intendedJewelleryWeight: string;
  makingChargePercentage: string;
}

interface CalculatorFormProps {
  inputs: CalculatorInputState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const iconProps = { className: "mr-2 h-4 w-4 text-accent" };

export function CalculatorForm({ inputs, onInputChange, onSubmit, isLoading }: CalculatorFormProps) {
  const inputFields = [
    { id: 'monthlyInvestment', label: 'Monthly Investment (₹)', type: 'number', placeholder: 'e.g., ₹5000', value: inputs.monthlyInvestment, icon: <Coins {...iconProps} /> },
    { id: 'monthsPaid', label: 'Months Paid', type: 'number', placeholder: 'e.g., 11', value: inputs.monthsPaid, icon: <CalendarDays {...iconProps} /> },
    { id: 'currentGoldPrice', label: 'Current Gold Price (₹/gram)', type: 'number', placeholder: 'e.g., ₹7000', value: inputs.currentGoldPrice, icon: <CircleDollarSign {...iconProps} /> },
    { id: 'intendedJewelleryWeight', label: 'Intended Jewellery Weight (grams)', type: 'number', placeholder: 'e.g., 10', value: inputs.intendedJewelleryWeight, icon: <Gem {...iconProps} /> },
    { id: 'makingChargePercentage', label: 'Making Charge (%)', type: 'number', placeholder: 'e.g., 10', value: inputs.makingChargePercentage, icon: <Percent {...iconProps} /> },
  ];

  return (
    <div className="space-y-6">
      {inputFields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="flex items-center text-foreground/80">
            {field.icon}
            {field.label}
          </Label>
          <Input
            id={field.id}
            name={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={field.value}
            onChange={onInputChange}
            className="bg-background/80 border-border focus:ring-primary"
            min="0"
            step={field.id === 'makingChargePercentage' || field.id === 'intendedJewelleryWeight' ? "0.01" : "1"}
          />
        </div>
      ))}
      <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg">
        <CalculatorIcon className="mr-2 h-5 w-5" />
        {isLoading ? 'Calculating...' : 'Calculate Final Bill'}
      </Button>
    </div>
  );
}

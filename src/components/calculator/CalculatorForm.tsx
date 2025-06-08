
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Coins, Weight, CircleDollarSign, Percent, CalculatorIcon, Sparkles } from 'lucide-react';

export interface CalculatorInputState {
  accumulatedGoldGrams: string; // New: Directly input accumulated gold
  intendedJewelleryWeight: string;
  currentGoldPrice: string;
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
    { id: 'accumulatedGoldGrams', label: 'Your Accumulated Gold (g)', type: 'number', placeholder: 'e.g., 5.208', value: inputs.accumulatedGoldGrams, icon: <Sparkles {...iconProps} /> },
    { id: 'intendedJewelleryWeight', label: 'Total Jewelry Weight Desired (g)', type: 'number', placeholder: 'e.g., 6.094', value: inputs.intendedJewelleryWeight, icon: <Weight {...iconProps} /> },
    { id: 'currentGoldPrice', label: 'Current Gold Rate (₹/gram)', type: 'number', placeholder: 'e.g., ₹9010', value: inputs.currentGoldPrice, icon: <CircleDollarSign {...iconProps} /> },
    { id: 'makingChargePercentage', label: 'Making Charges Percentage (%)', type: 'number', placeholder: 'e.g., 25', value: inputs.makingChargePercentage, icon: <Percent {...iconProps} /> },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-headline text-2xl font-semibold text-primary flex items-center">
        <Sparkles className="mr-2 h-6 w-6 text-primary" /> Your Gold Details
      </h3>
      {inputFields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="flex items-center text-foreground/80">
            {/* Icon is now part of the label for consistency, field.icon removed from here */}
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
            step="0.001" // Allow for more precision in grams
          />
        </div>
      ))}
      <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg">
        <CalculatorIcon className="mr-2 h-5 w-5" />
        {isLoading ? 'Calculating...' : 'Calculate Gold Value'}
      </Button>
    </div>
  );
}

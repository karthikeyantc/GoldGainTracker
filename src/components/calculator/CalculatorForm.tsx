
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Coins, Weight, CircleDollarSign, Percent, CalculatorIcon, Sparkles, AlertTriangle } from 'lucide-react';

export interface CalculatorInputState {
  accumulatedGoldGrams: string;
  intendedJewelleryWeight: string;
  currentGoldPrice: string;
  makingChargePercentage: string;
  isPrematureRedemption: boolean;
  prematureRedemptionCapPercentage: number; // Value from 0 to 12
}

interface CalculatorFormProps {
  inputs: CalculatorInputState;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (checked: boolean) => void;
  onSliderChange: (value: number[]) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  maxMcDiscountCap: number; // To pass the 12% constant (MAKING_CHARGE_DISCOUNT_CAP_PERCENTAGE_OF_TOTAL_INVOICE * 100)
}

const iconProps = { className: "mr-2 h-4 w-4 text-accent" };

export function CalculatorForm({ inputs, onInputChange, onCheckboxChange, onSliderChange, onSubmit, isLoading, maxMcDiscountCap }: CalculatorFormProps) {
  const inputFields = [
    { id: 'accumulatedGoldGrams', label: 'Your Accumulated Gold (g)', type: 'number', placeholder: 'e.g., 5.208g', value: inputs.accumulatedGoldGrams, icon: <Sparkles {...iconProps} /> },
    { id: 'intendedJewelleryWeight', label: 'Total Jewelry Weight Desired (g)', type: 'number', placeholder: 'e.g., 6.094g', value: inputs.intendedJewelleryWeight, icon: <Weight {...iconProps} /> },
    { id: 'currentGoldPrice', label: 'Current Gold Rate (₹/gram)', type: 'number', placeholder: 'e.g., ₹7000', value: inputs.currentGoldPrice, icon: <CircleDollarSign {...iconProps} /> },
    { id: 'makingChargePercentage', label: 'Making Charges Percentage (%)', type: 'number', placeholder: 'e.g., 18%', value: inputs.makingChargePercentage, icon: <Percent {...iconProps} /> },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-headline text-2xl font-semibold text-primary flex items-center">
        <Sparkles className="mr-2 h-6 w-6 text-primary" /> Your Gold Details
      </h3>
      {inputFields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="flex items-center text-foreground/80">
            {/* Icon is part of the label for consistency */}
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
            step={field.id === 'accumulatedGoldGrams' || field.id === 'intendedJewelleryWeight' ? '0.001' : '0.01'}
          />
        </div>
      ))}

      <div className="space-y-4 p-4 border border-dashed border-accent/50 rounded-md bg-accent/5">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPrematureRedemption"
            checked={inputs.isPrematureRedemption}
            onCheckedChange={onCheckboxChange}
          />
          <Label htmlFor="isPrematureRedemption" className="flex items-center font-medium text-accent">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Premature Redemption?
          </Label>
        </div>

        {inputs.isPrematureRedemption && (
          <div className="space-y-2 pl-2">
            <Label htmlFor="prematureRedemptionCapPercentage" className="text-sm text-muted-foreground">
              Adjust MC Discount Cap ({inputs.prematureRedemptionCapPercentage}%)
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                id="prematureRedemptionCapPercentage"
                name="prematureRedemptionCapPercentage"
                min={0}
                max={maxMcDiscountCap}
                step={1}
                defaultValue={[inputs.prematureRedemptionCapPercentage]}
                onValueChange={onSliderChange}
                className="w-full"
              />
              <span className="text-sm font-semibold text-primary w-12 text-right">{inputs.prematureRedemptionCapPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Standard cap is {maxMcDiscountCap}%. For premature redemption, you can set it lower.
            </p>
          </div>
        )}
      </div>

      <Button onClick={onSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg">
        <CalculatorIcon className="mr-2 h-5 w-5" />
        {isLoading ? 'Calculating...' : 'Calculate Gold Value'}
      </Button>
    </div>
  );
}

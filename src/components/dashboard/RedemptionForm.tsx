
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Coins, Weight, CircleDollarSign, Percent, CalculatorIcon, Sparkles, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

// Similar to CalculatorInputState but without accumulatedGoldGrams
export interface RedemptionInputState {
  intendedJewelleryWeight: string;
  currentGoldPrice: string;
  makingChargePercentage: string;
  isPrematureRedemption: boolean;
  prematureRedemptionCapPercentage: number;
}

interface RedemptionFormProps {
  inputs: RedemptionInputState;
  accumulatedGoldGrams: number; // Passed from scheme details
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (checked: boolean) => void;
  onSliderChange: (value: number[]) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  maxMcDiscountCap: number;
}

const iconProps = { className: "mr-2 h-4 w-4 text-accent" };

export function RedemptionForm({
  inputs,
  accumulatedGoldGrams,
  onInputChange,
  onCheckboxChange,
  onSliderChange,
  onSubmit,
  isLoading,
  maxMcDiscountCap
}: RedemptionFormProps) {
  
  const inputFields = [
    { id: 'intendedJewelleryWeight', label: 'Total Jewelry Weight Desired (g)', type: 'number', placeholder: 'e.g., 6.094g', value: inputs.intendedJewelleryWeight, icon: <Weight {...iconProps} /> },
    { id: 'currentGoldPrice', label: 'Current Gold Rate at Redemption (₹/gram)', type: 'number', placeholder: 'e.g., ₹7000', value: inputs.currentGoldPrice, icon: <CircleDollarSign {...iconProps} /> },
    { id: 'makingChargePercentage', label: 'Making Charges Percentage (%)', type: 'number', placeholder: 'e.g., 18%', value: inputs.makingChargePercentage, icon: <Percent {...iconProps} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md bg-primary/5">
        <h4 className="font-semibold text-primary flex items-center mb-2">
          <Sparkles className="mr-2 h-5 w-5" /> Your Accumulated Gold (from Scheme)
        </h4>
        <p className="text-lg font-bold">{formatNumber(accumulatedGoldGrams, 3)} grams</p>
        <p className="text-xs text-muted-foreground">This value is used for redemption calculations.</p>
      </div>

      <h3 className="font-headline text-xl font-semibold text-primary flex items-center">
        Jewellery & Redemption Details
      </h3>
      {inputFields.map(field => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={`redemption-${field.id}`} className="flex items-center text-foreground/80">
            {field.icon}
            {field.label}
          </Label>
          <Input
            id={`redemption-${field.id}`}
            name={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={inputs[field.id as keyof RedemptionInputState]}
            onChange={onInputChange}
            className="bg-background/80 border-border focus:ring-primary"
            min="0"
            step={field.id === 'intendedJewelleryWeight' ? '0.001' : '0.01'}
          />
        </div>
      ))}

      <div className="space-y-4 p-4 border border-dashed border-accent/50 rounded-md bg-accent/5">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="redemption-isPrematureRedemption"
            name="isPrematureRedemption"
            checked={inputs.isPrematureRedemption}
            onCheckedChange={onCheckboxChange}
          />
          <Label htmlFor="redemption-isPrematureRedemption" className="flex items-center font-medium text-accent">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Premature Redemption?
          </Label>
        </div>

        {inputs.isPrematureRedemption && (
          <div className="space-y-2 pl-2">
            <Label htmlFor="redemption-prematureRedemptionCapPercentage" className="text-sm text-muted-foreground">
              Adjust MC Discount Cap ({inputs.prematureRedemptionCapPercentage}%)
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                id="redemption-prematureRedemptionCapPercentage"
                name="prematureRedemptionCapPercentage"
                min={0}
                max={maxMcDiscountCap} 
                step={1}
                value={[inputs.prematureRedemptionCapPercentage]}
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
        {isLoading ? 'Saving Redemption...' : 'Calculate & Save Redemption'}
      </Button>
    </div>
  );
}

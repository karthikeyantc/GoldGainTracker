
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, GaugeIcon, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LiveGoldPriceFetcher } from '@/components/shared/LiveGoldPriceFetcher';

interface Transaction {
  date: Date;
  investedAmount: number;
  goldRate: number;
  goldPurchasedGrams: number;
}

interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSave: (updatedTransaction: Transaction, originalTransaction: Transaction) => Promise<void>;
}

export function EditTransactionDialog({ isOpen, onClose, transaction, onSave }: EditTransactionDialogProps) {
  const [amount, setAmount] = useState(String(transaction.investedAmount));
  const [goldRate, setGoldRate] = useState(String(transaction.goldRate));
  const [date, setDate] = useState<Date | undefined>(transaction.date);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setAmount(String(transaction.investedAmount));
      setGoldRate(String(transaction.goldRate));
      setDate(transaction.date);
    }
  }, [isOpen, transaction]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedGoldRate = parseFloat(goldRate);

    if (isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedGoldRate) || parsedGoldRate <= 0) {
      toast({ title: "Invalid Input", description: "Please enter valid positive numbers for amount and gold rate.", variant: "destructive" });
      return;
    }
    if (!date) {
      toast({ title: "Invalid Date", description: "Please select a valid date.", variant: "destructive" });
      return;
    }

    const updatedTransaction: Transaction = {
      date,
      investedAmount: parsedAmount,
      goldRate: parsedGoldRate,
      goldPurchasedGrams: parsedAmount / parsedGoldRate,
    };

    setIsSaving(true);
    await onSave(updatedTransaction, transaction);
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details for the transaction made on {format(transaction.date, 'PPP')}. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right flex items-center col-span-4">
              <Landmark className="mr-2 h-4 w-4" /> Investment Amount (₹)
            </Label>
            <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="col-span-4" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goldRate" className="text-right flex items-center col-span-4">
              <GaugeIcon className="mr-2 h-4 w-4" /> Gold Rate (₹/gram)
            </Label>
            <Input id="goldRate" value={goldRate} onChange={(e) => setGoldRate(e.target.value)} type="number" className="col-span-4" />
            <div className="col-span-4">
              <LiveGoldPriceFetcher onPriceUpdate={setGoldRate} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right flex items-center col-span-4">
              <CalendarIcon className="mr-2 h-4 w-4" /> Investment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal col-span-4", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d > new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

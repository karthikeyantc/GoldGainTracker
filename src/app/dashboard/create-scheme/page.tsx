
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PiggyBank, Edit3 } from 'lucide-react';
import Link from 'next/link';

type InvestmentType = 'monthly' | 'lumpsum';

interface SchemeFormData {
  schemeName: string;
  investmentType: InvestmentType;
  initialInvestmentAmount: string; // Stored as string for input, converted to number on save
}

const initialFormData: SchemeFormData = {
  schemeName: '',
  investmentType: 'monthly',
  initialInvestmentAmount: '',
};

export default function CreateSchemePage() {
  const [formData, setFormData] = useState<SchemeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, investmentType: value as InvestmentType }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a scheme.', variant: 'destructive' });
      return;
    }
    if (!formData.schemeName.trim()) {
      toast({ title: 'Validation Error', description: 'Scheme name is required.', variant: 'destructive' });
      return;
    }
    const amount = parseFloat(formData.initialInvestmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Validation Error', description: 'Please enter a valid positive investment amount.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const schemeData = {
        userId: user.uid,
        schemeName: formData.schemeName.trim(),
        investmentType: formData.investmentType,
        startDate: new Date(), // Use client-side date
        totalInvestedAmount: amount,
        totalAccumulatedGoldGrams: 0, // Will be calculated after first transaction
        status: 'ongoing',
        createdAt: serverTimestamp(),
        // Transactions will be a subcollection or an array, initialize empty for now
        transactions: [], 
      };

      await addDoc(collection(db, 'investmentSchemes'), schemeData);

      toast({ title: 'Success!', description: `Scheme "${formData.schemeName}" created successfully.` });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating scheme:', error);
      toast({ title: 'Error', description: 'Failed to create scheme. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
     // Redirect in layout, but good to have a fallback or message
     React.useEffect(() => {
        router.push('/auth');
     }, [router]);
     return <div className="flex justify-center items-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <>
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <Edit3 className="mr-2 h-6 w-6 text-primary" /> Create New Investment Scheme
          </CardTitle>
          <CardDescription>Define the details for your new gold investment scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schemeName">Scheme Name</Label>
              <Input
                id="schemeName"
                name="schemeName"
                value={formData.schemeName}
                onChange={handleInputChange}
                placeholder="e.g., My Daughter's Education Fund"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentType">Investment Type</Label>
              <Select
                name="investmentType"
                value={formData.investmentType}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger id="investmentType">
                  <SelectValue placeholder="Select investment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="lumpsum">Lumpsum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initialInvestmentAmount">
                {formData.investmentType === 'monthly' ? 'First Month\'s Investment (₹)' : 'Lumpsum Investment Amount (₹)'}
              </Label>
              <Input
                id="initialInvestmentAmount"
                name="initialInvestmentAmount"
                type="number"
                value={formData.initialInvestmentAmount}
                onChange={handleInputChange}
                placeholder="e.g., 5000"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Scheme...' : (
                <>
                  <PiggyBank className="mr-2 h-5 w-5" /> Create Scheme
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

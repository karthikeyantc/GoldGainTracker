
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { fetchLiveGoldPrice, type LiveGoldPriceOutput } from '@/ai/flows/gold-price-flow';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

interface LiveGoldPriceFetcherProps {
  onPriceUpdate: (price: string) => void;
}

export function LiveGoldPriceFetcher({ onPriceUpdate }: LiveGoldPriceFetcherProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<LiveGoldPriceOutput | null>(null);
  const { toast } = useToast();

  const handleFetchPrice = async () => {
    setIsLoading(true);
    setPriceData(null);
    try {
      const result = await fetchLiveGoldPrice();
      setPriceData(result);
      toast({
        title: 'Price Fetched!',
        description: `Source: ${result.source}`,
      });
    } catch (error) {
      console.error('Error fetching live gold price:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch live gold price.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePrice = () => {
    if (priceData) {
      onPriceUpdate(String(priceData.pricePerGram));
      toast({
        title: 'Price Applied!',
        description: `${formatCurrency(priceData.pricePerGram)} has been set as the gold rate.`,
      });
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFetchPrice}
        disabled={isLoading}
        className="w-full"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {isLoading ? 'Fetching Live Price...' : 'Fetch Live Gold Price (24K)'}
      </Button>

      {priceData && (
        <div className="p-3 border rounded-md bg-accent/10 text-sm space-y-2">
          <p className="font-semibold text-accent-foreground">
            Fetched Rate: <span className="text-lg">{formatCurrency(priceData.pricePerGram)}/g</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Source: {priceData.source} (fetched at {format(new Date(priceData.timestamp), 'p')})
          </p>
          {priceData.note && <p className="text-xs text-blue-600 dark:text-blue-400 italic">{priceData.note}</p>}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUsePrice}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Use This Price
          </Button>
        </div>
      )}
    </div>
  );
}

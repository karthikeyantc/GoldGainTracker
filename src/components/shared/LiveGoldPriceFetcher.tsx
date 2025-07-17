
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchLiveGoldPrice, type LiveGoldPriceOutput } from '@/ai/flows/gold-price-flow.ts';
import { formatCurrency } from '@/lib/formatters';
import { RefreshCcw, ArrowDownCircle } from 'lucide-react';

interface LiveGoldPriceFetcherProps {
    onPriceUpdate: (price: string) => void;
}

export function LiveGoldPriceFetcher({ onPriceUpdate }: LiveGoldPriceFetcherProps) {
    const [priceData, setPriceData] = useState<LiveGoldPriceOutput | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const { toast } = useToast();

    const handleFetchPrice = async () => {
        setIsFetching(true);
        try {
            const data = await fetchLiveGoldPrice();
            setPriceData(data);
            toast({
                title: 'Price Fetched',
                description: `Live gold price is ${formatCurrency(data.price)}.`,
            });
        } catch (error) {
            console.error('Error fetching live gold price:', error);
            toast({
                title: 'Error',
                description: 'Could not fetch live gold price.',
                variant: 'destructive',
            });
        } finally {
            setIsFetching(false);
        }
    };
    
    const handleUsePrice = () => {
        if(priceData) {
            onPriceUpdate(String(priceData.price));
            toast({
                title: 'Price Updated',
                description: 'The Gold rate input has been updated with the fetched price.',
            });
        }
    }

    return (
        <div className="mt-2 p-3 border rounded-md bg-accent/5 space-y-3">
            <h4 className="text-sm font-medium text-accent">Live Gold Rate Fetcher</h4>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleFetchPrice}
                disabled={isFetching}
            >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Fetching Price...' : 'Fetch Live Gold Price'}
            </Button>
            {priceData && (
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                        Fetched Price: <span className="font-semibold text-primary">{formatCurrency(priceData.price)}/g</span>
                        <br/>
                        <span className="text-xs">Source: {priceData.source} (Last updated: {new Date(priceData.lastUpdated).toLocaleTimeString()})</span>
                    </p>
                    {priceData.notes && <p className="text-xs italic text-amber-600">{priceData.notes}</p>}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={handleUsePrice}
                    >
                       <ArrowDownCircle className="mr-2 h-4 w-4" />
                       Use This Price
                    </Button>
                </div>
            )}
        </div>
    );
}

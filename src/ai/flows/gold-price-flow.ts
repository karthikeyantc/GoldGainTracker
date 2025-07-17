
'use server';

/**
 * @fileOverview A flow to fetch the live gold price.
 *
 * - fetchLiveGoldPrice - Fetches the current gold price.
 * - LiveGoldPriceOutput - The return type for the fetchLiveGoldPrice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LiveGoldPriceOutputSchema = z.object({
  price: z.number().describe('The current price of gold per gram in INR.'),
  source: z.string().describe('The source from which the price was fetched.'),
  lastUpdated: z.string().describe('The timestamp of when the price was last updated.'),
  notes: z.string().optional().describe('Any additional notes about the price, e.g., if it is mocked.'),
});

export type LiveGoldPriceOutput = z.infer<typeof LiveGoldPriceOutputSchema>;

export async function fetchLiveGoldPrice(): Promise<LiveGoldPriceOutput> {
  return fetchLiveGoldPriceFlow();
}

const fetchLiveGoldPriceFlow = ai.defineFlow(
  {
    name: 'fetchLiveGoldPriceFlow',
    inputSchema: z.void(),
    outputSchema: LiveGoldPriceOutputSchema,
  },
  async () => {
    // In a real application, this would contain logic to scrape a website
    // or call a reliable financial data API.
    // For this prototype, we are returning a mocked value.
    const mockedPrice = 7150 + Math.random() * 200; // A realistic random price
    
    return {
      price: parseFloat(mockedPrice.toFixed(2)),
      source: 'Tanishq (Mocked)',
      lastUpdated: new Date().toISOString(),
      notes: 'This is a mocked price for demonstration purposes. In a real app, this would be scraped from a live source.',
    };
  }
);

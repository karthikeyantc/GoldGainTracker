'use server';

/**
 * @fileOverview Investment forecast prediction flow.
 *
 * - investmentForecast - Predicts the investment forecast at the end of the investment period.
 * - InvestmentForecastInput - The input type for the investmentForecast function.
 * - InvestmentForecastOutput - The return type for the investmentForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentForecastInputSchema = z.object({
  monthlyInvestment: z.number().describe('The monthly investment amount.'),
  monthsPaid: z.number().describe('The number of months the investment has been paid for.'),
  currentGoldPrice: z.number().describe('The current gold price per unit weight.'),
  intendedJewelleryWeight: z.number().describe('The intended jewellery weight in the same unit as the gold price.'),
  makingChargePercentage: z.number().describe('The making charge percentage on the jewellery.'),
});
export type InvestmentForecastInput = z.infer<typeof InvestmentForecastInputSchema>;

const InvestmentForecastOutputSchema = z.object({
  forecastedGoldAmount: z
    .number()
    .describe('The predicted amount of gold accumulated at the end of the investment period.'),
  forecastedJewelleryCost: z
    .number()
    .describe('The predicted cost of the jewellery at the end of the investment period, including making charges and GST.'),
  summary: z.string().describe('A summary of the investment forecast, including potential risks and opportunities.'),
});
export type InvestmentForecastOutput = z.infer<typeof InvestmentForecastOutputSchema>;

export async function investmentForecast(input: InvestmentForecastInput): Promise<InvestmentForecastOutput> {
  return investmentForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentForecastPrompt',
  input: {schema: InvestmentForecastInputSchema},
  output: {schema: InvestmentForecastOutputSchema},
  prompt: `You are an expert financial advisor specializing in gold investments.

You will receive the user's investment details, including monthly investment, months paid, current gold price, intended jewellery weight, and making charge percentage.

You will use this information to predict the amount of gold they will have accumulated at the end of their investment period, the potential cost of their jewellery, and a summary of the investment forecast, including potential risks and opportunities.

Monthly Investment: {{{monthlyInvestment}}}
Months Paid: {{{monthsPaid}}}
Current Gold Price: {{{currentGoldPrice}}}
Intended Jewellery Weight: {{{intendedJewelleryWeight}}}
Making Charge Percentage: {{{makingChargePercentage}}}

Consider various factors like market fluctuations, potential changes in gold prices, and the impact of making charges and GST on the final cost.

Provide a realistic and informative forecast to help the user plan their finances better.

forecastedGoldAmount: The predicted amount of gold accumulated at the end of the investment period.
forecastedJewelleryCost: The predicted cost of the jewellery at the end of the investment period, including making charges and GST.
summary: A summary of the investment forecast, including potential risks and opportunities.
`,
});

const investmentForecastFlow = ai.defineFlow(
  {
    name: 'investmentForecastFlow',
    inputSchema: InvestmentForecastInputSchema,
    outputSchema: InvestmentForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

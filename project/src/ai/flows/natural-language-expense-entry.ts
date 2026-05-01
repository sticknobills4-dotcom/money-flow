'use server';
/**
 * @fileOverview A Genkit flow for extracting transaction details from messy natural language.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NaturalLanguageExpenseEntryInputSchema = z.object({
  naturalLanguageInput: z.string(),
});
export type NaturalLanguageExpenseEntryInput = z.infer<typeof NaturalLanguageExpenseEntryInputSchema>;

const NaturalLanguageExpenseEntryOutputSchema = z.object({
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  description: z.string(),
});
export type NaturalLanguageExpenseEntryOutput = z.infer<typeof NaturalLanguageExpenseEntryOutputSchema>;

const naturalLanguageExpensePrompt = ai.definePrompt({
  name: 'naturalLanguageExpensePrompt',
  input: {schema: NaturalLanguageExpenseEntryInputSchema},
  output: {schema: NaturalLanguageExpenseEntryOutputSchema},
  prompt: `You are an expert at parsing messy financial inputs.
Extract the details into structured JSON.
1. Amount: Extract the numeric value.
2. Category: Choose from (Food, Transport, Utilities, Shopping, Entertainment, Health, Housing, Education, Miscellaneous).
3. Date: Return current ISO date (YYYY-MM-DD) if no specific date is mentioned.
4. Description: Create a short, clean description.

Parse this spending input: "{{{naturalLanguageInput}}}"`,
});

const naturalLanguageExpenseFlow = ai.defineFlow(
  {
    name: 'naturalLanguageExpenseFlow',
    inputSchema: NaturalLanguageExpenseEntryInputSchema,
    outputSchema: NaturalLanguageExpenseEntryOutputSchema,
  },
  async (input) => {
    const {output} = await naturalLanguageExpensePrompt(input);
    return output!;
  }
);

export async function naturalLanguageExpenseEntry(
  input: NaturalLanguageExpenseEntryInput
): Promise<NaturalLanguageExpenseEntryOutput> {
  return naturalLanguageExpenseFlow(input);
}

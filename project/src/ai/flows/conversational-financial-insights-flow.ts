
'use server';
/**
 * @fileOverview A Genkit flow for general financial guidance and insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalFinancialInsightsInputSchema = z.object({
  userInput: z.string(),
});
export type ConversationalFinancialInsightsInput = z.infer<typeof ConversationalFinancialInsightsInputSchema>;

const ConversationalFinancialInsightsOutputSchema = z.string();
export type ConversationalFinancialInsightsOutput = z.infer<typeof ConversationalFinancialInsightsOutputSchema>;

const financialInsightsPrompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: { schema: ConversationalFinancialInsightsInputSchema },
  output: { schema: ConversationalFinancialInsightsOutputSchema },
  prompt: `You are Cashflow AI, a smart financial companion.
Your goal is to help users manage their money better. 

Rules:
- If the user asks about their spending, tell them you've added it if they provided details.
- If they ask general money questions like "how to save?", give short, practical advice.
- Always be friendly and encouraging.
- If a user mentions spending like "tea 10", assume they want to record it.
- Never mention internal technical details or tools.

User Message: {{{userInput}}}`
});

const financialInsightsFlow = ai.defineFlow(
  {
    name: 'financialInsightsFlow',
    inputSchema: ConversationalFinancialInsightsInputSchema,
    outputSchema: ConversationalFinancialInsightsOutputSchema,
  },
  async (input) => {
    try {
      const {text} = await financialInsightsPrompt(input);
      return text || "I'm here to help with your finances! What's on your mind?";
    } catch (error) {
      console.error("Genkit Flow Error:", error);
      return "I'm having a bit of trouble connecting to my brain right now. Can you try again?";
    }
  }
);

export async function conversationalFinancialInsights(
  input: ConversationalFinancialInsightsInput
): Promise<ConversationalFinancialInsightsOutput> {
  return financialInsightsFlow(input);
}

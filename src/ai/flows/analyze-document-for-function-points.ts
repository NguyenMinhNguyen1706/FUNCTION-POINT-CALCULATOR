'use server';

/**
 * @fileOverview An AI agent that analyzes a document and identifies potential Function Point components.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A document to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnalyzeDocumentOutputSchema = z.object({
  potentialFunctionPoints: z.object({
    EI: z.string().describe('Potential External Inputs (EI) identified in the document.'),
    EO: z.string().describe('Potential External Outputs (EO) identified in the document.'),
    EQ: z.string().describe('Potential External Inquiries (EQ) identified in the document.'),
    ILF: z.string().describe('Potential Internal Logical Files (ILF) identified in the document.'),
    EIF: z.string().describe('Potential External Interface Files (EIF) identified in the document.'),
  }).describe('Potential Function Point components identified in the document.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert software analyst skilled at identifying Function Point components in software documentation.

  Analyze the provided document and identify potential External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), and External Interface Files (EIF).

  Document: {{media url=documentDataUri}}
  \n\
  Provide the potential function points in the following JSON format:
  {
    "potentialFunctionPoints": {
      "EI": "Potential External Inputs identified in the document.",
      "EO": "Potential External Outputs identified in the document.",
      "EQ": "Potential External Inquiries identified in the document.",
      "ILF": "Potential Internal Logical Files identified in the document.",
      "EIF": "Potential External Interface Files identified in the document."
    }
  }`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

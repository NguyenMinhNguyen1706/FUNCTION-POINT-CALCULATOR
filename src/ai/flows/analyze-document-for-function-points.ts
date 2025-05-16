
'use server';

/**
 * @fileOverview An AI agent that analyzes a document and identifies potential Function Point components,
 * providing both textual descriptions and estimated numerical counts.
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

const FunctionPointDetailSchema = z.object({
  description: z.string().describe("A textual summary of the identified items for this function point type."),
  count: z.number().optional().describe("An estimated numerical count for this function point type. Provide this if a reasonable estimate can be made from the document. If not, this can be omitted or set to null."),
});

const AnalyzeDocumentOutputSchema = z.object({
  potentialFunctionPoints: z.object({
    EI: FunctionPointDetailSchema.describe('Potential External Inputs (EI) identified in the document, including a description and an estimated count.'),
    EO: FunctionPointDetailSchema.describe('Potential External Outputs (EO) identified in the document, including a description and an estimated count.'),
    EQ: FunctionPointDetailSchema.describe('Potential External Inquiries (EQ) identified in the document, including a description and an estimated count.'),
    ILF: FunctionPointDetailSchema.describe('Potential Internal Logical Files (ILF) identified in the document, including a description and an estimated count.'),
    EIF: FunctionPointDetailSchema.describe('Potential External Interface Files (EIF) identified in the document, including a description and an estimated count.'),
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
  prompt: `You are an expert software analyst skilled at identifying Function Point components in software documentation and estimating their counts.

  Analyze the provided document and identify potential External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), and External Interface Files (EIF).

  For each identified Function Point type (EI, EO, EQ, ILF, EIF):
  1. Provide a concise textual description summarizing what was identified.
  2. Provide an estimated numerical count of how many distinct items of that type you identified. If you cannot reasonably determine a count, you may omit the 'count' field or set it to null for that specific component.

  Document: {{media url=documentDataUri}}
  \n\
  Provide the potential function points in the following JSON format:
  {
    "potentialFunctionPoints": {
      "EI": {
        "description": "Brief textual summary of potential EIs identified...",
        "count": 3 // Or null/omitted if not determinable
      },
      "EO": {
        "description": "Brief textual summary of potential EOs identified...",
        "count": 2 // Or null/omitted
      },
      "EQ": {
        "description": "Brief textual summary of potential EQs identified...",
        "count": 5 // Or null/omitted
      },
      "ILF": {
        "description": "Brief textual summary of potential ILFs identified...",
        "count": 1 // Or null/omitted
      },
      "EIF": {
        "description": "Brief textual summary of potential EIFs identified...",
        "count": 0 // Or null/omitted
      }
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
    // Ensure output matches the schema, especially if AI might return incomplete objects.
    // For now, we'll trust the model to adhere to the output schema if the prompt is clear.
    // More robust error handling or default value setting could be added here if needed.
    return output!;
  }
);

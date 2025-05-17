
'use server';

/**
 * @fileOverview An AI agent that analyzes a document to identify potential Function Point components
 * (providing descriptions and estimated counts) and to estimate Unadjusted Function Points (UFP).
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SIMPLE_WEIGHTS } from '@/lib/constants';

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
  count: z.number().int().optional().nullable().describe("An estimated numerical count for this function point type. Provide this if a reasonable estimate can be made from the document. If not, this can be omitted or set to null."),
});

const AnalyzeDocumentOutputSchema = z.object({
  potentialFunctionPoints: z.object({
    EI: FunctionPointDetailSchema.describe('Potential External Inputs (EI) identified in the document, including a description and an estimated count.'),
    EO: FunctionPointDetailSchema.describe('Potential External Outputs (EO) identified in the document, including a description and an estimated count.'),
    EQ: FunctionPointDetailSchema.describe('Potential External Inquiries (EQ) identified in the document, including a description and an estimated count.'),
    ILF: FunctionPointDetailSchema.describe('Potential Internal Logical Files (ILF) identified in the document, including a description and an estimated count.'),
    EIF: FunctionPointDetailSchema.describe('Potential External Interface Files (EIF) identified in the document, including a description and an estimated count.'),
  }).describe('Potential Function Point components identified in the document.'),
  estimatedUfp: z.number().optional().nullable().describe("The AI's estimated Unadjusted Function Points (UFP) based on its analysis of components and simplified average weights. This is an AI estimate. If component counts are indeterminate, this should be null."),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const weightsString = `EI: ${SIMPLE_WEIGHTS.ei}, EO: ${SIMPLE_WEIGHTS.eo}, EQ: ${SIMPLE_WEIGHTS.eq}, ILF: ${SIMPLE_WEIGHTS.ilf}, EIF: ${SIMPLE_WEIGHTS.eif}`;

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert software analyst focusing on Function Point Analysis.
Analyze the provided document. Your goal is to:

1.  **Identify Function Point Components**: For External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), and External Interface Files (EIF):
    *   Provide a textual summary of what was identified for each type.
    *   Estimate a numerical count (integer) for each type. If a count cannot be reasonably determined, its value for 'count' must be null.

2.  **Estimate Unadjusted Function Points (UFP) (AI Estimate)**:
    *   Using your identified component counts, attempt to calculate an estimated Unadjusted Function Points (UFP).
    *   For UFP, use these average weights: ${weightsString}. (Formula: UFP = Sum of (component_count × average_weight)).
    *   If any component count necessary for this calculation is null, then the estimatedUfp must also be null.

Document: {{media url=documentDataUri}}

Output your analysis in JSON format, strictly following the defined output schema.
Ensure all schema fields are present. Use 'null' for any individual count or overall estimation (UFP) that cannot be determined from the document.
`,
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

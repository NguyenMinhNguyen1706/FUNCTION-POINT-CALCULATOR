
'use server';

/**
 * @fileOverview An AI agent that analyzes a document to identify potential Function Point components
 * (providing descriptions and estimated counts) and to estimate ratings for General System Characteristics (GSCs).
 * It also attempts to provide an overall estimation of UFP, VAF, and AFP based on its analysis.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GSC_FACTORS, GSCFactorId, SIMPLE_WEIGHTS } from '@/lib/constants';

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

// Dynamically create the GSC ratings part of the schema
const gscRatingsSchemaFields = GSC_FACTORS.reduce((acc, factor) => {
  acc[factor.id as GSCFactorId] = z.number().int().min(0).max(5).optional().nullable()
    .describe(`Estimated rating (0-5) for ${factor.name}. Omit or set to null if not determinable.`);
  return acc;
}, {} as Record<GSCFactorId, z.ZodOptional<z.ZodNullable<z.ZodNumber>>>);

const GscRatingsSchema = z.object(gscRatingsSchemaFields)
  .describe('Estimated ratings (0-5) for General System Characteristics. Each rating should be an integer between 0 and 5. Omit or set to null if a GSC rating cannot be reasonably determined from the document.');


const AnalyzeDocumentOutputSchema = z.object({
  potentialFunctionPoints: z.object({
    EI: FunctionPointDetailSchema.describe('Potential External Inputs (EI) identified in the document, including a description and an estimated count.'),
    EO: FunctionPointDetailSchema.describe('Potential External Outputs (EO) identified in the document, including a description and an estimated count.'),
    EQ: FunctionPointDetailSchema.describe('Potential External Inquiries (EQ) identified in the document, including a description and an estimated count.'),
    ILF: FunctionPointDetailSchema.describe('Potential Internal Logical Files (ILF) identified in the document, including a description and an estimated count.'),
    EIF: FunctionPointDetailSchema.describe('Potential External Interface Files (EIF) identified in the document, including a description and an estimated count.'),
  }).describe('Potential Function Point components identified in the document.'),
  gscRatings: GscRatingsSchema.optional().describe('Estimated ratings for General System Characteristics (GSCs).'),
  estimatedUfp: z.number().optional().nullable().describe("The AI's estimated Unadjusted Function Points (UFP) based on its analysis of components and simplified average weights. This is an AI estimate."),
  estimatedVaf: z.number().optional().nullable().describe("The AI's estimated Value Adjustment Factor (VAF) based on its GSC ratings. This is an AI estimate."),
  estimatedAfp: z.number().optional().nullable().describe("The AI's estimated Adjusted Function Points (AFP = UFP * VAF). This is an AI estimate."),
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
    *   Estimate a numerical count (integer) for each type. If a count cannot be reasonably determined, its value must be null.

2.  **Estimate General System Characteristic (GSC) Ratings**: For each GSC defined in the output schema's 'gscRatings' section (refer to schema field descriptions for GSC details):
    *   Provide an integer rating from 0 (Not Present/Applicable) to 5 (Strongly Present/Influential).
    *   If a rating for a specific GSC cannot be determined from the document, its value must be null.

3.  **Estimate Overall Function Points (AI Estimate)**:
    *   Using your identified component counts and GSC ratings, attempt to calculate an estimated Unadjusted Function Points (UFP), Value Adjustment Factor (VAF), and Adjusted Function Points (AFP).
    *   For UFP, use these average weights: ${weightsString}. (Formula: UFP = Sum of (component_count × average_weight)).
    *   For VAF, use the sum of your GSC ratings (TDI). (Formula: VAF = 0.65 + (0.01 × TDI)).
    *   For AFP, use your estimated UFP and VAF. (Formula: AFP = UFP × VAF).
    *   If any component count or GSC rating necessary for these calculations is null, then the corresponding estimated UFP, VAF, or AFP must also be null.

Document: {{media url=documentDataUri}}

Output your analysis in JSON format, strictly following the defined output schema.
Ensure all schema fields are present. Use 'null' for any individual count, rating, or overall estimation (UFP, VAF, AFP) that cannot be determined from the document.
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


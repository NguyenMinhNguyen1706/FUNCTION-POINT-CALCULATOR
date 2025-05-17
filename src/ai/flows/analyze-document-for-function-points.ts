
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

// Create the GSC list string for the prompt
const gscPromptList = GSC_FACTORS.map(factor => `- ${factor.name} (${factor.id}): ${factor.description}`).join('\n  ');
const weightsString = `EI: ${SIMPLE_WEIGHTS.ei}, EO: ${SIMPLE_WEIGHTS.eo}, EQ: ${SIMPLE_WEIGHTS.eq}, ILF: ${SIMPLE_WEIGHTS.ilf}, EIF: ${SIMPLE_WEIGHTS.eif}`;

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert software analyst skilled at Function Point Analysis and evaluating system characteristics.

Analyze the provided document for three main purposes:
1. Identify potential Function Point components: External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), and External Interface Files (EIF).
   For each identified Function Point type:
     a. Provide a concise textual description summarizing what was identified.
     b. Provide an estimated numerical count (integer) of how many distinct items of that type you identified. If you cannot reasonably determine a count, set it to null.

2. Estimate ratings for General System Characteristics (GSCs). For each GSC listed below, provide an estimated rating from 0 (Not Present or Not Applicable) to 5 (Strongly Present and Influential) based on the information in the document. The rating should be an integer. If you cannot reasonably determine a rating, set it to null.
   General System Characteristics to evaluate:
  ${gscPromptList}

3. After determining the FP component counts and GSC ratings, provide an overall AI-estimated calculation for Unadjusted Function Points (UFP), Value Adjustment Factor (VAF), and Adjusted Function Points (AFP).
   - To estimate UFP, use the component counts you derived and the following simplified average weights: ${weightsString}.
     Formula: UFP = (EI_count × ${SIMPLE_WEIGHTS.ei}) + (EO_count × ${SIMPLE_WEIGHTS.eo}) + (EQ_count × ${SIMPLE_WEIGHTS.eq}) + (ILF_count × ${SIMPLE_WEIGHTS.ilf}) + (EIF_count × ${SIMPLE_WEIGHTS.eif}).
   - To estimate VAF, use the GSC ratings you derived. Let TDI be the sum of all 14 GSC ratings.
     Formula: VAF = 0.65 + (0.01 × TDI). The VAF should be between 0.65 and 1.35.
   - To estimate AFP, use your estimated UFP and VAF.
     Formula: AFP = UFP × VAF.
   Provide these as 'estimatedUfp', 'estimatedVaf', and 'estimatedAfp' in the output. If any component count or GSC rating needed for these estimations is null, then the corresponding estimated UFP/VAF/AFP should also be null.

Document: {{media url=documentDataUri}}

Provide your analysis in JSON format, adhering to the defined output schema.
Ensure all fields exist in the output, using null if a value cannot be determined. For GSC ratings, provide an integer between 0 and 5, or null. For FP counts, provide an integer or null. For estimated UFP/VAF/AFP, provide a number or null.`,
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

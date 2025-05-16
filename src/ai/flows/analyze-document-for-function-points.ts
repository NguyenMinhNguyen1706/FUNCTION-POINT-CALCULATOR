
'use server';

/**
 * @fileOverview An AI agent that analyzes a document to identify potential Function Point components
 * (providing descriptions and estimated counts) and to estimate ratings for General System Characteristics (GSCs).
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GSC_FACTORS, GSCFactorId } from '@/lib/constants';

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
  count: z.number().optional().nullable().describe("An estimated numerical count for this function point type. Provide this if a reasonable estimate can be made from the document. If not, this can be omitted or set to null."),
});

// Dynamically create the GSC ratings part of the schema
const gscRatingsSchemaFields = GSC_FACTORS.reduce((acc, factor) => {
  acc[factor.id as GSCFactorId] = z.number().min(0).max(5).optional().nullable()
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
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

// Create the GSC list string for the prompt
const gscPromptList = GSC_FACTORS.map(factor => `- ${factor.name} (${factor.id}): ${factor.description}`).join('\n  ');

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an expert software analyst skilled at Function Point Analysis and evaluating system characteristics.

Analyze the provided document for two main purposes:
1. Identify potential Function Point components: External Inputs (EI), External Outputs (EO), External Inquiries (EQ), Internal Logical Files (ILF), and External Interface Files (EIF).
   For each identified Function Point type:
     a. Provide a concise textual description summarizing what was identified.
     b. Provide an estimated numerical count of how many distinct items of that type you identified. If you cannot reasonably determine a count from the document, you may omit the 'count' field or set it to null for that specific component.

2. Estimate ratings for General System Characteristics (GSCs). For each GSC listed below, provide an estimated rating from 0 (Not Present or Not Applicable) to 5 (Strongly Present and Influential) based on the information in the document. The rating should be an integer. If you cannot reasonably determine a rating for a GSC from the document, you may omit that GSC's field or set its value to null in the output.

   General System Characteristics to evaluate:
  ${gscPromptList}

Document: {{media url=documentDataUri}}

Provide your analysis in the following JSON format:
{
  "potentialFunctionPoints": {
    "EI": { "description": "...", "count": null },
    "EO": { "description": "...", "count": null },
    "EQ": { "description": "...", "count": null },
    "ILF": { "description": "...", "count": null },
    "EIF": { "description": "...", "count": null }
  },
  "gscRatings": {
    "dataCommunications": null, // Example: 3 if determinable
    "distributedDataProcessing": null,
    "performance": null,
    "heavilyUsedConfiguration": null,
    "transactionRate": null,
    "onlineDataEntry": null,
    "endUserEfficiency": null,
    "onlineUpdate": null,
    "complexProcessing": null,
    "reusability": null,
    "installationEase": null,
    "operationalEase": null,
    "multipleSites": null,
    "facilitateChange": null
  }
}
Ensure all fields exist in the output, using null if a value cannot be determined. For GSC ratings, provide an integer between 0 and 5, or null. For FP counts, provide an integer or null.`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Basic validation/ensure structure - AI might sometimes omit optional fields entirely.
    // For a more robust solution, one might merge with a default structure.
    // For now, trust the prompt and output schema guide the AI.
    return output!;
  }
);


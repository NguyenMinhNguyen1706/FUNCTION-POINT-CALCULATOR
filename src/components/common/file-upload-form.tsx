
"use client";

import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { analyzeDocument, type AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';
import type { HistoryEntry, FPInputs, GSCInputs, FPCalculationResult } from '@/lib/types';
import { calculateFunctionPoints } from '@/lib/calculations';
import { GSC_FACTORS, GSCFactorId } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { Form, FormControl, FormDescription as UiFormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const formSchema = z.object({
  file: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Unsupported file format. Please upload PDF, TXT, JPG, PNG, GIF, WEBP, or SVG."
    ),
});

type FormData = z.infer<typeof formSchema>;

interface FileUploadFormProps {
  onAnalysisComplete?: (result: AnalyzeDocumentOutput) => void;
}

export function FileUploadForm({ onAnalysisComplete }: FileUploadFormProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null); // Renamed from fileName
  const { toast } = useToast();
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCurrentFileName(files[0].name);
      form.setValue('file', files, { shouldValidate: true });
    } else {
      setCurrentFileName(null);
      form.resetField('file');
    }
  };
  
  const onSubmit = async (data: FormData) => {
    const file = data.file[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    // setCurrentFileName is already set by handleFileChange

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const documentDataUri = reader.result as string;
        try {
          const result = await analyzeDocument({ documentDataUri });
          setAnalysisResult(result);
          if (onAnalysisComplete) {
            onAnalysisComplete(result);
          }
          toast({ title: "Analysis Complete", description: "Document analysis finished. Suggestions and estimated counts are now available." });
        } catch (aiError: any) {
          console.error("AI Analysis Error:", aiError);
          setError(`AI analysis failed: ${aiError.message || 'Unknown error'}`);
          toast({ variant: "destructive", title: "Analysis Error", description: `AI analysis failed: ${aiError.message || 'Unknown error'}` });
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("File ReadError:", error);
        setError("Failed to read the file.");
        toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
        setIsLoading(false);
      };
    } catch (e: any) {
      console.error("File Upload Error:", e);
      setError(`An unexpected error occurred: ${e.message || 'Unknown error'}`);
      toast({ variant: "destructive", title: "Upload Error", description: `An unexpected error occurred: ${e.message || 'Unknown error'}` });
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = () => {
    if (analysisResult && currentFileName) {
      const fpInputs: FPInputs = {
        ei: analysisResult.potentialFunctionPoints.EI?.count ?? 0,
        eo: analysisResult.potentialFunctionPoints.EO?.count ?? 0,
        eq: analysisResult.potentialFunctionPoints.EQ?.count ?? 0,
        ilf: analysisResult.potentialFunctionPoints.ILF?.count ?? 0,
        eif: analysisResult.potentialFunctionPoints.EIF?.count ?? 0,
      };

      const gscInputs: GSCInputs = GSC_FACTORS.reduce((acc, factor) => {
        acc[factor.id as GSCFactorId] = 0; // Default all GSC ratings to 0 for AI-derived entry
        return acc;
      }, {} as GSCInputs);

      const calculatedFpResult = calculateFunctionPoints(fpInputs, gscInputs);
      
      const historyData: FPCalculationResult = {
        ...calculatedFpResult,
        fileName: currentFileName, // Store the filename with the FP result
      };

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        type: 'FP', // Save as FP type
        timestamp: Date.now(),
        data: historyData,
      };
      setHistory([newEntry, ...history]);
      toast({ title: "Saved to History", description: "FP calculation based on AI analysis has been saved." });
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => ( 
            <FormItem>
              <FormLabel htmlFor="file-upload">Upload Document or Image</FormLabel>
              <FormControl>
                 <Input 
                    id="file-upload" 
                    type="file" 
                    accept={ACCEPTED_FILE_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
              </FormControl>
              <UiFormDescription>
                Supported formats: PDF, TXT, JPG, PNG, GIF, WEBP, SVG. Max size: 10MB.
              </UiFormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze File"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {analysisResult && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle>Analysis Results for: <span className="text-primary">{currentFileName}</span></CardTitle>
            <CardDescription>
              The AI has identified potential Function Point components, estimated their counts, and provided an overall UFP estimate.
              These suggestions have pre-filled relevant fields in the form above. Review carefully and adjust GSC ratings as needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-lg text-foreground mb-2">AI's Overall UFP Estimation:</h4>
                {analysisResult.estimatedUfp !== null && analysisResult.estimatedUfp !== undefined ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                        <p className="font-semibold text-primary"><span className="font-medium">Est. UFP:</span> {analysisResult.estimatedUfp?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground mb-4">AI did not provide an overall UFP estimate.</p>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-lg text-foreground">Potential Function Point Components Suggested by AI:</h4>
                {Object.entries(analysisResult.potentialFunctionPoints).map(([key, value]) => (
                <div key={key} className="mt-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    <span className="font-medium text-foreground">{key}:</span> <span className="italic">{value.description || "Not described"}</span>
                    {value.count !== undefined && value.count !== null && (
                        <span className="ml-2">(Est. Count: {value.count})</span>
                    )}
                    </p>
                </div>
                ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveToHistory} variant="outline">Save Analysis as FP Calculation</Button>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}

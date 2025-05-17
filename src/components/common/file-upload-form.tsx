
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
import type { HistoryEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { Form, FormControl, FormDescription as UiFormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
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
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      form.setValue('file', files, { shouldValidate: true });
    } else {
      setFileName(null);
      form.resetField('file');
    }
  };
  
  const onSubmit = async (data: FormData) => {
    const file = data.file[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setFileName(file.name);

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
    if (analysisResult && fileName) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        type: 'ANALYSIS',
        timestamp: Date.now(),
        data: {
          fileName: fileName,
          result: analysisResult
        },
      };
      setHistory([newEntry, ...history]);
      toast({ title: "Saved to History", description: "File analysis result has been saved." });
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
                Supported formats: PDF, TXT, JPG, PNG, GIF, WEBP, SVG. Max size: 5MB.
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
            <CardTitle>Analysis Results for: <span className="text-primary">{fileName}</span></CardTitle>
            <CardDescription>
              The AI has identified potential Function Point components, estimated their counts, suggested GSC ratings, and provided an overall FP estimate.
              These suggestions can guide your input in the form above and some fields may have been pre-filled. Review carefully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-lg text-foreground mb-2">AI's Overall FP Estimation:</h4>
                {analysisResult.estimatedAfp !== null && analysisResult.estimatedAfp !== undefined ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
                        <p><span className="font-medium">Est. UFP:</span> {analysisResult.estimatedUfp?.toFixed(2) ?? 'N/A'}</p>
                        <p><span className="font-medium">Est. VAF:</span> {analysisResult.estimatedVaf?.toFixed(2) ?? 'N/A'}</p>
                        <p className="font-semibold text-primary"><span className="font-medium">Est. AFP:</span> {analysisResult.estimatedAfp?.toFixed(2) ?? 'N/A'}</p>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground mb-4">AI did not provide an overall FP estimate.</p>
                )}
            </div>

            <div>
                <h4 className="font-semibold text-lg text-foreground">Potential Function Point Components:</h4>
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
            
             {analysisResult.gscRatings && Object.keys(analysisResult.gscRatings).length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-lg text-foreground mb-1">Suggested GSC Ratings:</h4>
                 {Object.entries(analysisResult.gscRatings)
                  .filter(([_, value]) => value !== null && value !== undefined)
                  .map(([key, value]) => (
                  <p key={key} className="text-sm text-muted-foreground">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {value}
                  </p>
                ))}
                {Object.values(analysisResult.gscRatings).every(v => v === null || v === undefined) && (
                    <p className="text-sm text-muted-foreground">AI did not provide GSC ratings.</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveToHistory} variant="outline">Save to History</Button>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}


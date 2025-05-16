
"use client";

import { useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal } from 'lucide-react';
import { analyzeDocument } from '@/ai/flows/analyze-document-for-function-points';
import type { AnalyzeDocumentOutput, HistoryEntry, FileAnalysisResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
      "Unsupported file format. Please upload PDF, TXT, DOC, DOCX, JPG, PNG, GIF, WEBP, or SVG."
    ),
});

type FormData = z.infer<typeof formSchema>;

export function FileUploadForm() {
  const [analysisResult, setAnalysisResult] = useState<FileAnalysisResult | null>(null);
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
      // Trigger validation for the file input
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
          toast({ title: "Analysis Complete", description: "Document analysis finished successfully." });
        } catch (aiError: any) {
          console.error("AI Analysis Error:", aiError);
          setError(`AI analysis failed: ${aiError.message || 'Unknown error'}`);
          toast({ variant: "destructive", title: "Analysis Error", description: `AI analysis failed: ${aiError.message || 'Unknown error'}` });
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (error) => {
        console.error("File Read Error:", error);
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
          render={({ field }) => ( // `field` is not directly used here due to custom file handling
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
              <FormDescription>
                Supported formats: PDF, TXT, DOC, DOCX, JPG, PNG, GIF, WEBP, SVG. Max size: 5MB.
              </FormDescription>
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
              The following are potential Function Point components identified by the AI.
              These are suggestions and should be reviewed by an expert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analysisResult.potentialFunctionPoints).map(([key, value]) => (
              <div key={key}>
                <h4 className="font-semibold text-lg text-foreground">{key}:</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{value || "Not identified"}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveToHistory} variant="outline">Save to History</Button>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}


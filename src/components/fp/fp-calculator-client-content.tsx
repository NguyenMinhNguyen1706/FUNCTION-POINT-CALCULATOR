
"use client";

import { useState } from 'react';
import { FileScan } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorForm } from '@/components/fp/fp-calculator-form';
import { FileUploadForm } from '@/components/common/file-upload-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';

export function FpCalculatorClientContent() {
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);

  const handleAnalysisComplete = (result: AnalyzeDocumentOutput) => {
    setAiAnalysisResult(result);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Function Point Analysis</CardTitle>
          <CardDescription>Enter values for FP components and VAF. If a document is analyzed, AI suggestions for FP counts may pre-fill relevant fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <FpCalculatorForm
            aiFpSuggestions={aiAnalysisResult?.potentialFunctionPoints}
            // aiGscSuggestions is no longer passed as AI doesn't provide them
          />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="space-y-6">
        <PageHeader
            title="AI-Powered Document Analyzer"
            description="Upload a document (e.g., PDF, TXT, JPG, PNG) to analyze its content and get suggestions for Function Point components (counts and descriptions) and an estimated UFP."
            icon={FileScan}
        />
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Analyze Document for Function Points &amp; UFP</CardTitle>
            <CardDescription>The AI will attempt to identify FP components, estimate their counts, and suggest an overall UFP. Suggestions may pre-fill relevant fields in the form above.</CardDescription>
            </CardHeader>
            <CardContent>
            <FileUploadForm onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
        </Card>
      </div>
    </>
  );
}

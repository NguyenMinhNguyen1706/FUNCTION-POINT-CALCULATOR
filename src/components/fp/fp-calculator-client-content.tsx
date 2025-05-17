
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
          <CardDescription>Enter values for FP components and VAF. If a document is analyzed, AI suggestions for FP counts and VAF ratings may pre-fill relevant fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <FpCalculatorForm
            aiFpSuggestions={aiAnalysisResult?.potentialFunctionPoints}
            aiGscSuggestions={aiAnalysisResult?.gscRatings}
          />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="space-y-6">
        <PageHeader
            title="AI-Powered Document Analyzer"
            description="Upload a document (e.g., PDF, DOCX, TXT, JPG, PNG) to analyze its content and get suggestions for Function Point components (counts and descriptions) and Value Adjustment Factors (VAF)."
            icon={FileScan}
        />
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Analyze Document for Function Points &amp; VAF</CardTitle>
            <CardDescription>The AI will attempt to identify FP components, estimate their counts, and suggest ratings for VAF. Suggestions may pre-fill relevant fields in the form above.</CardDescription>
            </CardHeader>
            <CardContent>
            <FileUploadForm onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
        </Card>
      </div>
    </>
  );
}


"use client"; 

import { useState } from 'react';
import { FunctionSquare, FileScan } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorForm } from '@/components/fp/fp-calculator-form';
import { FileUploadForm } from '@/components/common/file-upload-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';

export default function FpCalculatorPage() {
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AnalyzeDocumentOutput | null>(null);

  const handleAnalysisComplete = (result: AnalyzeDocumentOutput) => {
    setAiAnalysisResult(result);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Function Point Calculator"
        description="Enter the Function Point components and the Value Adjustment Factors (VAF), or upload a document for analysis to calculate the Function Point (FP)."
        icon={FunctionSquare}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Function Point Analysis</CardTitle>
          <CardDescription>Enter values for FP components and GSCs. If a document is analyzed, AI suggestions for FP counts and GSC ratings may pre-fill relevant fields.</CardDescription>
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
            <CardTitle>Analyze Document for Function Points & GSCs</CardTitle>
            <CardDescription>The AI will attempt to identify FP components, estimate their counts, and suggest ratings for GSCs. Suggestions may pre-fill relevant fields in the form above.</CardDescription>
            </CardHeader>
            <CardContent>
            <FileUploadForm onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


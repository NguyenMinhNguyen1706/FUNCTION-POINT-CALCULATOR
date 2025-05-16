
"use client"; // Required for useState

import { useState } from 'react';
import { FunctionSquare, FileScan } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorForm } from '@/components/fp/fp-calculator-form';
import { FileUploadForm } from '@/components/common/file-upload-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { AnalyzeDocumentOutput } from '@/lib/types';

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
          <CardDescription>Enter the counts for each function point type and rate the General System Characteristics. AI suggestions from document analysis will appear below relevant fields if a document is analyzed.</CardDescription>
        </CardHeader>
        <CardContent>
          <FpCalculatorForm aiSuggestions={aiAnalysisResult?.potentialFunctionPoints} />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="space-y-6">
        <PageHeader
            title="AI-Powered Document Analyzer"
            description="Upload a document (e.g., PDF, DOCX, TXT, JPG, PNG) to analyze its content and get suggestions for Function Point components."
            icon={FileScan}
        />
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Analyze Document for Function Points</CardTitle>
            <CardDescription>The AI will attempt to identify potential EI, EO, EQ, ILF, and EIF based on the text extracted from your document. Suggestions will also appear in the form above.</CardDescription>
            </CardHeader>
            <CardContent>
            <FileUploadForm onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

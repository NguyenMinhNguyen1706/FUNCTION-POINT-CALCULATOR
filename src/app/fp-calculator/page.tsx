
import { FunctionSquare, FileScan } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorForm } from '@/components/fp/fp-calculator-form';
import { FileUploadForm } from '@/components/common/file-upload-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function FpCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Function Point Calculator"
        description="Calculate Adjusted Function Points (AFP) and analyze documents for potential Function Point components."
        icon={FunctionSquare}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Function Point Analysis</CardTitle>
          <CardDescription>Enter the counts for each function point type and rate the General System Characteristics.</CardDescription>
        </CardHeader>
        <CardContent>
          <FpCalculatorForm />
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
            <CardDescription>The AI will attempt to identify potential EI, EO, EQ, ILF, and EIF based on the text extracted from your document.</CardDescription>
            </CardHeader>
            <CardContent>
            <FileUploadForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}


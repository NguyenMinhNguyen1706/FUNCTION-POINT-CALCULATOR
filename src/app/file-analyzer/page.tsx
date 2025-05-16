import { FileScan } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FileUploadForm } from '@/components/common/file-upload-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function FileAnalyzerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="File Analyzer"
        description="Upload a document (e.g., PDF, DOCX, TXT) to analyze its content and get suggestions for Function Point components."
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
  );
}

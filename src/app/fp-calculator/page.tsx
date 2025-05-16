import { FunctionSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorForm } from '@/components/fp/fp-calculator-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function FpCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Function Point Calculator"
        description="Calculate Adjusted Function Points (AFP) based on component counts and General System Characteristics (GSCs)."
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
    </div>
  );
}

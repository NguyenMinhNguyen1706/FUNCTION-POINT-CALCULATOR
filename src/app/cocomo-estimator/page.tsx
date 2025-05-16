import { Calculator } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { CocomoForm } from '@/components/cocomo/cocomo-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CocomoEstimatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="COCOMO II Estimator"
        description="Estimate software development effort and schedule using the COCOMO II model."
        icon={Calculator}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>COCOMO II Estimation</CardTitle>
          <CardDescription>Enter KSLOC and rate the Scale Factors. This is a simplified version of Post-Architecture COCOMO II.</CardDescription>
        </CardHeader>
        <CardContent>
          <CocomoForm />
        </CardContent>
      </Card>
    </div>
  );
}

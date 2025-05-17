
"use client";

import { FunctionSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { FpCalculatorClientContent } from '@/components/fp/fp-calculator-client-content';

export default function FpCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Function Point Calculator"
        description="Enter the Function Point components and the Value Adjustment Factors (VAF), or upload a document for analysis to calculate the Function Point (FP)."
        icon={FunctionSquare}
      />
      <FpCalculatorClientContent />
    </div>
  );
}

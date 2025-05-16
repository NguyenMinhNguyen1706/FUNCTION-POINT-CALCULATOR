import { History } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { HistoryList } from '@/components/history/history-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculation History"
        description="Review your past Function Point calculations, COCOMO II estimations, and File Analyses."
        icon={History}
      />
      <Card className="shadow-lg">
         <CardHeader>
          <CardTitle>Saved Entries</CardTitle>
          <CardDescription>All your saved calculations and analyses are listed here. Data is stored in your browser's local storage.</CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryList />
        </CardContent>
      </Card>
    </div>
  );
}

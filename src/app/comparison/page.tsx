
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { HistoryTrendChart } from '@/components/comparison/history-trend-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Info } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { HistoryEntry, FPCalculationResult, CocomoCalculationResult } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ChartDataPoint {
  timestamp: number;
  date: string; // Formatted date string for X-axis
  value: number;
}

export default function ComparisonPage() {
  const [history] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const [afpData, setAfpData] = useState<ChartDataPoint[]>([]);
  const [cocomoEffortData, setCocomoEffortData] = useState<ChartDataPoint[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && history.length > 0) {
      const fpEntries = history
        .filter((entry): entry is HistoryEntry & { type: 'FP'; data: FPCalculationResult } => entry.type === 'FP')
        .map(entry => ({
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp).toLocaleDateString(),
          value: entry.data.afp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setAfpData(fpEntries);

      const cocomoEntries = history
        .filter((entry): entry is HistoryEntry & { type: 'COCOMO'; data: CocomoCalculationResult } => entry.type === 'COCOMO')
        .map(entry => ({
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp).toLocaleDateString(),
          value: entry.data.effort,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setCocomoEffortData(cocomoEntries);
    }
  }, [history, isClient]);

  if (!isClient) {
    return (
      <div className="flex h-full min-h-[calc(100vh-10rem)] w-full items-center justify-center">
        <p>Loading comparison data...</p>
      </div>
    );
  }

  const hasSufficientAfpData = afpData.length >= 2;
  const hasSufficientCocomoData = cocomoEffortData.length >= 2;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimation Trends & Comparison"
        description="Visualize trends in your Function Point (AFP) and COCOMO II (Effort) calculations over time."
        icon={TrendingUp}
      />

      {history.length === 0 && (
         <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            There is no calculation history to display. Please perform some FP or COCOMO II calculations first.
          </AlertDescription>
        </Alert>
      )}

      {history.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Adjusted Function Points (AFP) Trend</CardTitle>
              <CardDescription>Shows AFP values from your calculation history over time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-2 sm:p-4">
              {hasSufficientAfpData ? (
                <HistoryTrendChart
                  data={afpData}
                  valueLabel="AFP"
                  lineColor="hsl(var(--chart-1))"
                  tooltipLabel="AFP"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Info className="mr-2 h-5 w-5" />
                  Not enough AFP data points (minimum 2 required) to display a trend.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>COCOMO II Effort (PM) Trend</CardTitle>
              <CardDescription>Shows COCOMO II Effort (Person-Months) from your estimation history over time.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-2 sm:p-4">
              {hasSufficientCocomoData ? (
                <HistoryTrendChart
                  data={cocomoEffortData}
                  valueLabel="Effort (PM)"
                  lineColor="hsl(var(--chart-2))"
                  tooltipLabel="Effort"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Info className="mr-2 h-5 w-5" />
                  Not enough COCOMO II data points (minimum 2 required) to display a trend.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
       {/* Placeholder for future scatter plots or other comparison charts */}
      {/* 
      <Card className="shadow-lg mt-6">
        <CardHeader>
          <CardTitle>AFP vs. COCOMO Effort Scatter Plot</CardTitle>
          <CardDescription>Explore the relationship between AFP and COCOMO II Effort. (Requires linked data)</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Info className="mr-2 h-5 w-5" />
            Scatter plot functionality coming soon.
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

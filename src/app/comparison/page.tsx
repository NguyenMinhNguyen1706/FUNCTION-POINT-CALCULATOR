
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { HistoryTrendChart } from '@/components/comparison/history-trend-chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Info, Sigma, CheckCircle, XCircle } from 'lucide-react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { HistoryEntry, FPCalculationResult, CocomoCalculationResult } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateMAE, calculateRMSE, calculateR2Score } from '@/lib/calculations';

interface ChartDataPoint {
  timestamp: number;
  date: string; // Formatted date string for X-axis
  value: number;
}

interface AccuracyDataPoint {
  estimated: number;
  actual: number;
}

interface AccuracyMetrics {
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  count: number;
}

export default function ComparisonPage() {
  const [history] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const [afpTrendData, setAfpTrendData] = useState<ChartDataPoint[]>([]);
  const [cocomoEffortTrendData, setCocomoEffortTrendData] = useState<ChartDataPoint[]>([]);
  
  const [afpAccuracyData, setAfpAccuracyData] = useState<AccuracyDataPoint[]>([]);
  const [cocomoEffortAccuracyData, setCocomoEffortAccuracyData] = useState<AccuracyDataPoint[]>([]);

  const [afpAccuracyMetrics, setAfpAccuracyMetrics] = useState<AccuracyMetrics | null>(null);
  const [cocomoAccuracyMetrics, setCocomoAccuracyMetrics] = useState<AccuracyMetrics | null>(null);

  const [isClient, setIsClient] = useState(false);
  const MIN_DATA_POINTS_FOR_METRICS = 1; // Minimum data points to calculate/show MAE, RMSE, R2

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && history.length > 0) {
      // --- AFP Data Processing ---
      const fpEntries = history.filter((entry): entry is HistoryEntry & { type: 'FP'; data: FPCalculationResult } => entry.type === 'FP');
      
      const afpTrend = fpEntries
        .map(entry => ({
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp).toLocaleDateString(),
          value: entry.data.afp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setAfpTrendData(afpTrend);

      const afpAccuracy = fpEntries
        .filter(entry => typeof entry.data.afp === 'number' && typeof entry.data.actualAfp === 'number')
        .map(entry => ({
          estimated: entry.data.afp,
          actual: entry.data.actualAfp!,
        }));
      setAfpAccuracyData(afpAccuracy);

      if (afpAccuracy.length >= MIN_DATA_POINTS_FOR_METRICS) {
        setAfpAccuracyMetrics({
          mae: calculateMAE(afpAccuracy),
          rmse: calculateRMSE(afpAccuracy),
          r2: calculateR2Score(afpAccuracy),
          count: afpAccuracy.length,
        });
      } else {
        setAfpAccuracyMetrics(null);
      }

      // --- COCOMO Data Processing ---
      const cocomoEntries = history.filter((entry): entry is HistoryEntry & { type: 'COCOMO'; data: CocomoCalculationResult } => entry.type === 'COCOMO');

      const cocomoEffortTrend = cocomoEntries
        .map(entry => ({
          timestamp: entry.timestamp,
          date: new Date(entry.timestamp).toLocaleDateString(),
          value: entry.data.effort,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setCocomoEffortTrendData(cocomoEffortTrend);
      
      const cocomoEffortAccuracy = cocomoEntries
        .filter(entry => typeof entry.data.effort === 'number' && typeof entry.data.actualEffort === 'number')
        .map(entry => ({
          estimated: entry.data.effort,
          actual: entry.data.actualEffort!,
        }));
      setCocomoEffortAccuracyData(cocomoEffortAccuracy);

      if (cocomoEffortAccuracy.length >= MIN_DATA_POINTS_FOR_METRICS) {
        setCocomoAccuracyMetrics({
          mae: calculateMAE(cocomoEffortAccuracy),
          rmse: calculateRMSE(cocomoEffortAccuracy),
          r2: calculateR2Score(cocomoEffortAccuracy),
          count: cocomoEffortAccuracy.length,
        });
      } else {
        setCocomoAccuracyMetrics(null);
      }
    }
  }, [history, isClient]);

  if (!isClient) {
    return (
      <div className="flex h-full min-h-[calc(100vh-10rem)] w-full items-center justify-center">
        <p>Loading comparison data...</p>
      </div>
    );
  }

  const hasSufficientAfpTrendData = afpTrendData.length >= 2;
  const hasSufficientCocomoTrendData = cocomoEffortTrendData.length >= 2;

  const renderAccuracyTable = (metrics: AccuracyMetrics | null, modelName: string) => {
    if (!metrics) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground p-4">
          <Info className="mr-2 h-5 w-5" />
          Not enough data with actuals (minimum {MIN_DATA_POINTS_FOR_METRICS} required) to calculate accuracy for {modelName}.
          <br />Please add actual values in the History page.
        </div>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data Points with Actuals</TableCell>
            <TableCell className="text-right font-semibold">{metrics.count}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Mean Absolute Error (MAE)</TableCell>
            <TableCell className="text-right font-semibold">{metrics.mae ?? 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Root Mean Squared Error (RMSE)</TableCell>
            <TableCell className="text-right font-semibold">{metrics.rmse ?? 'N/A'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>R² Score</TableCell>
            <TableCell className="text-right font-semibold">{metrics.r2 ?? 'N/A'}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Estimation Trends & Accuracy Comparison"
        description="Visualize trends and assess the accuracy of your Function Point (AFP) and COCOMO II (Effort) estimations against actual project data."
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
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Adjusted Function Points (AFP) Trend</CardTitle>
                <CardDescription>Shows AFP values from your calculation history over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-2 sm:p-4">
                {hasSufficientAfpTrendData ? (
                  <HistoryTrendChart
                    data={afpTrendData}
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
                {hasSufficientCocomoTrendData ? (
                  <HistoryTrendChart
                    data={cocomoEffortTrendData}
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

          <PageHeader
            title="Estimation Accuracy Metrics"
            description="Compare estimated values against actual project outcomes using MAE, RMSE, and R² Score. Requires actual values to be entered in the History page."
            icon={Sigma}
          />
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>AFP Estimation Accuracy</CardTitle>
                  <CardDescription>
                    Accuracy metrics for Adjusted Function Points.
                    <span className="block text-xs mt-1">
                      (R² Score: Closer to 1 is better. MAE/RMSE: Lower is better.)
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAccuracyTable(afpAccuracyMetrics, "AFP")}
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>COCOMO II Effort Accuracy</CardTitle>
                  <CardDescription>
                    Accuracy metrics for COCOMO II Effort (Person-Months).
                     <span className="block text-xs mt-1">
                      (R² Score: Closer to 1 is better. MAE/RMSE: Lower is better.)
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAccuracyTable(cocomoAccuracyMetrics, "COCOMO II Effort")}
                </CardContent>
              </Card>
           </div>
        </>
      )}
    </div>
  );
}


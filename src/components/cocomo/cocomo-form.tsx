"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { COCOMO_SCALE_FACTORS, CocomoScaleFactorId } from '@/lib/constants';
import type { CocomoInputs, CocomoCalculationResult, HistoryEntry } from '@/lib/types';
import { calculateCocomoII } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const scaleFactorSchemaShape = COCOMO_SCALE_FACTORS.reduce((acc, factor) => {
  // Use the actual numerical value of the chosen level for the schema
  acc[factor.id] = z.coerce.number().default(factor.values[2]); // Default to Nominal
  return acc;
}, {} as Record<CocomoScaleFactorId, z.ZodNumber>);


const formSchema = z.object({
  ksloc: z.coerce.number().positive("KSLOC must be positive").default(10),
  ...scaleFactorSchemaShape,
});

type FormData = z.infer<typeof formSchema>;

export function CocomoForm() {
  const [result, setResult] = useState<CocomoCalculationResult | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ksloc: 10,
      ...COCOMO_SCALE_FACTORS.reduce((acc, factor) => ({ ...acc, [factor.id]: factor.values[2] }), {}), // Default to Nominal
    },
  });

  const onSubmit = (data: FormData) => {
    const cocomoInputs: CocomoInputs = {
      ksloc: data.ksloc,
      scaleFactors: COCOMO_SCALE_FACTORS.reduce((acc, factor) => {
        acc[factor.id] = data[factor.id as CocomoScaleFactorId];
        return acc;
      }, {} as Record<string, number>),
    };

    const calculatedResult = calculateCocomoII(cocomoInputs);
    setResult(calculatedResult);
    toast({ title: "Calculation Complete", description: `Estimated Effort: ${calculatedResult.effort} PM, Dev Time: ${calculatedResult.devTime} M` });
  };

  const handleSaveToHistory = () => {
    if (result) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        type: 'COCOMO',
        timestamp: Date.now(),
        data: result,
      };
      setHistory([newEntry, ...history]);
      toast({ title: "Saved to History", description: "COCOMO II estimation has been saved." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Project Size</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="ksloc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KSLOC (Kilo Source Lines of Code)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scale Factors</CardTitle>
              <CardDescription>Rate each scale factor from Very Low to Extra High.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {COCOMO_SCALE_FACTORS.map(factor => (
                 <FormField
                  key={factor.id}
                  control={form.control}
                  name={factor.id as CocomoScaleFactorId}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{factor.name}</FormLabel>
                      <FormControl>
                        <Select onValueChange={value => formField.onChange(parseFloat(value))} defaultValue={String(formField.value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${factor.name} rating`} />
                          </SelectTrigger>
                          <SelectContent>
                            {factor.levels.map((level, index) => (
                              <SelectItem key={level} value={String(factor.values[index])}>
                                {level} ({factor.values[index].toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit">Calculate COCOMO II</Button>
        </div>
      </form>

      {result && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle>Estimation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Effort (Person-Months)</TableCell>
                  <TableCell className="text-right font-semibold">{result.effort}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Development Time (Months)</TableCell>
                  <TableCell className="text-right font-semibold">{result.devTime}</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="text-primary">Productivity (SLOC/PM)</TableCell>
                  <TableCell className="text-right font-bold text-primary text-lg">
                    {result.effort > 0 ? ((result.inputs.ksloc * 1000) / result.effort).toFixed(2) : 'N/A'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-primary">Average Staffing</TableCell>
                  <TableCell className="text-right font-bold text-primary text-lg">
                    {result.devTime > 0 ? (result.effort / result.devTime).toFixed(2) : 'N/A'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter>
            <Button onClick={handleSaveToHistory} variant="outline">Save to History</Button>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}

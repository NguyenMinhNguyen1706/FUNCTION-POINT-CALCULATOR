
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GSC_FACTORS, GSCFactorId } from '@/lib/constants';
import type { FPInputs, GSCInputs, FPCalculationResult, HistoryEntry } from '@/lib/types';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';
import { calculateFunctionPoints } from '@/lib/calculations';
import { FpChart } from './fp-chart';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormDescription as UiFormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; 
import { Info } from 'lucide-react';

const fpInputSchema = z.object({
  ei: z.coerce.number().min(0, "Must be non-negative").default(0),
  eo: z.coerce.number().min(0, "Must be non-negative").default(0),
  eq: z.coerce.number().min(0, "Must be non-negative").default(0),
  ilf: z.coerce.number().min(0, "Must be non-negative").default(0),
  eif: z.coerce.number().min(0, "Must be non-negative").default(0),
});

const gscSchemaShape = GSC_FACTORS.reduce((acc, factor) => {
  acc[factor.id] = z.coerce.number().min(0).max(5).default(0);
  return acc;
}, {} as Record<GSCFactorId, z.ZodNumber>);

const formSchema = fpInputSchema.extend(gscSchemaShape);

type FormData = z.infer<typeof formSchema>;

interface FpCalculatorFormProps {
  aiSuggestions?: AnalyzeDocumentOutput['potentialFunctionPoints'] | null;
}

export function FpCalculatorForm({ aiSuggestions }: FpCalculatorFormProps) {
  const [result, setResult] = useState<FPCalculationResult | null>(null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ei: 0, eo: 0, eq: 0, ilf: 0, eif: 0,
      ...GSC_FACTORS.reduce((acc, factor) => ({ ...acc, [factor.id]: 0 }), {}),
    },
  });

  const fpFields: { name: keyof FPInputs; label: string; aiKey: keyof NonNullable<FpCalculatorFormProps['aiSuggestions']> }[] = [
    { name: 'ei', label: 'External Inputs (EI)', aiKey: 'EI' },
    { name: 'eo', label: 'External Outputs (EO)', aiKey: 'EO' },
    { name: 'eq', label: 'External Inquiries (EQ)', aiKey: 'EQ' },
    { name: 'ilf', label: 'Internal Logical Files (ILF)', aiKey: 'ILF' },
    { name: 'eif', label: 'External Interface Files (EIF)', aiKey: 'EIF' },
  ];
  
  useEffect(() => {
    if (aiSuggestions) {
      setResult(null); // Reset result when new AI suggestions come in
      fpFields.forEach(fieldData => {
        const suggestion = aiSuggestions[fieldData.aiKey];
        if (suggestion && suggestion.count !== undefined && suggestion.count !== null) {
          form.setValue(fieldData.name, suggestion.count, { shouldValidate: true });
        }
      });
    }
  }, [aiSuggestions, form, fpFields]);


  const onSubmit = (data: FormData) => {
    const fpInputs: FPInputs = {
      ei: data.ei,
      eo: data.eo,
      eq: data.eq,
      ilf: data.ilf,
      eif: data.eif,
    };
    const gscInputs: GSCInputs = GSC_FACTORS.reduce((acc, factor) => {
      acc[factor.id] = data[factor.id as GSCFactorId];
      return acc;
    }, {} as GSCInputs);

    const calculatedResult = calculateFunctionPoints(fpInputs, gscInputs);
    setResult(calculatedResult);
    toast({ title: "Calculation Complete", description: `Adjusted Function Points (AFP): ${calculatedResult.afp}` });
  };

  const handleSaveToHistory = () => {
    if (result) {
      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        type: 'FP',
        timestamp: Date.now(),
        data: result,
      };
      setHistory([newEntry, ...history]);
      toast({ title: "Saved to History", description: "FP calculation has been saved." });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Function Point Components</CardTitle>
              <CardDescription>Enter the counts for each type. These are typically weighted counts (Low, Avg, High). AI suggestions may pre-fill these based on document analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fpFields.map(fieldData => {
                return (
                  <FormField
                    key={fieldData.name}
                    control={form.control}
                    name={fieldData.name}
                    render={({ field: formHookField }) => (
                      <FormItem>
                        <FormLabel>{fieldData.label}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...formHookField} />
                        </FormControl>
                        {/* The UiFormDescription block that displayed AI suggestions was here and has been removed */}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>General System Characteristics (GSCs)</CardTitle>
              <CardDescription>Rate each characteristic from 0 (Not Present) to 5 (Strongly Present).</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-4">
                {GSC_FACTORS.map(factor => (
                  <FormField
                    key={factor.id}
                    control={form.control}
                    name={factor.id as GSCFactorId}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{factor.name}</FormLabel>
                        <FormControl>
                          <Select onValueChange={value => formField.onChange(parseInt(value))} defaultValue={String(formField.value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating (0-5)" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3, 4, 5].map(val => (
                                <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <UiFormDescription className="text-xs">{factor.description}</UiFormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="submit">Calculate AFP</Button>
        </div>
      </form>

      {result && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Unadjusted Function Points (UFP)</TableCell>
                      <TableCell className="text-right font-semibold">{result.ufp}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Value Adjustment Factor (VAF)</TableCell>
                      <TableCell className="text-right font-semibold">{result.vaf}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-primary">Adjusted Function Points (AFP)</TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">{result.afp}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="h-[300px]">
                <FpChart data={result.inputs} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveToHistory} variant="outline">Save to History</Button>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}

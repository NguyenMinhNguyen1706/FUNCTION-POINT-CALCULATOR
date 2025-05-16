
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { GSC_FACTORS, GSCFactorId, SIMPLE_WEIGHTS } from '@/lib/constants';
import type { FPInputs, GSCInputs, FPCalculationResult, HistoryEntry } from '@/lib/types';
import type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';
import { calculateFunctionPoints } from '@/lib/calculations';
import { FpChart } from './fp-chart';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormDescription as UiFormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; 
import { HelpCircle } from 'lucide-react';

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
  aiFpSuggestions?: AnalyzeDocumentOutput['potentialFunctionPoints'] | null;
  aiGscSuggestions?: AnalyzeDocumentOutput['gscRatings'] | null;
}

export function FpCalculatorForm({ aiFpSuggestions, aiGscSuggestions }: FpCalculatorFormProps) {
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

  const fpFields: { name: keyof FPInputs; label: string; aiKey: keyof NonNullable<FpCalculatorFormProps['aiFpSuggestions']> }[] = [
    { name: 'ei', label: 'External Inputs (EI)', aiKey: 'EI' },
    { name: 'eo', label: 'External Outputs (EO)', aiKey: 'EO' },
    { name: 'eq', label: 'External Inquiries (EQ)', aiKey: 'EQ' },
    { name: 'ilf', label: 'Internal Logical Files (ILF)', aiKey: 'ILF' },
    { name: 'eif', label: 'External Interface Files (EIF)', aiKey: 'EIF' },
  ];
  
  useEffect(() => {
    if (aiFpSuggestions) {
      setResult(null); // Reset result when new AI suggestions come in
      fpFields.forEach(fieldData => {
        const suggestion = aiFpSuggestions[fieldData.aiKey];
        if (suggestion && suggestion.count !== undefined && suggestion.count !== null) {
          form.setValue(fieldData.name, suggestion.count, { shouldValidate: true });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiFpSuggestions, form]);

  useEffect(() => {
    if (aiGscSuggestions) {
      setResult(null);
      GSC_FACTORS.forEach(factor => {
        const suggestedRating = aiGscSuggestions[factor.id as GSCFactorId];
        if (suggestedRating !== undefined && suggestedRating !== null) {
          form.setValue(factor.id as GSCFactorId, suggestedRating, { shouldValidate: true });
        }
      });
    }
  }, [aiGscSuggestions, form]);


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
              <div className="flex items-center justify-between">
                <CardTitle>Function Point Components</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
                      <HelpCircle className="h-5 w-5" />
                      <span className="sr-only">How FP is Calculated</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Function Point (FP) Calculation Overview</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <Image 
                        src="https://placehold.co/600x400.png" 
                        alt="Function Point Calculation Steps" 
                        width={600} 
                        height={400} 
                        className="rounded-md object-contain"
                        data-ai-hint="function point calculation" 
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        This image outlines the general steps for Function Point calculation.
                      </p>
                    </div>
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="mt-2">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>Enter the counts for each type. AI suggestions may pre-fill these based on document analysis.</CardDescription>
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
              <CardTitle>Value Adjustment Factors (VAF)</CardTitle>
              <CardDescription>Rate each characteristic from 0 (Not Present) to 5 (Strongly Present). AI suggestions may pre-fill these.</CardDescription>
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
                          <Select onValueChange={value => formField.onChange(parseInt(value))} value={String(formField.value)} defaultValue={String(formField.value)}>
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
          <Button type="submit">Calculate FP</Button>
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


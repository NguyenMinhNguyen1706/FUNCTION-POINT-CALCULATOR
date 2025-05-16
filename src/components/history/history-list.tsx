
"use client";

import { useState, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { HistoryEntry, FPCalculationResult, CocomoCalculationResult, FileAnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Trash2, FunctionSquare, Calculator, FileText, History as HistoryIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const IconMap = {
  FP: FunctionSquare,
  COCOMO: Calculator,
  ANALYSIS: FileText,
};

export function HistoryList() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClearHistory = () => {
    setHistory([]);
    toast({ title: "History Cleared", description: "All saved entries have been removed." });
  };
  
  const handleDeleteEntry = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
    toast({ title: "Entry Deleted", description: "The selected entry has been removed." });
  };


  if (!isClient) {
    return <p>Loading history...</p>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No history yet.</p>
        <p className="text-sm text-muted-foreground">Perform some calculations or analyses to see them here.</p>
      </div>
    );
  }

  const renderFPDetails = (data: FPCalculationResult) => (
    <div className="space-y-2 text-sm">
      <p><strong>UFP:</strong> {data.ufp}</p>
      <p><strong>VAF:</strong> {data.vaf}</p>
      <p className="font-semibold text-primary"><strong>AFP:</strong> {data.afp}</p>
      <h4 className="font-medium mt-2">Inputs:</h4>
      <ul className="list-disc list-inside pl-2">
        <li>EI: {data.inputs.ei}, EO: {data.inputs.eo}, EQ: {data.inputs.eq}, ILF: {data.inputs.ilf}, EIF: {data.inputs.eif}</li>
      </ul>
      {/* GSC details can be added if needed */}
    </div>
  );

  const renderCocomoDetails = (data: CocomoCalculationResult) => (
    <div className="space-y-2 text-sm">
      <p><strong>KSLOC:</strong> {data.inputs.ksloc}</p>
      <p><strong>Effort (PM):</strong> {data.effort}</p>
      <p className="font-semibold text-primary"><strong>Development Time (Months):</strong> {data.devTime}</p>
      {/* Scale factor details can be added if needed */}
    </div>
  );

  const renderAnalysisDetails = (data: { fileName: string; result: FileAnalysisResult }) => (
     <div className="space-y-2 text-sm">
      <p><strong>File Name:</strong> {data.fileName}</p>
      <h4 className="font-medium mt-2">Potential Function Points:</h4>
      <ul className="list-disc list-inside pl-2">
        {Object.entries(data.result.potentialFunctionPoints).map(([key, value]) => (
          <li key={key}><strong>{key}:</strong> {String(value).substring(0,150)}{String(value).length > 150 ? '...' : ''}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={history.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear All History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all your saved history entries.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <ScrollArea className="h-[500px] pr-3">
        <Accordion type="multiple" className="w-full">
          {history.map(entry => {
            const ItemIcon = IconMap[entry.type];
            return (
              <AccordionItem value={entry.id} key={entry.id} className="border-b">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                       <ItemIcon className="h-5 w-5 text-primary" />
                       <span className="font-medium">
                        {entry.type === 'ANALYSIS' ? `Analysis: ${entry.data.fileName}` : `${entry.type} Calculation`}
                       </span>
                       <span className="text-xs text-muted-foreground">
                         {format(new Date(entry.timestamp), "PPp")}
                       </span>
                    </div>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/30 rounded-md">
                  {entry.type === 'FP' && renderFPDetails(entry.data)}
                  {entry.type === 'COCOMO' && renderCocomoDetails(entry.data)}
                  {entry.type === 'ANALYSIS' && renderAnalysisDetails(entry.data)}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

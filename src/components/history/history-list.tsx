
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { HistoryEntry, FPCalculationResult, CocomoCalculationResult, FileAnalysisResult, AnalyzeDocumentOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Trash2, FunctionSquare, Calculator, FileText, History as HistoryIconLucide, Save, FileDown } from 'lucide-react';
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
import { Separator } from '../ui/separator';

const IconMap = {
  FP: FunctionSquare,
  COCOMO: Calculator,
  ANALYSIS: FileText,
};

interface ActualsInputState {
  [entryId: string]: {
    actualAfp?: string;
    actualEffort?: string;
    actualDevTime?: string;
  };
}

export function HistoryList() {
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('calculationHistory', []);
  const [isClient, setIsClient] = useState(false);
  const [actualsInput, setActualsInput] = useState<ActualsInputState>({});
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const initialActuals: ActualsInputState = {};
    history.forEach(entry => {
      if (entry.type === 'FP' && entry.data.actualAfp !== undefined) {
        initialActuals[entry.id] = { ...initialActuals[entry.id], actualAfp: String(entry.data.actualAfp) };
      } else if (entry.type === 'COCOMO') {
        if (entry.data.actualEffort !== undefined) {
          initialActuals[entry.id] = { ...initialActuals[entry.id], actualEffort: String(entry.data.actualEffort) };
        }
        if (entry.data.actualDevTime !== undefined) {
          initialActuals[entry.id] = { ...initialActuals[entry.id], actualDevTime: String(entry.data.actualDevTime) };
        }
      }
    });
    setActualsInput(initialActuals);
  }, [history]);

  const handleActualInputChange = (entryId: string, field: keyof ActualsInputState[string], value: string) => {
    setActualsInput(prev => ({
      ...prev,
      [entryId]: {
        ...prev[entryId],
        [field]: value,
      }
    }));
  };

  const handleSaveActuals = (entryId: string, type: 'FP' | 'COCOMO') => {
    const entryActuals = actualsInput[entryId];
    if (!entryActuals) return;

    setHistory(prevHistory =>
      prevHistory.map(entry => {
        if (entry.id === entryId) {
          if (type === 'FP' && entry.type === 'FP') {
            const actualAfp = entryActuals.actualAfp !== undefined && entryActuals.actualAfp !== '' ? parseFloat(entryActuals.actualAfp) : undefined;
            return { ...entry, data: { ...entry.data, actualAfp: isNaN(actualAfp!) ? undefined : actualAfp } };
          } else if (type === 'COCOMO' && entry.type === 'COCOMO') {
            const actualEffort = entryActuals.actualEffort !== undefined && entryActuals.actualEffort !== '' ? parseFloat(entryActuals.actualEffort) : undefined;
            const actualDevTime = entryActuals.actualDevTime !== undefined && entryActuals.actualDevTime !== '' ? parseFloat(entryActuals.actualDevTime) : undefined;
            return {
              ...entry,
              data: {
                ...entry.data,
                actualEffort: isNaN(actualEffort!) ? undefined : actualEffort,
                actualDevTime: isNaN(actualDevTime!) ? undefined : actualDevTime,
              }
            };
          }
        }
        return entry;
      })
    );
    toast({ title: "Actuals Saved", description: `Actual values for entry ${entryId} have been updated.` });
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActualsInput({});
    toast({ title: "History Cleared", description: "All saved entries have been removed." });
  };

  const handleDeleteEntry = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
    setActualsInput(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    toast({ title: "Entry Deleted", description: "The selected entry has been removed." });
  };

  const escapeCsvCell = (cellData: any): string => {
    if (cellData === null || cellData === undefined) {
      return '';
    }
    const stringData = String(cellData);
    // If the string contains a comma, double quote, or newline, enclose it in double quotes
    // and escape existing double quotes by doubling them.
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };
  
  const handleExportToCSV = () => {
    if (history.length === 0) {
      toast({ title: "No History", description: "There is no data to export.", variant: "destructive" });
      return;
    }

    const headers = [
      'ID', 'Timestamp', 'Type', 'File Name', 
      'KSLOC (COCOMO)', 'EI (FP)', 'EO (FP)', 'EQ (FP)', 'ILF (FP)', 'EIF (FP)',
      'UFP (FP)', 'VAF (FP)', 'AFP Estimated (FP)', 'AFP Actual (FP)',
      'Effort Estimated PM (COCOMO)', 'Dev Time Estimated M (COCOMO)',
      'Effort Actual PM (COCOMO)', 'Dev Time Actual M (COCOMO)',
      'Analysis EI Suggestion', 'Analysis EO Suggestion', 'Analysis EQ Suggestion', 
      'Analysis ILF Suggestion', 'Analysis EIF Suggestion'
    ];

    const csvRows = [headers.join(',')];

    history.forEach(entry => {
      const row: (string | number | undefined)[] = [
        entry.id,
        format(new Date(entry.timestamp), "yyyy-MM-dd HH:mm:ss"),
        entry.type,
      ];

      if (entry.type === 'FP') {
        const fpData = entry.data as FPCalculationResult;
        row.push(
          '', // File Name
          '', // KSLOC
          fpData.inputs.ei, fpData.inputs.eo, fpData.inputs.eq, fpData.inputs.ilf, fpData.inputs.eif,
          fpData.ufp, fpData.vaf, fpData.afp, fpData.actualAfp,
          '', '', '', '', // COCOMO fields
          '', '', '', '', '' // Analysis fields
        );
      } else if (entry.type === 'COCOMO') {
        const cocomoData = entry.data as CocomoCalculationResult;
        row.push(
          '', // File Name
          cocomoData.inputs.ksloc,
          '', '', '', '', '', // FP input fields
          '', '', '', '', // FP result fields
          cocomoData.effort, cocomoData.devTime,
          cocomoData.actualEffort, cocomoData.actualDevTime,
          '', '', '', '', '' // Analysis fields
        );
      } else if (entry.type === 'ANALYSIS') {
        const analysisData = entry.data as { fileName: string; result: AnalyzeDocumentOutput };
        row.push(
          analysisData.fileName,
          '', '', '', '', '', '', // KSLOC & FP input fields
          '', '', '', '', // FP result fields
          '', '', '', '', // COCOMO fields
          analysisData.result.potentialFunctionPoints.EI,
          analysisData.result.potentialFunctionPoints.EO,
          analysisData.result.potentialFunctionPoints.EQ,
          analysisData.result.potentialFunctionPoints.ILF,
          analysisData.result.potentialFunctionPoints.EIF
        );
      }
      csvRows.push(row.map(escapeCsvCell).join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fp_cocomo_history_${format(new Date(), "yyyyMMddHHmmss")}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Export Successful", description: "History has been exported to CSV." });
    } else {
      toast({ title: "Export Failed", description: "Your browser does not support this feature.", variant: "destructive" });
    }
  };


  if (!isClient) {
    return <p>Loading history...</p>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <HistoryIconLucide className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No history yet.</p>
        <p className="text-sm text-muted-foreground">Perform some calculations or analyses to see them here.</p>
      </div>
    );
  }

  const renderFPDetails = (entry: HistoryEntry & { type: 'FP'; data: FPCalculationResult }) => (
    <div className="space-y-2 text-sm">
      <p><strong>UFP:</strong> {entry.data.ufp}</p>
      <p><strong>VAF:</strong> {entry.data.vaf}</p>
      <p className="font-semibold text-primary"><strong>AFP (Estimated):</strong> {entry.data.afp}</p>
      {entry.data.actualAfp !== undefined && <p className="font-semibold text-green-600"><strong>AFP (Actual):</strong> {entry.data.actualAfp}</p>}
      <h4 className="font-medium mt-2">Inputs:</h4>
      <ul className="list-disc list-inside pl-2">
        <li>EI: {entry.data.inputs.ei}, EO: {entry.data.inputs.eo}, EQ: {entry.data.inputs.eq}, ILF: {entry.data.inputs.ilf}, EIF: {entry.data.inputs.eif}</li>
      </ul>
      <Separator className="my-3" />
      <div className="space-y-2">
        <Label htmlFor={`actualAfp-${entry.id}`}>Actual AFP:</Label>
        <Input
          type="number"
          id={`actualAfp-${entry.id}`}
          placeholder="Enter actual AFP"
          value={actualsInput[entry.id]?.actualAfp ?? ''}
          onChange={(e) => handleActualInputChange(entry.id, 'actualAfp', e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <Button size="sm" variant="outline" onClick={() => handleSaveActuals(entry.id, 'FP')} className="mt-2">
        <Save className="mr-2 h-4 w-4" /> Save Actual AFP
      </Button>
    </div>
  );

  const renderCocomoDetails = (entry: HistoryEntry & { type: 'COCOMO'; data: CocomoCalculationResult }) => (
    <div className="space-y-2 text-sm">
      <p><strong>KSLOC:</strong> {entry.data.inputs.ksloc}</p>
      <p><strong>Effort (PM - Estimated):</strong> {entry.data.effort}</p>
      {entry.data.actualEffort !== undefined && <p className="text-green-600"><strong>Effort (PM - Actual):</strong> {entry.data.actualEffort}</p>}
      <p className="font-semibold text-primary"><strong>Development Time (Months - Estimated):</strong> {entry.data.devTime}</p>
      {entry.data.actualDevTime !== undefined && <p className="font-semibold text-green-600"><strong>Development Time (Months - Actual):</strong> {entry.data.actualDevTime}</p>}
      <Separator className="my-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`actualEffort-${entry.id}`}>Actual Effort (PM):</Label>
          <Input
            type="number"
            id={`actualEffort-${entry.id}`}
            placeholder="Enter actual effort"
            value={actualsInput[entry.id]?.actualEffort ?? ''}
            onChange={(e) => handleActualInputChange(entry.id, 'actualEffort', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`actualDevTime-${entry.id}`}>Actual Dev Time (Months):</Label>
          <Input
            type="number"
            id={`actualDevTime-${entry.id}`}
            placeholder="Enter actual dev time"
            value={actualsInput[entry.id]?.actualDevTime ?? ''}
            onChange={(e) => handleActualInputChange(entry.id, 'actualDevTime', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => handleSaveActuals(entry.id, 'COCOMO')} className="mt-2">
        <Save className="mr-2 h-4 w-4" /> Save Actuals
      </Button>
    </div>
  );

  const renderAnalysisDetails = (data: { fileName: string; result: AnalyzeDocumentOutput }) => (
     <div className="space-y-2 text-sm">
      <p><strong>File Name:</strong> {data.fileName}</p>
      <h4 className="font-medium mt-2">Potential Function Points:</h4>
      <ScrollArea className="h-[150px] p-2 border rounded-md bg-background">
        <ul className="list-disc list-inside pl-2 text-xs">
          {Object.entries(data.result.potentialFunctionPoints).map(([key, value]) => (
            <li key={key}><strong>{key}:</strong> {value || "Not identified"}</li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={handleExportToCSV} disabled={history.length === 0}>
          <FileDown className="mr-2 h-4 w-4" /> Export to CSV
        </Button>
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
      <ScrollArea className="h-[calc(100vh-20rem)] pr-3"> {/* Adjusted height slightly */}
        <Accordion type="multiple" className="w-full">
          {history.sort((a,b) => b.timestamp - a.timestamp).map(entry => { 
            const ItemIcon = IconMap[entry.type];
            return (
              <AccordionItem value={entry.id} key={entry.id} className="border-b">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                       <ItemIcon className="h-5 w-5 text-primary" />
                       <span className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                        {entry.type === 'ANALYSIS' ? `Analysis: ${entry.data.fileName}` : `${entry.type} Calculation`}
                       </span>
                       <span className="text-xs text-muted-foreground whitespace-nowrap">
                         {format(new Date(entry.timestamp), "PPp")}
                       </span>
                    </div>
                     <Button
                        asChild // Important: Allows AlertDialogTrigger to behave like a button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); }} 
                        aria-label="Delete entry"
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <div className="p-1.5 inline-block cursor-pointer rounded-md" role="button" tabIndex={0} 
                             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (e.currentTarget as HTMLDivElement).click(); }} >
                                <Trash2 className="h-4 w-4" />
                             </div>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this history entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-muted/50 rounded-md">
                  {entry.type === 'FP' && renderFPDetails(entry as HistoryEntry & { type: 'FP'; data: FPCalculationResult })}
                  {entry.type === 'COCOMO' && renderCocomoDetails(entry as HistoryEntry & { type: 'COCOMO'; data: CocomoCalculationResult })}
                  {entry.type === 'ANALYSIS' && renderAnalysisDetails(entry.data as { fileName: string; result: AnalyzeDocumentOutput })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

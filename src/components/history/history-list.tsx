
"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { HistoryEntry, FPCalculationResult, CocomoCalculationResult, FileAnalysisResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Trash2, FunctionSquare, Calculator, FileText, History as HistoryIconLucide, Save } from 'lucide-react';
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
    // Initialize actualsInput state from history
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
  }, [history]); // Rerun if history changes to re-initialize

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
      <ScrollArea className="h-[calc(100vh-18rem)] pr-3"> {/* Adjusted height */}
        <Accordion type="multiple" className="w-full">
          {history.sort((a,b) => b.timestamp - a.timestamp).map(entry => { // Sort by newest first
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
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); }} // Stop propagation to prevent accordion toggle
                        aria-label="Delete entry"
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <div className="p-1.5 inline-block cursor-pointer"> {/* Ensure div takes button style for hover */}
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
                  {entry.type === 'ANALYSIS' && renderAnalysisDetails(entry.data as { fileName: string; result: FileAnalysisResult })}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}


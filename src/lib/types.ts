

export interface FPInputs {
  ei: number;
  eo: number;
  eq: number;
  ilf: number;
  eif: number;
}

export interface GSCInputs {
  [key: string]: number; // GSC factor name to rating (0-5)
}

export interface FPCalculationResult {
  ufp: number;
  vaf: number;
  afp: number;
  inputs: FPInputs;
  gsc: GSCInputs;
  actualAfp?: number; // Added for storing actual AFP
}

export interface CocomoInputs {
  ksloc: number;
  scaleFactors: {
    [key:string]: number; // Scale factor name to multiplier value
  };
  costDrivers?: { // Optional: for more detailed COCOMO, not implemented in this version
    [key: string]: number;
  };
}

export interface CocomoCalculationResult {
  effort: number; // Person-Months
  devTime: number; // Months
  inputs: CocomoInputs;
  actualEffort?: number; // Added for storing actual effort
  actualDevTime?: number; // Added for storing actual development time
}

// Re-exporting AnalyzeDocumentOutput from the AI flow for type consistency in HistoryEntry
export type { AnalyzeDocumentOutput } from '@/ai/flows/analyze-document-for-function-points';


export type HistoryEntry = (
  {
    id: string;
    type: 'FP';
    timestamp: number;
    data: FPCalculationResult;
  } | {
    id: string;
    type: 'COCOMO';
    timestamp: number;
    data: CocomoCalculationResult;
  } | {
    id: string;
    type: 'ANALYSIS';
    timestamp: number;
    data: {
      fileName: string;
      result: AnalyzeDocumentOutput; // Using the specific type from AI flow
    }
  }
);

// This FileAnalysisResult type might be redundant if AnalyzeDocumentOutput is used directly
// Kept for now if there are other places it might be used, but ideally standardize on AnalyzeDocumentOutput
export interface FileAnalysisResult {
  potentialFunctionPoints: {
    EI: string;
    EO: string;
    EQ: string;
    ILF: string;
    EIF: string;
  };
}

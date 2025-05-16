
import type { FPInputs, GSCInputs, FPCalculationResult, CocomoInputs, CocomoCalculationResult } from './types';
import { GSC_FACTORS, COCOMO_A, COCOMO_BASE_EXPONENT } from './constants';

// This is a simplified FP calculation that assumes weights are pre-determined
// or that the number of items IS the weighted value.
// A full FP calc would involve DETs/FTRs to determine complexity (Low, Avg, High) for each EI, EO etc.
// For this app, we assume the input numbers are the simple counts, and apply an "average" complexity weight.
// Or, more simply, the user provides the already weighted values.
// Let's assume the inputs are simple counts and we apply fixed "average" weights for simplicity.
const SIMPLE_WEIGHTS = {
  ei: 4, // Average EI
  eo: 5, // Average EO
  eq: 4, // Average EQ
  ilf: 10, // Average ILF
  eif: 7,  // Average EIF
};

export function calculateFunctionPoints(fpInputs: FPInputs, gscInputs: GSCInputs): FPCalculationResult {
  // Calculate Unadjusted Function Points (UFP)
  // For this simplified version, we'll treat the inputs as direct counts
  // and multiply by a fixed "average" complexity weight.
  // A more detailed version would ask for Low/Avg/High counts for each type.
  const ufp =
    fpInputs.ei * SIMPLE_WEIGHTS.ei +
    fpInputs.eo * SIMPLE_WEIGHTS.eo +
    fpInputs.eq * SIMPLE_WEIGHTS.eq +
    fpInputs.ilf * SIMPLE_WEIGHTS.ilf +
    fpInputs.eif * SIMPLE_WEIGHTS.eif;

  // Calculate Total Degree of Influence (TDI) from GSCs
  let tdi = 0;
  GSC_FACTORS.forEach(factor => {
    tdi += gscInputs[factor.id] || 0;
  });

  // Calculate Value Adjustment Factor (VAF)
  const vaf = 0.65 + 0.01 * tdi;

  // Calculate Adjusted Function Points (AFP)
  const afp = ufp * vaf;

  return {
    ufp: parseFloat(ufp.toFixed(2)),
    vaf: parseFloat(vaf.toFixed(2)),
    afp: parseFloat(afp.toFixed(2)),
    inputs: fpInputs,
    gsc: gscInputs,
  };
}

export function calculateCocomoII(inputs: CocomoInputs): CocomoCalculationResult {
  const { ksloc, scaleFactors } = inputs;

  // Calculate exponent B
  // B = Base + 0.01 * Sum_of_Scale_Factor_Exponents
  // The 'values' in COCOMO_SCALE_FACTORS are the exponents for each rating (VL, L, N, H, VH, EH)
  // The input `scaleFactors` should map factor ID to its chosen rating's exponent value.
  let sumOfSFExponents = 0;
  for (const factorId in scaleFactors) {
    sumOfSFExponents += scaleFactors[factorId];
  }
  
  const B = COCOMO_BASE_EXPONENT + 0.01 * sumOfSFExponents;

  // Effort Adjustment Factor (EAF)
  // In full COCOMO II, EAF is the product of 17 cost drivers.
  // For this simplified version, we are not using cost drivers, so EAF = 1.
  // If scaleFactors were meant to be cost drivers, this logic would change.
  // Here, scaleFactors are used for the exponent B.
  const EAF = 1.0; 

  // Calculate Effort (Person-Months)
  // Effort = A * (KSLOC)^B * EAF
  const effort = COCOMO_A * Math.pow(ksloc, B) * EAF;

  // Calculate Development Time (Months)
  // TDEV = C * (Effort)^D
  // C and D depend on the exponent B and Effort value.
  // Simplified: TDEV = 2.5 * (Effort)^0.3something
  // Using standard Post-Architecture TDEV constants for nominal values:
  const C = 3.67; // This constant can vary, using a common one.
  // The exponent for TDEV calculation (often referred to as F) is derived from B:
  // F = 0.28 + 0.2 * (B - 0.91)
  const F = 0.28 + 0.2 * (B - COCOMO_BASE_EXPONENT);
  const devTime = C * Math.pow(effort, F);

  return {
    effort: parseFloat(effort.toFixed(2)),
    devTime: parseFloat(devTime.toFixed(2)),
    inputs,
  };
}

interface AccuracyDataPoint {
  estimated: number;
  actual: number;
}

export function calculateMAE(data: AccuracyDataPoint[]): number | null {
  if (data.length === 0) return null;
  const sumAbsoluteErrors = data.reduce((sum, point) => sum + Math.abs(point.actual - point.estimated), 0);
  return parseFloat((sumAbsoluteErrors / data.length).toFixed(2));
}

export function calculateRMSE(data: AccuracyDataPoint[]): number | null {
  if (data.length === 0) return null;
  const sumSquaredErrors = data.reduce((sum, point) => sum + Math.pow(point.actual - point.estimated, 2), 0);
  return parseFloat(Math.sqrt(sumSquaredErrors / data.length).toFixed(2));
}

export function calculateR2Score(data: AccuracyDataPoint[]): number | null {
  if (data.length < 2) return null; // R² is typically not meaningful for less than 2 points

  const n = data.length;
  const sumActual = data.reduce((sum, point) => sum + point.actual, 0);
  const meanActual = sumActual / n;

  const ssRes = data.reduce((sum, point) => sum + Math.pow(point.actual - point.estimated, 2), 0);
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.actual - meanActual, 2), 0);

  if (ssTot === 0) {
    // If all actual values are the same, R² is undefined.
    // If predicted also matches actual perfectly (ssRes = 0), R² could be 1.
    // Otherwise, it implies a poor fit if ssRes > 0.
    // For simplicity, return null or handle as per specific requirements.
    // Here, if ssRes is also 0, it's a perfect fit.
    return ssRes === 0 ? 1.00 : null; 
  }

  const r2 = 1 - (ssRes / ssTot);
  return parseFloat(r2.toFixed(2));
}


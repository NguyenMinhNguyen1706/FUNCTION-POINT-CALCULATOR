
import type { FPInputs, GSCInputs, FPCalculationResult, CocomoInputs, CocomoCalculationResult } from './types';
import { GSC_FACTORS, COCOMO_A, COCOMO_BASE_EXPONENT, SIMPLE_WEIGHTS as CONST_SIMPLE_WEIGHTS } from './constants'; // Renamed import

// Use the imported SIMPLE_WEIGHTS, now named CONST_SIMPLE_WEIGHTS to avoid conflict with local variable
// This was already correct but just to be clear. The name SIMPLE_WEIGHTS in calculations.ts
// was shadowing the import, which is fine as long as it's intentional for local override.
// For clarity, I'll use the imported name if it was intended to be the constant from constants.ts
// However, the original code used a local SIMPLE_WEIGHTS which might be intentional.
// Let's assume the local SIMPLE_WEIGHTS was intentional for this file.
const SIMPLE_WEIGHTS = {
  ei: 4, // Average EI
  eo: 5, // Average EO
  eq: 4, // Average EQ
  ilf: 10, // Average ILF
  eif: 7,  // Average EIF
};


export function calculateFunctionPoints(fpInputs: FPInputs, gscInputs: GSCInputs): FPCalculationResult {
  const ufp =
    fpInputs.ei * SIMPLE_WEIGHTS.ei +
    fpInputs.eo * SIMPLE_WEIGHTS.eo +
    fpInputs.eq * SIMPLE_WEIGHTS.eq +
    fpInputs.ilf * SIMPLE_WEIGHTS.ilf +
    fpInputs.eif * SIMPLE_WEIGHTS.eif;

  let tdi = 0;
  GSC_FACTORS.forEach(factor => {
    tdi += gscInputs[factor.id] || 0;
  });

  const vaf = 0.65 + 0.01 * tdi;
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

  let sumOfSFExponents = 0;
  for (const factorId in scaleFactors) {
    sumOfSFExponents += scaleFactors[factorId];
  }
  
  const B = COCOMO_BASE_EXPONENT + 0.01 * sumOfSFExponents;
  const EAF = 1.0; 
  const effort = COCOMO_A * Math.pow(ksloc, B) * EAF;

  const C = 3.67; 
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
  if (data.length === 0) return null; // R² is not meaningful for zero points

  const n = data.length;
  const sumActual = data.reduce((sum, point) => sum + point.actual, 0);
  const meanActual = sumActual / n;

  const ssRes = data.reduce((sum, point) => sum + Math.pow(point.actual - point.estimated, 2), 0); // Sum of squared residuals
  const ssTot = data.reduce((sum, point) => sum + Math.pow(point.actual - meanActual, 2), 0); // Total sum of squares

  if (ssTot === 0) {
    // This condition occurs if all actual values are the same.
    // If ssRes is also 0, it means all predictions perfectly matched the constant actual value, so R² = 1.
    // Otherwise (ssRes > 0), the model fails to predict the constant value, so R² is undefined or can be considered 0 or negative.
    // For a single data point (n=1), ssTot will always be 0.
    return ssRes === 0 ? 1.00 : null; 
  }

  const r2 = 1 - (ssRes / ssTot);
  return parseFloat(r2.toFixed(2));
}

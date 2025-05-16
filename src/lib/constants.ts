
export const GSC_FACTORS = [
  { id: 'dataCommunications', name: 'Data Communications', description: 'The data and control information used in the application are sent or received over communication facilities.' },
  { id: 'distributedDataProcessing', name: 'Distributed Data Processing', description: 'Distributed data or processing functions are a characteristic of the application.' },
  { id: 'performance', name: 'Performance', description: 'Application performance objectives, stated or approved by the user, in either response or throughput, influence (or will influence) the design, development, installation, and support of the application.' },
  { id: 'heavilyUsedConfiguration', name: 'Heavily Used Configuration', description: 'A heavily used operational configuration is a characteristic of the application.' },
  { id: 'transactionRate', name: 'Transaction Rate', description: 'The transaction rate is high and influences the design, development, installation, and support of the application.' },
  { id: 'onlineDataEntry', name: 'Online Data Entry', description: 'Online data entry and control functions are provided in the application.' },
  { id: 'endUserEfficiency', name: 'End-User Efficiency', description: 'The online functions provided emphasize end-user efficiency.' },
  { id: 'onlineUpdate', name: 'Online Update', description: 'The application provides online update for the ILFs.' },
  { id: 'complexProcessing', name: 'Complex Processing', description: 'Complex processing is a characteristic of the application.' },
  { id: 'reusability', name: 'Reusability', description: 'The application and the code in the application have been specifically designed, developed, and supported to be usable in other applications.' },
  { id: 'installationEase', name: 'Installation Ease', description: 'Conversion and installation ease are characteristics of the application.' },
  { id: 'operationalEase', name: 'Operational Ease', description: 'Operational ease is a characteristic of the application.' },
  { id: 'multipleSites', name: 'Multiple Sites', description: 'The application has been specifically designed, developed, and supported to be installed at multiple sites for multiple organizations.' },
  { id: 'facilitateChange', name: 'Facilitate Change', description: 'The application has been specifically designed, developed, and supported to facilitate change.' },
] as const;

export type GSCFactorId = typeof GSC_FACTORS[number]['id'];

export const COCOMO_SCALE_FACTORS = [
  { id: 'PREC', name: 'Precedentedness', levels: ['Very Low', 'Low', 'Nominal', 'High', 'Very High', 'Extra High'], values: [6.20, 4.96, 3.72, 2.48, 1.24, 0.00] },
  { id: 'FLEX', name: 'Development Flexibility', levels: ['Very Low', 'Low', 'Nominal', 'High', 'Very High', 'Extra High'], values: [5.07, 4.05, 3.04, 2.03, 1.01, 0.00] },
  { id: 'RESL', name: 'Risk Resolution', levels: ['Very Low', 'Low', 'Nominal', 'High', 'Very High', 'Extra High'], values: [7.07, 5.65, 4.24, 2.83, 1.41, 0.00] },
  { id: 'TEAM', name: 'Team Cohesion', levels: ['Very Low', 'Low', 'Nominal', 'High', 'Very High', 'Extra High'], values: [5.48, 4.38, 3.29, 2.19, 1.10, 0.00] },
  { id: 'PMAT', name: 'Process Maturity', levels: ['Very Low', 'Low', 'Nominal', 'High', 'Very High', 'Extra High'], values: [7.80, 6.24, 4.68, 3.12, 1.56, 0.00] },
] as const;

export type CocomoScaleFactorId = typeof COCOMO_SCALE_FACTORS[number]['id'];

export const FP_COMPLEXITY_WEIGHTS = {
  EI: { low: 3, average: 4, high: 6 },
  EO: { low: 4, average: 5, high: 7 },
  EQ: { low: 3, average: 4, high: 6 },
  ILF: { low: 7, average: 10, high: 15 },
  EIF: { low: 5, average: 7, high: 10 },
};

// Average weights for simplified UFP calculation, used in the help dialog and calculations.ts
export const SIMPLE_WEIGHTS = {
  ei: 4, // Average EI
  eo: 5, // Average EO
  eq: 4, // Average EQ
  ilf: 10, // Average ILF
  eif: 7,  // Average EIF
};


// Basic COCOMO II constants (Post-Architecture model)
// Effort = A * Size^B * Product_of_EMs
// Size is KSLOC
// A = 2.94 (can vary)
// B = 0.91 + 0.01 * Sum_of_SF_exponents
// EMs are Cost Drivers, not implemented in detail here, so EAF will be derived from Scale Factors indirectly or simplified.
// For this implementation, we'll use a simplified EAF based on the sum of scale factor ratings.
// This is a simplification. Full COCOMO II is more complex.
export const COCOMO_A = 2.94;
export const COCOMO_BASE_EXPONENT = 0.91;


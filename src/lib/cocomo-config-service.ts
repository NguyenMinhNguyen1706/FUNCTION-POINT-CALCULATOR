
'use server'; // Mark as server action if used from server components, or remove if client-side only

/**
 * @fileOverview Service functions to save and retrieve COCOMO II model parameters
 * from Firebase Firestore.
 */

import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import type { COCOMO_SCALE_FACTORS } from '@/lib/constants'; // For type hinting

// This assumes your Firebase app is initialized elsewhere (e.g., in a central firebase.ts or by Firebase Hosting).
// If not, you would typically initialize it once:
// import { initializeApp, getApp, getApps } from "firebase/app";
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };
// if (!getApps().length) {
//   initializeApp(firebaseConfig);
// }
// const db = getFirestore(getApp());

// For simplicity here, we get the default Firestore instance.
// Ensure Firebase is initialized before these functions are called.
const db = getFirestore();

const COCOMO_CONFIG_COLLECTION = "cocomoConfiguration";
const DEFAULT_CONFIG_ID = "defaultParameters"; // You can have multiple named configurations

export interface CocomoParameterConfig {
  A: number;
  baseExponent: number;
  scaleFactors: typeof COCOMO_SCALE_FACTORS; // Using the type from constants
  // Add other parameters like costDrivers if you extend the model
  lastUpdated?: Date;
}

/**
 * Saves or updates the COCOMO II configuration in Firestore.
 * @param config The COCOMO II parameters to save.
 * @param configId Optional ID for the configuration set (defaults to "defaultParameters").
 * @returns A promise that resolves when the save is complete.
 */
export async function saveCocomoConfig(
  config: CocomoParameterConfig,
  configId: string = DEFAULT_CONFIG_ID
): Promise<void> {
  try {
    const configRef = doc(db, COCOMO_CONFIG_COLLECTION, configId);
    await setDoc(configRef, { ...config, lastUpdated: new Date() });
    console.log(`COCOMO configuration '${configId}' saved successfully.`);
  } catch (error) {
    console.error("Error saving COCOMO configuration: ", error);
    throw new Error("Failed to save COCOMO configuration.");
  }
}

/**
 * Retrieves the COCOMO II configuration from Firestore.
 * @param configId Optional ID for the configuration set (defaults to "defaultParameters").
 * @returns A promise that resolves with the configuration object, or null if not found.
 */
export async function getCocomoConfig(
  configId: string = DEFAULT_CONFIG_ID
): Promise<CocomoParameterConfig | null> {
  try {
    const configRef = doc(db, COCOMO_CONFIG_COLLECTION, configId);
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      // Convert Firestore Timestamp to Date if necessary
      const data = docSnap.data();
      if (data.lastUpdated && data.lastUpdated.toDate) {
        data.lastUpdated = data.lastUpdated.toDate();
      }
      return data as CocomoParameterConfig;
    } else {
      console.log(`No COCOMO configuration found with ID: ${configId}`);
      return null;
    }
  } catch (error) {
    console.error("Error retrieving COCOMO configuration: ", error);
    throw new Error("Failed to retrieve COCOMO configuration.");
  }
}

/**
 * Example usage:
 * This function demonstrates how you might save the current hardcoded constants
 * as a new configuration in Firestore. You would call this manually or from a setup script.
 */
/*
import { COCOMO_A, COCOMO_BASE_EXPONENT, COCOMO_SCALE_FACTORS as currentScaleFactors } from '@/lib/constants';

export async function initializeDefaultCocomoConfig() {
  const defaultConfig: CocomoParameterConfig = {
    A: COCOMO_A,
    baseExponent: COCOMO_BASE_EXPONENT,
    scaleFactors: currentScaleFactors,
  };
  await saveCocomoConfig(defaultConfig);
  console.log("Default COCOMO configuration initialized in Firestore.");
}
*/

// To use these in your calculations (src/lib/calculations.ts - calculateCocomoII):
// 1. You would call `await getCocomoConfig()` at the beginning of the function.
// 2. If a config is returned, use its 'A', 'baseExponent', and 'scaleFactors' values
//    instead of the imported constants.
// 3. If no config is found (or in case of an error), you might fall back to using
//    the hardcoded constants or handle it as an error.

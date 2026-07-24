/**
 * Health Data Import - Accurate Smart Rings Only
 * 
 * Supported Devices (Tier 1 & 2 accuracy only):
 * - Oura Ring (API + CSV) — 96% sleep accuracy, gold standard
 * - Ultrahuman Ring Air (CSV) — ~93% sleep accuracy, no subscription
 * - RingConn (CSV) — ~90% sleep accuracy, best value
 * - Samsung Galaxy Ring (CSV) — ~90% sleep accuracy
 * - WHOOP (CSV) — medical-grade HRV, proven recovery tracking
 * - Apple Watch (CSV) — validated HRV & HR tracking
 */

import { HealthData, HealthSource } from '@/types';
import Papa from 'papaparse';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// Helper to safely parse numbers
const parseNum = (val: string | undefined): number | undefined => {
  if (!val || val === '' || val === '--' || val === 'N/A') return undefined;
  const cleaned = val.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
};

// Helper to parse date
const parseDate = (val: string | undefined): string => {
  if (!val) return new Date().toISOString().split('T')[0];
  try {
    // Handle various date formats
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    
    // Try DD/MM/YYYY
    const parts = val.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // If first part is > 12, assume DD/MM/YYYY
      if (parseInt(parts[0]) > 12) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as Record<string, string>[]),
      error: (error) => reject(error),
    });
  });
}

// ==================== OURA RING CSV PARSER ====================
function parseOuraCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['date'] || row['day'] || row['Date']),
    source: 'oura' as const,
    sleepScore: parseNum(row['Sleep Score'] || row['sleep_score'] || row['Score']),
    sleepDuration: parseNum(row['Total Sleep Duration'] || row['total_sleep_duration']),
    sleepEfficiency: parseNum(row['Sleep Efficiency'] || row['efficiency']),
    deepSleep: parseNum(row['Deep Sleep Duration'] || row['deep_sleep_duration']),
    remSleep: parseNum(row['REM Sleep Duration'] || row['rem_sleep_duration']),
    lightSleep: parseNum(row['Light Sleep Duration'] || row['light_sleep_duration']),
    readinessScore: parseNum(row['Readiness Score'] || row['readiness_score']),
    hrvAvg: parseNum(row['Average HRV'] || row['average_hrv'] || row['HRV']),
    restingHR: parseNum(row['Lowest Heart Rate'] || row['lowest_heart_rate'] || row['Resting Heart Rate']),
    bodyTemperature: parseNum(row['Temperature Deviation'] || row['temperature_deviation']),
    respiratoryRate: parseNum(row['Average Breathing Rate'] || row['breathing_rate']),
    steps: parseNum(row['Steps'] || row['steps']),
  })).filter((d) => d.sleepScore || d.readinessScore || d.hrvAvg);
}

// ==================== RINGCONN CSV PARSER ====================
function parseRingConnCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['Date'] || row['date'] || row['Day']),
    source: 'ringconn' as const,
    sleepScore: parseNum(row['Sleep Score'] || row['Sleep Quality'] || row['sleep_score']),
    sleepDuration: parseNum(row['Sleep Duration'] || row['Total Sleep'] || row['sleep_duration']),
    sleepEfficiency: parseNum(row['Sleep Efficiency'] || row['Efficiency']),
    deepSleep: parseNum(row['Deep Sleep'] || row['deep_sleep']),
    remSleep: parseNum(row['REM Sleep'] || row['rem_sleep'] || row['REM']),
    lightSleep: parseNum(row['Light Sleep'] || row['light_sleep']),
    readinessScore: parseNum(row['Wellness Score'] || row['Health Score'] || row['Readiness']),
    hrvAvg: parseNum(row['HRV'] || row['Avg HRV'] || row['Heart Rate Variability']),
    restingHR: parseNum(row['Resting HR'] || row['Resting Heart Rate'] || row['Min HR']),
    spo2: parseNum(row['SpO2'] || row['Blood Oxygen'] || row['Oxygen Level']),
    bodyTemperature: parseNum(row['Skin Temperature'] || row['Temperature']),
    steps: parseNum(row['Steps'] || row['Total Steps']),
    activityScore: parseNum(row['Activity Score'] || row['Activity']),
  })).filter((d) => d.sleepScore || d.hrvAvg || d.restingHR);
}

// ==================== ULTRAHUMAN RING AIR CSV PARSER ====================
function parseUltrahumanCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['Date'] || row['date']),
    source: 'ultrahuman' as const,
    sleepScore: parseNum(row['Sleep Index'] || row['Sleep Score'] || row['sleep_index']),
    sleepDuration: parseNum(row['Total Sleep'] || row['Sleep Duration']),
    sleepEfficiency: parseNum(row['Sleep Efficiency'] || row['Efficiency']),
    deepSleep: parseNum(row['Deep Sleep'] || row['Deep']),
    remSleep: parseNum(row['REM Sleep'] || row['REM']),
    lightSleep: parseNum(row['Light Sleep'] || row['Light']),
    readinessScore: parseNum(row['Recovery Score'] || row['Recovery Index'] || row['Readiness']),
    hrvAvg: parseNum(row['HRV'] || row['Avg HRV'] || row['rMSSD']),
    restingHR: parseNum(row['Resting HR'] || row['Resting Heart Rate']),
    bodyTemperature: parseNum(row['Skin Temperature'] || row['Temperature Trend']),
    respiratoryRate: parseNum(row['Respiratory Rate'] || row['Breathing Rate']),
    steps: parseNum(row['Steps'] || row['Total Steps']),
    activityScore: parseNum(row['Movement Index'] || row['Activity Score']),
  })).filter((d) => d.sleepScore || d.hrvAvg || d.readinessScore);
}

// ==================== SAMSUNG GALAXY RING CSV PARSER ====================
function parseSamsungCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['Date'] || row['date'] || row['Measurement date']),
    source: 'samsung_galaxy_ring' as const,
    sleepScore: parseNum(row['Sleep Score'] || row['sleep_score'] || row['Sleep quality']),
    sleepDuration: parseNum(row['Total sleep time'] || row['Sleep Duration'] || row['Total Sleep']),
    sleepEfficiency: parseNum(row['Sleep Efficiency'] || row['efficiency']),
    deepSleep: parseNum(row['Deep sleep'] || row['Deep Sleep Duration']),
    remSleep: parseNum(row['REM sleep'] || row['REM Sleep Duration']),
    lightSleep: parseNum(row['Light sleep'] || row['Light Sleep Duration']),
    readinessScore: parseNum(row['Energy Score'] || row['Readiness'] || row['Recovery']),
    hrvAvg: parseNum(row['HRV'] || row['Heart rate variability']),
    restingHR: parseNum(row['Resting heart rate'] || row['Min HR'] || row['Lowest HR']),
    spo2: parseNum(row['SpO2'] || row['Blood oxygen'] || row['Oxygen during sleep']),
    bodyTemperature: parseNum(row['Skin temperature'] || row['Skin temp']),
    steps: parseNum(row['Steps'] || row['Total steps']),
    caloriesBurned: parseNum(row['Calories'] || row['Active calories']),
  })).filter((d) => d.sleepScore || d.hrvAvg || d.restingHR);
}

// ==================== WHOOP CSV PARSER ====================
function parseWhoopCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['Date'] || row['Cycle start time'] || row['date']),
    source: 'whoop' as const,
    sleepScore: parseNum(row['Sleep Performance %'] || row['Sleep Score']),
    sleepDuration: parseNum(row['Total in bed time'] || row['Sleep Duration']),
    sleepEfficiency: parseNum(row['Sleep Efficiency %'] || row['Efficiency']),
    deepSleep: parseNum(row['Slow Wave Sleep time'] || row['Deep Sleep']),
    remSleep: parseNum(row['REM time'] || row['REM Sleep']),
    lightSleep: parseNum(row['Light Sleep time'] || row['Light Sleep']),
    readinessScore: parseNum(row['Recovery Score %'] || row['Recovery']),
    hrvAvg: parseNum(row['HRV'] || row['Heart Rate Variability RMSSD']),
    restingHR: parseNum(row['Resting Heart Rate'] || row['RHR']),
    spo2: parseNum(row['SpO2 %'] || row['Blood Oxygen']),
    respiratoryRate: parseNum(row['Respiratory Rate'] || row['Avg Respiratory Rate']),
    caloriesBurned: parseNum(row['Calories'] || row['Kilojoule']),
  })).filter((d) => d.sleepScore || d.hrvAvg || d.readinessScore);
}

// ==================== APPLE WATCH / APPLE HEALTH CSV PARSER ====================
function parseAppleHealthCSV(data: Record<string, string>[]): HealthData[] {
  return data.map((row) => ({
    id: generateId(),
    date: parseDate(row['Date'] || row['Start Date'] || row['date']),
    source: 'apple_watch' as const,
    sleepDuration: parseNum(row['Sleep Duration'] || row['Time Asleep'] || row['In Bed Duration']),
    deepSleep: parseNum(row['Deep Sleep'] || row['Core Sleep']),
    remSleep: parseNum(row['REM Sleep']),
    hrvAvg: parseNum(row['HRV'] || row['Heart Rate Variability'] || row['HRV (ms)']),
    restingHR: parseNum(row['Resting Heart Rate'] || row['Resting HR']),
    spo2: parseNum(row['Blood Oxygen'] || row['SpO2'] || row['Oxygen Saturation']),
    respiratoryRate: parseNum(row['Respiratory Rate'] || row['Breathing Rate']),
    steps: parseNum(row['Steps'] || row['Step Count']),
    caloriesBurned: parseNum(row['Active Calories'] || row['Active Energy']),
  })).filter((d) => d.sleepDuration || d.hrvAvg || d.restingHR);
}

// ==================== GENERIC/AUTO-DETECT PARSER ====================
function parseGenericHealthCSV(data: Record<string, string>[], source: HealthSource): HealthData[] {
  return data.map((row) => {
    const keys = Object.keys(row);
    
    const findKey = (patterns: RegExp[]) => 
      keys.find(k => patterns.some(p => p.test(k)));

    const dateKey = findKey([/date|day|night/i]);
    const sleepScoreKey = findKey([/sleep.*score|sleep.*quality|sleep.*index/i]);
    const sleepDurationKey = findKey([/sleep.*dur|total.*sleep|sleep.*time/i]);
    const hrvKey = findKey([/hrv|heart.*rate.*var|rmssd/i]);
    const restHRKey = findKey([/resting.*hr|resting.*heart|rest.*hr|lowest.*hr|min.*hr/i]);
    const readinessKey = findKey([/readiness|recovery|energy.*score|wellness/i]);
    const spo2Key = findKey([/spo2|blood.*oxygen|oxygen/i]);
    const stepsKey = findKey([/steps|step.*count/i]);
    const deepKey = findKey([/deep.*sleep|deep/i]);
    const remKey = findKey([/rem.*sleep|rem/i]);
    const tempKey = findKey([/temp|skin.*temp/i]);

    return {
      id: generateId(),
      date: parseDate(row[dateKey || '']),
      source,
      sleepScore: parseNum(row[sleepScoreKey || '']),
      sleepDuration: parseNum(row[sleepDurationKey || '']),
      deepSleep: parseNum(row[deepKey || '']),
      remSleep: parseNum(row[remKey || '']),
      readinessScore: parseNum(row[readinessKey || '']),
      hrvAvg: parseNum(row[hrvKey || '']),
      restingHR: parseNum(row[restHRKey || '']),
      spo2: parseNum(row[spo2Key || '']),
      bodyTemperature: parseNum(row[tempKey || '']),
      steps: parseNum(row[stepsKey || '']),
    };
  }).filter((d) => d.sleepScore || d.hrvAvg || d.restingHR || d.sleepDuration);
}

// ==================== MAIN DISPATCHER ====================

export async function parseHealthDataFromCSV(
  file: File,
  source: HealthSource
): Promise<{ data: HealthData[]; errors: string[] }> {
  try {
    const rows = await parseCSVFile(file);
    
    if (rows.length === 0) {
      return { data: [], errors: ['No data found in CSV file'] };
    }

    let healthData: HealthData[];

    switch (source) {
      case 'oura':
        healthData = parseOuraCSV(rows);
        break;
      case 'ringconn':
        healthData = parseRingConnCSV(rows);
        break;
      case 'ultrahuman':
        healthData = parseUltrahumanCSV(rows);
        break;
      case 'samsung_galaxy_ring':
        healthData = parseSamsungCSV(rows);
        break;
      case 'whoop':
        healthData = parseWhoopCSV(rows);
        break;
      case 'apple_watch':
        healthData = parseAppleHealthCSV(rows);
        break;
      default:
        healthData = parseGenericHealthCSV(rows, source);
        break;
    }

    // If specific parser returns nothing, try generic
    if (healthData.length === 0) {
      healthData = parseGenericHealthCSV(rows, source);
    }

    return {
      data: healthData,
      errors: healthData.length === 0 ? ['Could not parse any health data from this file. Please check the format.'] : [],
    };
  } catch (error) {
    return {
      data: [],
      errors: [`Failed to parse health CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// ==================== DEVICE INFO ====================

export interface DeviceInfo {
  id: HealthSource;
  name: string;
  hasApi: boolean;
  hasSubscription: boolean;
  csvExportInstructions: string;
  apiSetupInstructions?: string;
  dataAvailable: string[];
}

export const SUPPORTED_DEVICES: DeviceInfo[] = [
  {
    id: 'oura',
    name: 'Oura Ring (3/4/5)',
    hasApi: true,
    hasSubscription: true,
    csvExportInstructions: 'Go to cloud.ouraring.com → Trends → Export Data → Download CSV',
    apiSetupInstructions: 'Go to cloud.ouraring.com/personal-access-tokens → Create new token',
    dataAvailable: ['Sleep Score', 'Readiness', 'HRV', 'Resting HR', 'Temperature', 'SpO2', 'Steps'],
  },
  {
    id: 'ultrahuman',
    name: 'Ultrahuman Ring Air',
    hasApi: false,
    hasSubscription: false,
    csvExportInstructions: 'Open Ultrahuman app → Settings → Export Data → Choose CSV format',
    dataAvailable: ['Sleep Index', 'Recovery Score', 'HRV', 'Resting HR', 'Temperature', 'Steps'],
  },
  {
    id: 'ringconn',
    name: 'RingConn (Gen 1/2)',
    hasApi: false,
    hasSubscription: false,
    csvExportInstructions: 'Open RingConn app → Profile → Data Export → Select date range → Export CSV',
    dataAvailable: ['Sleep Score', 'HRV', 'Resting HR', 'SpO2', 'Temperature', 'Steps'],
  },
  {
    id: 'samsung_galaxy_ring',
    name: 'Samsung Galaxy Ring',
    hasApi: false,
    hasSubscription: false,
    csvExportInstructions: 'Open Samsung Health → ⋮ menu → Settings → Download personal data → Select categories → Export',
    dataAvailable: ['Sleep Score', 'Energy Score', 'HRV', 'Resting HR', 'SpO2', 'Steps'],
  },
  {
    id: 'whoop',
    name: 'WHOOP (4.0/5.0)',
    hasApi: false,
    hasSubscription: true,
    csvExportInstructions: 'Go to app.whoop.com → Click your profile → Download My Data → CSV',
    dataAvailable: ['Recovery %', 'Sleep Performance', 'HRV', 'Resting HR', 'SpO2', 'Respiratory Rate'],
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch (Series 7+)',
    hasApi: false,
    hasSubscription: false,
    csvExportInstructions: 'Open Health app → Profile picture → Export All Health Data → Or use "Health Auto Export" app for CSV',
    dataAvailable: ['Sleep Duration', 'HRV', 'Resting HR', 'SpO2', 'Respiratory Rate', 'Steps'],
  },
];

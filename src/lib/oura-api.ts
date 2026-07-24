/**
 * Oura Ring API Integration
 * 
 * API Documentation: https://cloud.ouraring.com/v2/docs
 * 
 * To get a personal access token:
 * 1. Go to https://cloud.ouraring.com/personal-access-tokens
 * 2. Create a new token
 * 3. Add it in the Settings page
 */

import { HealthData } from '@/types';

const OURA_BASE_URL = 'https://api.ouraring.com/v2';

interface OuraSleepData {
  id: string;
  day: string;
  score: number;
  timestamp: string;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
}

interface OuraReadinessData {
  id: string;
  day: string;
  score: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

interface OuraHeartRateData {
  bpm: number;
  source: string;
  timestamp: string;
}

interface OuraDailySleepDocument {
  id: string;
  day: string;
  score: number;
  timestamp: string;
}

interface OuraDailyReadinessDocument {
  id: string;
  day: string;
  score: number;
  timestamp: string;
}

async function ouraFetch(endpoint: string, token: string, params?: Record<string, string>) {
  const url = new URL(`${OURA_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch sleep data for a date range
 */
export async function fetchOuraSleep(
  token: string,
  startDate: string,
  endDate: string
): Promise<OuraDailySleepDocument[]> {
  const data = await ouraFetch('/usercollection/daily_sleep', token, {
    start_date: startDate,
    end_date: endDate,
  });
  return data.data || [];
}

/**
 * Fetch readiness data for a date range
 */
export async function fetchOuraReadiness(
  token: string,
  startDate: string,
  endDate: string
): Promise<OuraDailyReadinessDocument[]> {
  const data = await ouraFetch('/usercollection/daily_readiness', token, {
    start_date: startDate,
    end_date: endDate,
  });
  return data.data || [];
}

/**
 * Fetch heart rate data
 */
export async function fetchOuraHeartRate(
  token: string,
  startDate: string,
  endDate: string
): Promise<OuraHeartRateData[]> {
  const data = await ouraFetch('/usercollection/heartrate', token, {
    start_datetime: `${startDate}T00:00:00+00:00`,
    end_datetime: `${endDate}T23:59:59+00:00`,
  });
  return data.data || [];
}

/**
 * Fetch sleep periods (detailed sleep data)
 */
export async function fetchOuraSleepPeriods(
  token: string,
  startDate: string,
  endDate: string
) {
  const data = await ouraFetch('/usercollection/sleep', token, {
    start_date: startDate,
    end_date: endDate,
  });
  return data.data || [];
}

/**
 * Sync Oura data for a date range and return HealthData entries
 */
export async function syncOuraData(
  token: string,
  startDate: string,
  endDate: string
): Promise<HealthData[]> {
  try {
    const [sleepData, readinessData, sleepPeriods] = await Promise.all([
      fetchOuraSleep(token, startDate, endDate),
      fetchOuraReadiness(token, startDate, endDate),
      fetchOuraSleepPeriods(token, startDate, endDate),
    ]);

    // Create a map of dates to combined health data
    const dateMap = new Map<string, Partial<HealthData>>();

    // Add sleep scores
    sleepData.forEach((sleep) => {
      const existing = dateMap.get(sleep.day) || {};
      dateMap.set(sleep.day, {
        ...existing,
        date: sleep.day,
        sleepScore: sleep.score,
      });
    });

    // Add readiness scores
    readinessData.forEach((readiness) => {
      const existing = dateMap.get(readiness.day) || {};
      dateMap.set(readiness.day, {
        ...existing,
        date: readiness.day,
        readinessScore: readiness.score,
      });
    });

    // Add detailed sleep data (duration, phases, HRV)
    sleepPeriods.forEach((period: any) => {
      const day = period.day;
      const existing = dateMap.get(day) || {};
      dateMap.set(day, {
        ...existing,
        date: day,
        sleepDuration: period.total_sleep_duration
          ? Math.round(period.total_sleep_duration / 60) // Convert seconds to minutes
          : existing.sleepDuration,
        sleepEfficiency: period.efficiency || existing.sleepEfficiency,
        deepSleep: period.deep_sleep_duration
          ? Math.round(period.deep_sleep_duration / 60)
          : existing.deepSleep,
        remSleep: period.rem_sleep_duration
          ? Math.round(period.rem_sleep_duration / 60)
          : existing.remSleep,
        lightSleep: period.light_sleep_duration
          ? Math.round(period.light_sleep_duration / 60)
          : existing.lightSleep,
        hrvAvg: period.average_hrv || existing.hrvAvg,
        restingHR: period.lowest_heart_rate || existing.restingHR,
      });
    });

    // Convert map to HealthData array
    const healthEntries: HealthData[] = Array.from(dateMap.entries()).map(
      ([date, data]) => ({
        id: Math.random().toString(36).substring(2) + Date.now().toString(36),
        date,
        source: 'oura' as const,
        sleepScore: data.sleepScore,
        sleepDuration: data.sleepDuration,
        sleepEfficiency: data.sleepEfficiency,
        deepSleep: data.deepSleep,
        remSleep: data.remSleep,
        lightSleep: data.lightSleep,
        readinessScore: data.readinessScore,
        hrvAvg: data.hrvAvg,
        restingHR: data.restingHR,
      })
    );

    return healthEntries;
  } catch (error) {
    console.error('Failed to sync Oura data:', error);
    throw error;
  }
}

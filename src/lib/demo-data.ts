/**
 * Demo Data Generator
 * Fills the app with realistic sample data so you can test everything
 * without needing a ring or trading account connected.
 */

import { TradingAccount, Trade, JournalEntry, HealthData, TiltLevel, SessionRating } from '@/types';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

// Helper to get random item from array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

// Generate date string for N days ago
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

const daysAgoFull = (n: number, hour: number = 9, min: number = 30): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, randInt(0, 59));
  return d.toISOString();
};

// ==================== DEMO ACCOUNTS ====================

export function generateDemoAccounts(): TradingAccount[] {
  return [
    {
      id: generateId(),
      name: 'TopstepX 50K',
      platform: 'topstepx',
      type: 'prop',
      balance: 50000,
      startingBalance: 50000,
      maxDrawdown: 2000,
      profitTarget: 3000,
      dailyLossLimit: 1000,
      isActive: true,
      createdAt: daysAgoFull(45),
    },
    {
      id: generateId(),
      name: 'Apex 100K Eval',
      platform: 'apex',
      type: 'prop',
      balance: 100000,
      startingBalance: 100000,
      maxDrawdown: 3000,
      profitTarget: 6000,
      dailyLossLimit: 1500,
      isActive: true,
      createdAt: daysAgoFull(30),
    },
    {
      id: generateId(),
      name: 'Tradovate Live',
      platform: 'tradovate',
      type: 'live',
      balance: 25000,
      startingBalance: 25000,
      isActive: true,
      createdAt: daysAgoFull(90),
    },
    {
      id: generateId(),
      name: 'TopstepX 150K (Funded)',
      platform: 'topstepx',
      type: 'prop',
      balance: 150000,
      startingBalance: 150000,
      maxDrawdown: 4500,
      isActive: true,
      createdAt: daysAgoFull(20),
    },
  ];
}

// ==================== DEMO TRADES ====================

const symbols = ['ES', 'NQ', 'MES', 'MNQ', 'CL', 'GC', 'NQ', 'ES', 'ES', 'NQ'];
const strategies = ['Breakout', 'Pullback Long', 'Pullback Short', 'VWAP Play', 'Opening Range', 'Momentum', 'Fair Value Gap', 'Liquidity Sweep', 'Trend Follow', 'Reversal'];

const tickData: Record<string, { tickSize: number; tickValue: number; basePrice: number }> = {
  ES: { tickSize: 0.25, tickValue: 12.5, basePrice: 5500 },
  NQ: { tickSize: 0.25, tickValue: 5, basePrice: 19800 },
  MES: { tickSize: 0.25, tickValue: 1.25, basePrice: 5500 },
  MNQ: { tickSize: 0.25, tickValue: 0.5, basePrice: 19800 },
  CL: { tickSize: 0.01, tickValue: 10, basePrice: 78 },
  GC: { tickSize: 0.1, tickValue: 10, basePrice: 2350 },
};

export function generateDemoTrades(accounts: TradingAccount[]): Trade[] {
  const trades: Trade[] = [];
  
  // Generate 60-90 trades over last 30 days
  const tradeCount = randInt(65, 85);
  
  for (let i = 0; i < tradeCount; i++) {
    const daysBack = randInt(0, 29);
    const hour = randInt(8, 15);
    const minute = randInt(0, 59);
    const account = pick(accounts);
    const symbol = pick(symbols);
    const direction = Math.random() > 0.48 ? 'long' : 'short' as const;
    const strategy = pick(strategies);
    const data = tickData[symbol] || tickData['ES'];
    
    const entryPrice = data.basePrice + rand(-20, 20);
    // Winning ~55% of the time with varied R multiples
    const isWin = Math.random() < 0.55;
    const ticksMove = isWin 
      ? randInt(4, 30) * data.tickSize
      : -randInt(3, 16) * data.tickSize;
    
    const exitPrice = direction === 'long' 
      ? entryPrice + ticksMove 
      : entryPrice - ticksMove;
    
    const quantity = randInt(1, 4);
    const ticks = Math.abs(exitPrice - entryPrice) / data.tickSize;
    const pnl = ticks * data.tickValue * quantity * (isWin ? 1 : -1);
    const fees = quantity * 4.5; // ~$4.50 per contract round trip
    
    const riskAmount = randInt(3, 8) * data.tickSize * data.tickValue * quantity;
    const rMultiple = (pnl - fees) / riskAmount;

    trades.push({
      id: generateId(),
      accountId: account.id,
      symbol,
      assetClass: 'futures',
      direction,
      status: 'closed',
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: Math.round(exitPrice * 100) / 100,
      quantity,
      entryTime: daysAgoFull(daysBack, hour, minute),
      exitTime: daysAgoFull(daysBack, hour, minute + randInt(2, 45)),
      pnl: Math.round(pnl * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      netPnl: Math.round((pnl - fees) * 100) / 100,
      riskAmount: Math.round(riskAmount * 100) / 100,
      rMultiple: Math.round(rMultiple * 100) / 100,
      strategy,
      tags: [strategy.toLowerCase().replace(/\s/g, '-')],
    });
  }
  
  return trades.sort((a, b) => (b.entryTime || '').localeCompare(a.entryTime || ''));
}

// ==================== DEMO HEALTH DATA ====================

export function generateDemoHealthData(): HealthData[] {
  const data: HealthData[] = [];
  
  // Generate 30 days of health data
  for (let i = 0; i < 30; i++) {
    const baseReadiness = randInt(55, 95);
    const baseSleep = randInt(60, 95);
    const baseHRV = randInt(28, 72);
    
    data.push({
      id: generateId(),
      date: daysAgo(i),
      source: pick(['oura', 'ultrahuman', 'ringconn'] as const),
      sleepScore: baseSleep + randInt(-5, 5),
      sleepDuration: randInt(320, 510), // 5.3 to 8.5 hours in minutes
      sleepEfficiency: randInt(80, 97),
      deepSleep: randInt(40, 110),
      remSleep: randInt(50, 130),
      lightSleep: randInt(120, 200),
      readinessScore: baseReadiness + randInt(-5, 5),
      hrvAvg: baseHRV + randInt(-8, 8),
      restingHR: randInt(48, 68),
      spo2: randInt(95, 99),
      steps: randInt(3000, 14000),
      caffeineIntake: pick([0, 0, 100, 200, 200, 300, 400]),
      alcoholServings: pick([0, 0, 0, 0, 1, 2, 0]),
      stressLevel: pick([1, 2, 2, 3, 3, 3, 4, 4, 5]) as SessionRating,
    });
  }
  
  return data;
}

// ==================== DEMO JOURNAL ENTRIES ====================

const gamePlans = [
  'Focus on ES during NY open. Key levels: 5520 resistance, 5490 support. Only take A+ setups. Max 3 trades.',
  'NQ looks weak pre-market. Looking for short setups below VWAP. Keep size small, max 2 contracts.',
  'Trend day setup on ES. Will scale in if we break above yesterday high. Risk 1% max.',
  'Choppy day expected (FOMC tomorrow). Will trade opening range only then shut it down.',
  'Gold looking strong. Will focus on GC breakout above 2360. Also watching ES for gap fill.',
  'Taking it easy today. Only trading first hour. Readiness score was low.',
  'Big day energy. Slept great, HRV is up. Going for 3-4 trades max with larger size.',
];

const lessons = [
  'Took profit too early on the first trade. Should have let it run to target.',
  'Overtraded in the afternoon when I should have been done. Need to respect my rules.',
  'Great discipline today. Took only planned setups and walked away after target hit.',
  'FOMO got me on the 3rd trade. Entered without confirmation. Cost me $300.',
  'My best session in weeks. Followed plan perfectly. Sleep score was 90+ and it showed.',
  'Should not have traded today. Felt off from the start. HRV was low — should have listened.',
  'Revenge traded after first loss. Turned a -$200 day into -$800. Never again.',
  'Patient today. Waited 2 hours for setup and nailed it. Quality over quantity.',
];

const emotions = [
  'Calm & Focused', 'Confident', 'Patient', 'Disciplined',
  'Anxious', 'FOMO', 'Frustrated', 'Revenge Mindset',
  'Tired/Fatigued', 'Euphoric/Overconfident', 'Bored/Forcing',
];

export function generateDemoJournalEntries(): JournalEntry[] {
  const entries: JournalEntry[] = [];
  
  // Generate entries for 20 of the last 30 days
  const tradingDays = Array.from({ length: 30 }, (_, i) => i)
    .filter(() => Math.random() > 0.3)
    .slice(0, 20);
  
  for (const day of tradingDays) {
    const followedPlan = Math.random() > 0.3;
    const tiltLevel = followedPlan 
      ? pick(['none', 'none', 'low', 'low'] as TiltLevel[])
      : pick(['low', 'medium', 'high', 'extreme'] as TiltLevel[]);
    
    entries.push({
      id: generateId(),
      date: daysAgo(day),
      preSleepQuality: pick([2, 3, 3, 4, 4, 5]) as SessionRating,
      preEnergyLevel: pick([2, 3, 3, 4, 4, 5]) as SessionRating,
      preMoodRating: pick([2, 3, 3, 4, 4, 5]) as SessionRating,
      preMarketBias: pick(['Bullish', 'Bearish', 'Neutral', 'Choppy', 'Trending']),
      preGamePlan: pick(gamePlans),
      preConfidence: pick([2, 3, 3, 4, 4, 5]) as SessionRating,
      postSessionRating: pick([1, 2, 3, 3, 4, 4, 5]) as SessionRating,
      postTiltLevel: tiltLevel,
      postFollowedPlan: followedPlan,
      postEmotionalState: pick(emotions),
      postLessonsLearned: pick(lessons),
      postNotes: Math.random() > 0.5 ? 'Need to review this session on replay.' : undefined,
    });
  }
  
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

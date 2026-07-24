// ==================== CORE TYPES ====================

export type AccountType = 'prop' | 'live' | 'demo';
export type TradeDirection = 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'partial';
export type AssetClass = 'futures' | 'options';
export type SessionRating = 1 | 2 | 3 | 4 | 5;
export type TiltLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

// ==================== PLATFORMS ====================

export type Platform =
  // Prop Firms
  | 'topstepx'
  | 'tradesea'
  | 'apex'
  | 'myfundedfutures'
  | 'bulenox'
  | 'the_trading_pit'
  | 'elite_trader_funding'
  | 'lucid'
  | 'redline_funding'
  | 'alpha_futures'
  // Live/Retail Brokers
  | 'tradovate'
  | 'ninjatrader'
  | 'thinkorswim'
  | 'interactive_brokers'
  | 'tradestation'
  | 'rithmic'
  | 'amp_futures'
  | 'tastytrade'
  // Generic
  | 'manual'
  | 'other';

export const PLATFORM_LABELS: Record<Platform, string> = {
  // Prop Firms
  topstepx: 'TopstepX',
  tradesea: 'Tradesea',
  apex: 'Apex Trader Funding',
  myfundedfutures: 'MyFundedFutures (MFFU)',
  bulenox: 'Bulenox',
  the_trading_pit: 'The Trading Pit',
  elite_trader_funding: 'Elite Trader Funding',
  lucid: 'Lucid',
  redline_funding: 'Redline Funding',
  alpha_futures: 'Alpha Futures',
  // Live/Retail Brokers
  tradovate: 'Tradovate',
  ninjatrader: 'NinjaTrader',
  thinkorswim: 'ThinkorSwim (Schwab)',
  interactive_brokers: 'Interactive Brokers',
  tradestation: 'TradeStation',
  rithmic: 'Rithmic (R|Trader)',
  amp_futures: 'AMP Futures',
  tastytrade: 'Tastytrade',
  // Generic
  manual: 'Manual Entry',
  other: 'Other',
};

export const PROP_FIRMS: Platform[] = [
  'topstepx',
  'tradesea',
  'apex',
  'myfundedfutures',
  'bulenox',
  'the_trading_pit',
  'elite_trader_funding',
  'lucid',
  'redline_funding',
  'alpha_futures',
];

export const LIVE_BROKERS: Platform[] = [
  'tradovate',
  'ninjatrader',
  'thinkorswim',
  'interactive_brokers',
  'tradestation',
  'rithmic',
  'amp_futures',
  'tastytrade',
];

// ==================== ACCOUNTS ====================

export interface TradingAccount {
  id: string;
  name: string;
  platform: Platform;
  type: AccountType;
  balance: number;
  startingBalance: number;
  maxDrawdown?: number; // For prop accounts
  profitTarget?: number; // For prop accounts
  dailyLossLimit?: number;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

// ==================== TRADES ====================

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  assetClass: AssetClass;
  direction: TradeDirection;
  status: TradeStatus;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryTime: string;
  exitTime?: string;
  pnl?: number;
  fees?: number;
  netPnl?: number;
  riskAmount?: number;
  rMultiple?: number;
  strategy?: string;
  setup?: string;
  notes?: string;
  tags?: string[];
  screenshot?: string;
}

// ==================== JOURNAL / PSYCHOLOGY ====================

export interface JournalEntry {
  id: string;
  date: string;
  // Pre-session
  preSleepQuality?: SessionRating;
  preEnergyLevel?: SessionRating;
  preMoodRating?: SessionRating;
  preMarketBias?: string;
  preGamePlan?: string;
  preConfidence?: SessionRating;
  // Post-session
  postSessionRating?: SessionRating;
  postTiltLevel?: TiltLevel;
  postFollowedPlan?: boolean;
  postEmotionalState?: string;
  postLessonsLearned?: string;
  postNotes?: string;
  // Linked data
  trades?: Trade[];
  healthData?: HealthData;
}

// ==================== HEALTH DATA (OURA) ====================

export type HealthSource =
  | 'oura'
  | 'ringconn'
  | 'ultrahuman'
  | 'samsung_galaxy_ring'
  | 'whoop'
  | 'apple_watch'
  | 'manual';

export const HEALTH_SOURCE_LABELS: Record<HealthSource, string> = {
  oura: 'Oura Ring',
  ringconn: 'RingConn',
  ultrahuman: 'Ultrahuman Ring Air',
  samsung_galaxy_ring: 'Samsung Galaxy Ring',
  whoop: 'WHOOP',
  apple_watch: 'Apple Watch',
  manual: 'Manual Entry',
};

export interface HealthData {
  id: string;
  date: string;
  source: HealthSource;
  // Sleep
  sleepScore?: number;
  sleepDuration?: number; // minutes
  sleepEfficiency?: number; // percentage
  deepSleep?: number; // minutes
  remSleep?: number; // minutes
  lightSleep?: number; // minutes
  // Readiness
  readinessScore?: number;
  hrvAvg?: number;
  restingHR?: number;
  bodyTemperature?: number;
  respiratoryRate?: number;
  spo2?: number; // blood oxygen
  // Activity
  activityScore?: number;
  steps?: number;
  caloriesBurned?: number;
  // Custom
  caffeineIntake?: number; // mg
  alcoholServings?: number;
  stressLevel?: SessionRating;
}

// ==================== ANALYTICS ====================

export interface DailyStats {
  date: string;
  totalPnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgRMultiple: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  healthScore?: number;
  tiltLevel?: TiltLevel;
}

export interface StrategyStats {
  strategy: string;
  totalTrades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  avgRMultiple: number;
  profitFactor: number;
}

export interface TimeOfDayStats {
  hour: number;
  tradeCount: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

// ==================== COMMON FUTURES SYMBOLS ====================

export const FUTURES_SYMBOLS = [
  { symbol: 'ES', name: 'E-mini S&P 500', tickSize: 0.25, tickValue: 12.50 },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100', tickSize: 0.25, tickValue: 5.00 },
  { symbol: 'MES', name: 'Micro E-mini S&P 500', tickSize: 0.25, tickValue: 1.25 },
  { symbol: 'MNQ', name: 'Micro E-mini Nasdaq 100', tickSize: 0.25, tickValue: 0.50 },
  { symbol: 'YM', name: 'E-mini Dow', tickSize: 1, tickValue: 5.00 },
  { symbol: 'MYM', name: 'Micro E-mini Dow', tickSize: 1, tickValue: 0.50 },
  { symbol: 'RTY', name: 'E-mini Russell 2000', tickSize: 0.10, tickValue: 5.00 },
  { symbol: 'CL', name: 'Crude Oil', tickSize: 0.01, tickValue: 10.00 },
  { symbol: 'MCL', name: 'Micro Crude Oil', tickSize: 0.01, tickValue: 1.00 },
  { symbol: 'GC', name: 'Gold', tickSize: 0.10, tickValue: 10.00 },
  { symbol: 'MGC', name: 'Micro Gold', tickSize: 0.10, tickValue: 1.00 },
  { symbol: 'SI', name: 'Silver', tickSize: 0.005, tickValue: 25.00 },
  { symbol: 'ZB', name: '30-Year T-Bond', tickSize: 1/32, tickValue: 31.25 },
  { symbol: 'ZN', name: '10-Year T-Note', tickSize: 1/64, tickValue: 15.625 },
  { symbol: 'NG', name: 'Natural Gas', tickSize: 0.001, tickValue: 10.00 },
  { symbol: '6E', name: 'Euro FX', tickSize: 0.00005, tickValue: 6.25 },
  { symbol: '6J', name: 'Japanese Yen', tickSize: 0.0000005, tickValue: 6.25 },
];

// ==================== STRATEGIES ====================

export const DEFAULT_STRATEGIES = [
  'Breakout',
  'Breakdown',
  'Pullback Long',
  'Pullback Short',
  'Range Fade',
  'Momentum',
  'Reversal',
  'Scalp',
  'Trend Follow',
  'VWAP Play',
  'Opening Range',
  'Gap Fill',
  'Supply/Demand Zone',
  'Order Block',
  'Fair Value Gap',
  'Liquidity Sweep',
  'Other',
];

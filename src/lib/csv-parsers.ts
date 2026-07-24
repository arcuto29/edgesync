import { Trade, Platform } from '@/types';
import Papa from 'papaparse';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// ==================== GENERIC CSV PARSER ====================

interface ParsedCSV {
  data: Record<string, string>[];
  errors: Papa.ParseError[];
}

export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data as Record<string, string>[],
          errors: results.errors,
        });
      },
      error: (error) => reject(error),
    });
  });
}

// ==================== PLATFORM-SPECIFIC PARSERS ====================

// Helper to safely parse numbers
const parseNum = (val: string | undefined): number => {
  if (!val) return 0;
  const cleaned = val.replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
};

// Helper to parse date strings into ISO format
const parseDate = (val: string | undefined): string => {
  if (!val) return new Date().toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

// Detect direction from quantity or side column
const detectDirection = (row: Record<string, string>): 'long' | 'short' => {
  const side = (row['Side'] || row['side'] || row['B/S'] || row['Action'] || row['action'] || '').toLowerCase();
  if (side.includes('buy') || side.includes('long') || side === 'b') return 'long';
  if (side.includes('sell') || side.includes('short') || side === 's') return 'short';
  const qty = parseNum(row['Quantity'] || row['Qty'] || row['qty']);
  return qty >= 0 ? 'long' : 'short';
};

// ==================== TRADOVATE PARSER ====================
export function parseTradovate(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Contract'] || row['Symbol'] || row['Product'] || 'Unknown',
    assetClass: 'futures' as const,
    direction: detectDirection(row),
    status: 'closed' as const,
    entryPrice: parseNum(row['Avg Entry Price'] || row['Entry Price'] || row['AvgPrice']),
    exitPrice: parseNum(row['Avg Exit Price'] || row['Exit Price']),
    quantity: Math.abs(parseNum(row['Qty'] || row['Quantity'] || row['Size'])),
    entryTime: parseDate(row['Entry Time'] || row['Time'] || row['Date']),
    exitTime: parseDate(row['Exit Time'] || row['Close Time']),
    pnl: parseNum(row['P&L'] || row['PnL'] || row['Profit'] || row['Net P&L']),
    fees: parseNum(row['Fees'] || row['Commission'] || row['Comm']),
    netPnl: parseNum(row['Net P&L'] || row['P&L'] || row['PnL'] || row['Profit']),
    notes: row['Notes'] || '',
  }));
}

// ==================== TOPSTEPX PARSER ====================
export function parseTopstepX(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Symbol'] || row['Instrument'] || row['Contract'] || 'Unknown',
    assetClass: 'futures' as const,
    direction: detectDirection(row),
    status: 'closed' as const,
    entryPrice: parseNum(row['Entry Price'] || row['Open Price'] || row['Price']),
    exitPrice: parseNum(row['Exit Price'] || row['Close Price']),
    quantity: Math.abs(parseNum(row['Quantity'] || row['Qty'] || row['Contracts'])),
    entryTime: parseDate(row['Entry Time'] || row['Open Time'] || row['Date']),
    exitTime: parseDate(row['Exit Time'] || row['Close Time']),
    pnl: parseNum(row['Realized P&L'] || row['P&L'] || row['PnL'] || row['Profit']),
    fees: parseNum(row['Fees'] || row['Commission']),
    netPnl: parseNum(row['Net P&L'] || row['Realized P&L'] || row['P&L'] || row['PnL']),
  }));
}

// ==================== NINJATRADER PARSER ====================
export function parseNinjaTrader(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Instrument'] || row['Symbol'] || 'Unknown',
    assetClass: 'futures' as const,
    direction: (row['Market pos.'] || row['Entry'] || '').toLowerCase().includes('long') ? 'long' as const : 'short' as const,
    status: 'closed' as const,
    entryPrice: parseNum(row['Entry price'] || row['Avg entry']),
    exitPrice: parseNum(row['Exit price'] || row['Avg exit']),
    quantity: Math.abs(parseNum(row['Quantity'] || row['Qty'])),
    entryTime: parseDate(row['Entry time'] || row['Entry date']),
    exitTime: parseDate(row['Exit time'] || row['Exit date']),
    pnl: parseNum(row['Profit'] || row['P&L']),
    fees: parseNum(row['Commission'] || row['Comm']),
    netPnl: parseNum(row['Net profit'] || row['Profit']),
  }));
}

// ==================== RITHMIC PARSER ====================
export function parseRithmic(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Symbol'] || row['Ticker'] || row['Instrument'] || 'Unknown',
    assetClass: 'futures' as const,
    direction: detectDirection(row),
    status: 'closed' as const,
    entryPrice: parseNum(row['Entry Price'] || row['Avg Fill Price'] || row['Fill Price']),
    exitPrice: parseNum(row['Exit Price'] || row['Close Price']),
    quantity: Math.abs(parseNum(row['Qty'] || row['Quantity'] || row['Size'])),
    entryTime: parseDate(row['Entry Time'] || row['Time'] || row['Date/Time']),
    exitTime: parseDate(row['Exit Time'] || row['Close Time']),
    pnl: parseNum(row['P&L'] || row['PnL'] || row['Realized PnL']),
    fees: parseNum(row['Fees'] || row['Commission']),
    netPnl: parseNum(row['Net P&L'] || row['P&L'] || row['PnL']),
  }));
}

// ==================== THINKORSWIM PARSER ====================
export function parseThinkorSwim(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Symbol'] || row['Underlying'] || row['Instrument'] || 'Unknown',
    assetClass: (row['Type'] || '').toLowerCase().includes('option') ? 'options' as const : 'futures' as const,
    direction: detectDirection(row),
    status: 'closed' as const,
    entryPrice: parseNum(row['Price'] || row['Avg Price']),
    exitPrice: parseNum(row['Close Price']),
    quantity: Math.abs(parseNum(row['Qty'] || row['Quantity'])),
    entryTime: parseDate(row['Exec Time'] || row['Date/Time'] || row['Date']),
    exitTime: parseDate(row['Close Time'] || row['Date']),
    pnl: parseNum(row['P/L'] || row['P&L'] || row['Profit/Loss']),
    fees: parseNum(row['Commissions'] || row['Commission'] || row['Fees']),
    netPnl: parseNum(row['Net P/L'] || row['P/L'] || row['Profit/Loss']),
  }));
}

// ==================== INTERACTIVE BROKERS PARSER ====================
export function parseInteractiveBrokers(data: Record<string, string>[], accountId: string): Trade[] {
  return data.map((row) => ({
    id: generateId(),
    accountId,
    symbol: row['Symbol'] || row['Description'] || 'Unknown',
    assetClass: (row['Asset Class'] || row['Sec Type'] || '').toLowerCase().includes('opt') ? 'options' as const : 'futures' as const,
    direction: detectDirection(row),
    status: 'closed' as const,
    entryPrice: parseNum(row['T. Price'] || row['Trade Price'] || row['Price']),
    exitPrice: parseNum(row['Close Price'] || row['Closing Price']),
    quantity: Math.abs(parseNum(row['Quantity'] || row['Qty'])),
    entryTime: parseDate(row['Date/Time'] || row['TradeDate']),
    exitTime: parseDate(row['Close Date'] || row['Date/Time']),
    pnl: parseNum(row['Realized P/L'] || row['P&L']),
    fees: parseNum(row['Comm/Fee'] || row['Commission']),
    netPnl: parseNum(row['Net Realized P/L'] || row['Realized P/L']),
  }));
}

// ==================== GENERIC PARSER (for prop firms with unknown formats) ====================
export function parseGeneric(data: Record<string, string>[], accountId: string): Trade[] {
  // Try to auto-detect columns
  return data.map((row) => {
    const keys = Object.keys(row);
    
    // Find symbol column
    const symbolKey = keys.find(k => 
      /symbol|instrument|contract|ticker|product/i.test(k)
    );
    
    // Find price columns
    const entryPriceKey = keys.find(k => 
      /entry.*price|open.*price|avg.*entry|fill.*price|price/i.test(k)
    );
    const exitPriceKey = keys.find(k => 
      /exit.*price|close.*price|avg.*exit/i.test(k)
    );
    
    // Find P&L column
    const pnlKey = keys.find(k => 
      /p[&\/]l|pnl|profit|realized|net/i.test(k)
    );
    
    // Find quantity column
    const qtyKey = keys.find(k => 
      /qty|quantity|size|contracts|lots/i.test(k)
    );
    
    // Find time columns
    const entryTimeKey = keys.find(k => 
      /entry.*time|open.*time|date.*time|time|date/i.test(k)
    );
    const exitTimeKey = keys.find(k => 
      /exit.*time|close.*time/i.test(k)
    );
    
    // Find fee column
    const feeKey = keys.find(k => 
      /fee|commission|comm/i.test(k)
    );

    const pnl = parseNum(row[pnlKey || '']);
    const fees = parseNum(row[feeKey || '']);

    return {
      id: generateId(),
      accountId,
      symbol: row[symbolKey || ''] || 'Unknown',
      assetClass: 'futures' as const,
      direction: detectDirection(row),
      status: 'closed' as const,
      entryPrice: parseNum(row[entryPriceKey || '']),
      exitPrice: parseNum(row[exitPriceKey || '']),
      quantity: Math.abs(parseNum(row[qtyKey || ''])) || 1,
      entryTime: parseDate(row[entryTimeKey || '']),
      exitTime: parseDate(row[exitTimeKey || entryTimeKey || '']),
      pnl,
      fees,
      netPnl: fees ? pnl - fees : pnl,
    };
  });
}

// ==================== MAIN PARSER DISPATCHER ====================

export async function parseTradesFromCSV(
  file: File,
  platform: Platform,
  accountId: string
): Promise<{ trades: Trade[]; errors: string[] }> {
  try {
    const { data, errors } = await parseCSV(file);
    
    if (data.length === 0) {
      return { trades: [], errors: ['No data found in CSV file'] };
    }

    let trades: Trade[];

    switch (platform) {
      case 'tradovate':
        trades = parseTradovate(data, accountId);
        break;
      case 'topstepx':
      case 'tradesea':
      case 'apex':
      case 'myfundedfutures':
      case 'bulenox':
      case 'the_trading_pit':
      case 'elite_trader_funding':
      case 'lucid':
      case 'redline_funding':
      case 'alpha_futures':
        // Most prop firms use Tradovate/Rithmic under the hood
        trades = parseGeneric(data, accountId);
        break;
      case 'ninjatrader':
        trades = parseNinjaTrader(data, accountId);
        break;
      case 'rithmic':
      case 'amp_futures':
        trades = parseRithmic(data, accountId);
        break;
      case 'thinkorswim':
        trades = parseThinkorSwim(data, accountId);
        break;
      case 'interactive_brokers':
        trades = parseInteractiveBrokers(data, accountId);
        break;
      case 'tradestation':
      case 'tastytrade':
      default:
        trades = parseGeneric(data, accountId);
        break;
    }

    // Filter out trades with no useful data
    trades = trades.filter(
      (t) => t.symbol !== 'Unknown' || t.pnl !== 0 || t.entryPrice !== 0
    );

    const parseErrors = errors.map((e) => e.message);
    
    return { trades, errors: parseErrors };
  } catch (error) {
    return {
      trades: [],
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

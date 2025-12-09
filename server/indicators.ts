import type { StockPrice, TechnicalIndicators } from "@shared/schema";

export function calculateSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const ema = (prices[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
  }
  return result;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  
  let gains = 0;
  let losses = 0;
  
  for (const change of recentChanges) {
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return rsi;
}

export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(ema12[i]) || isNaN(ema26[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }
  
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalLine = calculateEMA(validMacd, 9);
  
  const macd = validMacd[validMacd.length - 1] || 0;
  const signal = signalLine[signalLine.length - 1] || 0;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

export function calculateIndicators(prices: StockPrice[]): TechnicalIndicators {
  if (prices.length === 0) {
    return {};
  }
  
  const closePrices = prices.map(p => p.close);
  
  const sma20Arr = calculateSMA(closePrices, 20);
  const sma50Arr = calculateSMA(closePrices, 50);
  const sma200Arr = calculateSMA(closePrices, 200);
  const ema12Arr = calculateEMA(closePrices, 12);
  const ema26Arr = calculateEMA(closePrices, 26);
  
  const rsi = calculateRSI(closePrices, 14);
  const macdResult = calculateMACD(closePrices);
  
  return {
    sma20: sma20Arr[sma20Arr.length - 1],
    sma50: sma50Arr[sma50Arr.length - 1],
    sma200: sma200Arr[sma200Arr.length - 1],
    ema12: ema12Arr[ema12Arr.length - 1],
    ema26: ema26Arr[ema26Arr.length - 1],
    rsi,
    macd: macdResult.macd,
    macdSignal: macdResult.signal,
    macdHistogram: macdResult.histogram,
  };
}

export function analyzeStock(
  currentPrice: number,
  indicators: TechnicalIndicators
): {
  trend: 'bullish' | 'bearish' | 'neutral';
  rsiSignal: 'oversold' | 'overbought' | 'neutral';
  macdSignal: 'buy' | 'sell' | 'neutral';
  overallScore: number;
} {
  let score = 50;
  
  // Trend analysis based on moving averages
  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  if (indicators.sma20 && indicators.sma50 && indicators.sma200) {
    if (currentPrice > indicators.sma20 && indicators.sma20 > indicators.sma50) {
      trend = 'bullish';
      score += 15;
    } else if (currentPrice < indicators.sma20 && indicators.sma20 < indicators.sma50) {
      trend = 'bearish';
      score -= 15;
    }
    
    if (currentPrice > indicators.sma200) {
      score += 10;
    } else {
      score -= 10;
    }
  }
  
  // RSI analysis
  let rsiSignal: 'oversold' | 'overbought' | 'neutral' = 'neutral';
  
  if (indicators.rsi !== undefined) {
    if (indicators.rsi < 30) {
      rsiSignal = 'oversold';
      score += 10;
    } else if (indicators.rsi > 70) {
      rsiSignal = 'overbought';
      score -= 10;
    }
  }
  
  // MACD analysis
  let macdSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
  
  if (indicators.macd !== undefined && indicators.macdSignal !== undefined) {
    if (indicators.macd > indicators.macdSignal && indicators.macdHistogram! > 0) {
      macdSignal = 'buy';
      score += 10;
    } else if (indicators.macd < indicators.macdSignal && indicators.macdHistogram! < 0) {
      macdSignal = 'sell';
      score -= 10;
    }
  }
  
  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));
  
  return {
    trend,
    rsiSignal,
    macdSignal,
    overallScore: Math.round(score),
  };
}

export function getSMAArrays(prices: StockPrice[]): {
  sma20: number[];
  sma50: number[];
} {
  const closePrices = prices.map(p => p.close);
  return {
    sma20: calculateSMA(closePrices, 20),
    sma50: calculateSMA(closePrices, 50),
  };
}

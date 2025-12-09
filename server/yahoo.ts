import YahooFinance from "yahoo-finance2";
import type { InsertStock, InsertStockPrice } from "@shared/schema";

const yahooFinance = new YahooFinance();

export async function fetchStockQuote(symbol: string): Promise<{
  stock: InsertStock;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
} | null> {
  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote || !quote.regularMarketPrice) {
      return null;
    }

    const stock: InsertStock = {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      sector: (quote as any).sector || null,
      marketCap: quote.marketCap || null,
      peRatio: quote.trailingPE || null,
      dividendYield: (quote as any).dividendYield || null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || null,
    };

    return {
      stock,
      currentPrice: quote.regularMarketPrice,
      priceChange: quote.regularMarketChange || 0,
      priceChangePercent: quote.regularMarketChangePercent || 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function fetchHistoricalPrices(
  symbol: string,
  stockId: number,
  period: "1mo" | "3mo" | "6mo" | "1y" | "2y" = "1y"
): Promise<InsertStockPrice[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "1mo":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3mo":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6mo":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
    }

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!result || !result.quotes) {
      return [];
    }

    const prices: InsertStockPrice[] = result.quotes
      .filter((q) => q.close !== null && q.open !== null && q.high !== null && q.low !== null)
      .map((q) => ({
        stockId,
        date: new Date(q.date),
        open: q.open!,
        high: q.high!,
        low: q.low!,
        close: q.close!,
        volume: q.volume || null,
      }));

    return prices;
  } catch (error) {
    console.error(`Error fetching historical prices for ${symbol}:`, error);
    return [];
  }
}

export async function fetchMarketIndices(): Promise<
  {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
    previousClose: number;
  }[]
> {
  const indexSymbols = [
    { symbol: "^GSPC", name: "S&P 500" },
    { symbol: "^IXIC", name: "NASDAQ Composite" },
    { symbol: "^DJI", name: "Dow Jones Industrial Average" },
    { symbol: "^RUT", name: "Russell 2000" },
    { symbol: "^VIX", name: "CBOE Volatility Index" },
    { symbol: "^TNX", name: "10-Year Treasury Yield" },
  ];

  const results = await Promise.all(
    indexSymbols.map(async ({ symbol, name }) => {
      try {
        const quote = await yahooFinance.quote(symbol);
        return {
          symbol,
          name,
          value: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          previousClose: quote.regularMarketPreviousClose || 0,
        };
      } catch (error) {
        console.error(`Error fetching index ${symbol}:`, error);
        return {
          symbol,
          name,
          value: 0,
          change: 0,
          changePercent: 0,
          previousClose: 0,
        };
      }
    })
  );

  return results;
}

export function getMarketStatus(): "open" | "closed" | "pre-market" | "after-hours" {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const time = hours * 60 + minutes;

  // Weekend
  if (day === 0 || day === 6) {
    return "closed";
  }

  // Pre-market: 4:00 AM - 9:30 AM ET
  if (time >= 240 && time < 570) {
    return "pre-market";
  }

  // Regular hours: 9:30 AM - 4:00 PM ET
  if (time >= 570 && time < 960) {
    return "open";
  }

  // After hours: 4:00 PM - 8:00 PM ET
  if (time >= 960 && time < 1200) {
    return "after-hours";
  }

  return "closed";
}

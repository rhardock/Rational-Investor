import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchStockQuote, fetchHistoricalPrices, fetchMarketIndices, getMarketStatus } from "./yahoo";
import { calculateIndicators, analyzeStock, getSMAArrays } from "./indicators";
import { insertTransactionSchema, insertWatchlistSchema, insertTradingRuleSchema } from "@shared/schema";
import type { HoldingWithStock, TransactionWithStock, WatchlistItemWithStock, StockAnalysis } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    try {
      const holdings = await storage.getAllHoldings();
      const allStocks = await storage.getAllStocks();
      const allTransactions = await storage.getAllTransactions();

      const holdingsWithStock = await Promise.all(
        holdings.map(async (holding): Promise<HoldingWithStock | null> => {
          const stock = allStocks.find(s => s.id === holding.stockId);
          if (!stock) return null;
          
          const latestPrice = await storage.getLatestPrice(holding.stockId);
          // Try to get live quote if no stored price
          let currentPrice = latestPrice?.close;
          if (currentPrice === null || currentPrice === undefined) {
            const quote = await fetchStockQuote(stock.symbol).catch(() => null);
            currentPrice = quote?.currentPrice || holding.averageCost;
          }
          
          const totalValue = holding.shares * currentPrice;
          const totalCost = holding.shares * holding.averageCost;
          const gainLoss = totalValue - totalCost;
          const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

          return {
            ...holding,
            stock: stock,
            currentPrice: currentPrice || 0,
            totalValue: isNaN(totalValue) ? 0 : totalValue,
            gainLoss: isNaN(gainLoss) ? 0 : gainLoss,
            gainLossPercent: isNaN(gainLossPercent) ? 0 : gainLossPercent,
          };
        })
      );
      
      // Filter out null entries
      const validHoldings = holdingsWithStock.filter((h): h is HoldingWithStock => h !== null);

      const totalValue = validHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
      const totalCost = validHoldings.reduce((sum, h) => sum + h.shares * h.averageCost, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      const recentTransactions: TransactionWithStock[] = allTransactions
        .slice(0, 5)
        .map(tx => ({
          ...tx,
          stock: allStocks.find(s => s.id === tx.stockId)!,
        }))
        .filter(tx => tx.stock);

      // Fetch market indices
      let indices: any[] = [];
      try {
        indices = await fetchMarketIndices();
      } catch (e) {
        console.error("Failed to fetch indices:", e);
      }

      res.json({
        totalValue: isNaN(totalValue) ? 0 : totalValue,
        totalCost: isNaN(totalCost) ? 0 : totalCost,
        totalGainLoss: isNaN(totalGainLoss) ? 0 : totalGainLoss,
        totalGainLossPercent: isNaN(totalGainLossPercent) ? 0 : totalGainLossPercent,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: validHoldings.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0)),
        recentTransactions,
        indices,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard data" });
    }
  });

  // Stocks
  app.get("/api/stocks", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stocks" });
    }
  });

  app.post("/api/stocks", async (req, res) => {
    try {
      const { symbol } = req.body;
      if (!symbol) {
        return res.status(400).json({ error: "Symbol is required" });
      }

      // Check if already exists
      const existing = await storage.getStockBySymbol(symbol);
      if (existing) {
        return res.json(existing);
      }

      // Fetch from Yahoo Finance
      const quote = await fetchStockQuote(symbol);
      if (!quote) {
        return res.status(404).json({ error: "Stock not found" });
      }

      const stock = await storage.createStock(quote.stock);

      // Fetch historical prices in background
      fetchHistoricalPrices(symbol, stock.id, "1y").then(async (prices) => {
        if (prices.length > 0) {
          await storage.createStockPrices(prices);
        }
      });

      res.json(stock);
    } catch (error) {
      console.error("Error adding stock:", error);
      res.status(500).json({ error: "Failed to add stock" });
    }
  });

  app.post("/api/stocks/refresh", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();

      for (const stock of stocks) {
        const quote = await fetchStockQuote(stock.symbol);
        if (quote) {
          await storage.updateStock(stock.id, {
            ...quote.stock,
          });

          // Fetch latest prices
          const prices = await fetchHistoricalPrices(stock.symbol, stock.id, "1mo");
          if (prices.length > 0) {
            await storage.createStockPrices(prices);
          }
        }
      }

      res.json({ success: true, updated: stocks.length });
    } catch (error) {
      console.error("Error refreshing stocks:", error);
      res.status(500).json({ error: "Failed to refresh stocks" });
    }
  });

  // Get stock price for a specific date (or latest if no date)
  app.get("/api/stocks/:id/price", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dateStr = req.query.date as string | undefined; // expected YYYY-MM-DD

      // Validate stock
      const stock = await storage.getStock(id);
      if (!stock) return res.status(404).json({ error: "Stock not found" });

      // If no date provided, return latest stored price or live quote
      if (!dateStr) {
        const latest = await storage.getLatestPrice(id);
        if (latest) return res.json({ date: latest.date.toISOString(), close: latest.close });

        const quote = await fetchStockQuote(stock.symbol).catch(() => null);
        if (quote) return res.json({ date: new Date().toISOString(), close: quote.currentPrice });

        return res.status(404).json({ error: "No price available" });
      }

      // Find stored price for given date (or the most recent prior)
      const targetDate = new Date(dateStr);
      const prices = await storage.getStockPrices(id, 1000);

      // Normalize dates to YYYY-MM-DD for comparison
      const targetKey = dateStr;
      let exact = prices.find((p) => p.date.toISOString().slice(0, 10) === targetKey);
      if (exact) return res.json({ date: exact.date.toISOString(), close: exact.close });

      // If not exact, find the closest prior date (max date <= target)
      let prior = prices
        .filter((p) => new Date(p.date) <= targetDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (prior) return res.json({ date: prior.date.toISOString(), close: prior.close });

      // Fallback: try live quote -- do not fall back... error on no data for older dates
      // const quote = await fetchStockQuote(stock.symbol).catch(() => null);
      // if (quote) return res.json({ date: new Date().toISOString(), close: quote.currentPrice });

      return res.status(404).json({ error: "No price available for the requested date" });
    } catch (error) {
      console.error("Error fetching price by date:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  // Portfolio
  app.get("/api/portfolio", async (req, res) => {
    try {
      const holdings = await storage.getAllHoldings();
      const allStocks = await storage.getAllStocks();

      const holdingsWithStock: (HoldingWithStock | null)[] = await Promise.all(
        holdings.map(async (holding) => {
          const stock = allStocks.find(s => s.id === holding.stockId);
          if (!stock) return null;
          
          const latestPrice = await storage.getLatestPrice(holding.stockId);
          let currentPrice = latestPrice?.close;
          if (currentPrice === null || currentPrice === undefined) {
            const quote = await fetchStockQuote(stock.symbol).catch(() => null);
            currentPrice = quote?.currentPrice || holding.averageCost;
          }
          
          const totalValue = holding.shares * currentPrice;
          const totalCost = holding.shares * holding.averageCost;
          const gainLoss = totalValue - totalCost;
          const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

          return {
            ...holding,
            stock: stock,
            currentPrice: currentPrice || 0,
            totalValue: isNaN(totalValue) ? 0 : totalValue,
            gainLoss: isNaN(gainLoss) ? 0 : gainLoss,
            gainLossPercent: isNaN(gainLossPercent) ? 0 : gainLossPercent,
          };
        })
      );

      const validHoldings = holdingsWithStock.filter((h): h is HoldingWithStock => h !== null);
      const totalValue = validHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0);
      const totalCost = validHoldings.reduce((sum, h) => sum + h.shares * h.averageCost, 0);
      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      res.json({
        holdings: validHoldings,
        totalValue: isNaN(totalValue) ? 0 : totalValue,
        totalCost: isNaN(totalCost) ? 0 : totalCost,
        totalGainLoss: isNaN(totalGainLoss) ? 0 : totalGainLoss,
        totalGainLossPercent: isNaN(totalGainLossPercent) ? 0 : totalGainLossPercent,
      });
    } catch (error) {
      console.error("Portfolio error:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  app.delete("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteHolding(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete holding" });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      const stocks = await storage.getAllStocks();

      const transactionsWithStock: TransactionWithStock[] = transactions
        .map(tx => ({
          ...tx,
          stock: stocks.find(s => s.id === tx.stockId)!,
        }))
        .filter(tx => tx.stock);

      res.json(transactionsWithStock);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const data = {
        ...req.body,
        date: new Date(req.body.date),
      };

      const transaction = await storage.createTransaction(data);

      // Update portfolio holding
      const existingHolding = await storage.getHoldingByStock(data.stockId);

      if (data.type === "buy") {
        if (existingHolding) {
          const newTotalShares = existingHolding.shares + data.shares;
          const newTotalCost = existingHolding.shares * existingHolding.averageCost + data.shares * data.price;
          const newAverageCost = newTotalCost / newTotalShares;

          await storage.updateHolding(existingHolding.id, {
            shares: newTotalShares,
            averageCost: newAverageCost,
          });
        } else {
          await storage.createHolding({
            stockId: data.stockId,
            shares: data.shares,
            averageCost: data.price,
            targetPrice: null,
            stopLoss: null,
            notes: null,
          });
        }
      } else if (data.type === "sell" && existingHolding) {
        const newShares = existingHolding.shares - data.shares;
        if (newShares <= 0) {
          await storage.deleteHolding(existingHolding.id);
        } else {
          await storage.updateHolding(existingHolding.id, {
            shares: newShares,
          });
        }
      }

      res.json(transaction);
    } catch (error) {
      console.error("Transaction error:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Watchlist
  app.get("/api/watchlist", async (req, res) => {
    try {
      const items = await storage.getAllWatchlistItems();
      const stocks = await storage.getAllStocks();

      const itemsWithStock: WatchlistItemWithStock[] = await Promise.all(
        items.map(async (item) => {
          const stock = stocks.find(s => s.id === item.stockId);
          const latestPrice = await storage.getLatestPrice(item.stockId);
          const quote = stock ? await fetchStockQuote(stock.symbol).catch(() => null) : null;

          return {
            ...item,
            stock: {
              ...stock!,
              currentPrice: latestPrice?.close || quote?.currentPrice || 0,
              priceChange: quote?.priceChange || 0,
              priceChangePercent: quote?.priceChangePercent || 0,
            },
          };
        })
      );

      res.json(itemsWithStock.filter(i => i.stock && i.stock.id));
    } catch (error) {
      console.error("Watchlist error:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const { stockId, targetBuyPrice, notes } = req.body;

      // Check if already in watchlist
      const existing = await storage.getWatchlistByStock(stockId);
      if (existing) {
        return res.status(400).json({ error: "Stock already in watchlist" });
      }

      const item = await storage.createWatchlistItem({
        stockId,
        targetBuyPrice: targetBuyPrice || null,
        notes: notes || null,
        alertEnabled: false,
      });

      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  app.patch("/api/watchlist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateWatchlistItem(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update watchlist item" });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWatchlistItem(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete watchlist item" });
    }
  });

  // Analysis
  app.get("/api/analysis/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;

      // Get or create stock
      let stock = await storage.getStockBySymbol(symbol);
      let quote;

      if (!stock) {
        quote = await fetchStockQuote(symbol);
        if (!quote) {
          return res.status(404).json({ error: "Stock not found" });
        }
        stock = await storage.createStock(quote.stock);

        // Fetch historical prices
        const prices = await fetchHistoricalPrices(symbol, stock.id, "1y");
        if (prices.length > 0) {
          await storage.createStockPrices(prices);
        }
      } else {
        quote = await fetchStockQuote(symbol);
      }

      // Get price history
      let prices = await storage.getStockPrices(stock.id, 365);

      if (prices.length === 0) {
        const fetchedPrices = await fetchHistoricalPrices(symbol, stock.id, "1y");
        if (fetchedPrices.length > 0) {
          await storage.createStockPrices(fetchedPrices);
          prices = await storage.getStockPrices(stock.id, 365);
        }
      }

      // Reverse to chronological order for calculations
      const chronologicalPrices = [...prices].reverse();

      // Calculate indicators
      const indicators = calculateIndicators(chronologicalPrices);
      const currentPrice = quote?.currentPrice || prices[0]?.close || 0;
      const signals = analyzeStock(currentPrice, indicators);
      const smaArrays = getSMAArrays(chronologicalPrices);

      const analysis: StockAnalysis = {
        ...stock,
        currentPrice,
        priceChange: quote?.priceChange || 0,
        priceChangePercent: quote?.priceChangePercent || 0,
        indicators,
        signals,
      };

      res.json({
        stock: analysis,
        prices: chronologicalPrices,
        sma20: smaArrays.sma20,
        sma50: smaArrays.sma50,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze stock" });
    }
  });

  // Market
  app.get("/api/market", async (req, res) => {
    try {
      const indices = await fetchMarketIndices();
      const marketStatus = getMarketStatus();

      res.json({
        indices,
        lastUpdated: new Date().toISOString(),
        marketStatus,
      });
    } catch (error) {
      console.error("Market error:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Trading Rules
  app.get("/api/trading-rules", async (req, res) => {
    try {
      const rules = await storage.getAllTradingRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading rules" });
    }
  });

  app.post("/api/trading-rules", async (req, res) => {
    try {
      const rule = await storage.createTradingRule(req.body);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: "Failed to create trading rule" });
    }
  });

  app.patch("/api/trading-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTradingRule(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update trading rule" });
    }
  });

  app.delete("/api/trading-rules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTradingRule(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trading rule" });
    }
  });

  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Clear all data
  app.delete("/api/data/all", async (req, res) => {
    try {
      await storage.clearAllData();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear data" });
    }
  });

  return httpServer;
}

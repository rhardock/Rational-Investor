import {
  users,
  stocks,
  stockPrices,
  portfolioHoldings,
  transactions,
  watchlist,
  tradingRules,
  type User,
  type InsertUser,
  type Stock,
  type InsertStock,
  type StockPrice,
  type InsertStockPrice,
  type PortfolioHolding,
  type InsertPortfolioHolding,
  type Transaction,
  type InsertTransaction,
  type WatchlistItem,
  type InsertWatchlist,
  type TradingRule,
  type InsertTradingRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Stocks
  getAllStocks(): Promise<Stock[]>;
  getStock(id: number): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock): Promise<Stock>;
  updateStock(id: number, stock: Partial<InsertStock>): Promise<Stock | undefined>;
  deleteStock(id: number): Promise<void>;

  // Stock Prices
  getStockPrices(stockId: number, limit?: number): Promise<StockPrice[]>;
  getLatestPrice(stockId: number): Promise<StockPrice | undefined>;
  createStockPrice(price: InsertStockPrice): Promise<StockPrice>;
  createStockPrices(prices: InsertStockPrice[]): Promise<void>;

  // Portfolio Holdings
  getAllHoldings(): Promise<PortfolioHolding[]>;
  getHolding(id: number): Promise<PortfolioHolding | undefined>;
  getHoldingByStock(stockId: number): Promise<PortfolioHolding | undefined>;
  createHolding(holding: InsertPortfolioHolding): Promise<PortfolioHolding>;
  updateHolding(id: number, holding: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding | undefined>;
  deleteHolding(id: number): Promise<void>;

  // Transactions
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByStock(stockId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Watchlist
  getAllWatchlistItems(): Promise<WatchlistItem[]>;
  getWatchlistItem(id: number): Promise<WatchlistItem | undefined>;
  getWatchlistByStock(stockId: number): Promise<WatchlistItem | undefined>;
  createWatchlistItem(item: InsertWatchlist): Promise<WatchlistItem>;
  updateWatchlistItem(id: number, item: Partial<InsertWatchlist>): Promise<WatchlistItem | undefined>;
  deleteWatchlistItem(id: number): Promise<void>;

  // Trading Rules
  getAllTradingRules(): Promise<TradingRule[]>;
  getTradingRule(id: number): Promise<TradingRule | undefined>;
  createTradingRule(rule: InsertTradingRule): Promise<TradingRule>;
  updateTradingRule(id: number, rule: Partial<InsertTradingRule>): Promise<TradingRule | undefined>;
  deleteTradingRule(id: number): Promise<void>;

  // Stats
  getStats(): Promise<{
    totalStocks: number;
    totalPricePoints: number;
    totalTransactions: number;
    lastSync: string | null;
  }>;

  // Clear all data
  clearAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Stocks
  async getAllStocks(): Promise<Stock[]> {
    return db.select().from(stocks);
  }

  async getStock(id: number): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.id, id));
    return stock || undefined;
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    const [stock] = await db.select().from(stocks).where(eq(stocks.symbol, symbol.toUpperCase()));
    return stock || undefined;
  }

  async createStock(stock: InsertStock): Promise<Stock> {
    const [newStock] = await db.insert(stocks).values(stock).returning();
    return newStock;
  }

  async updateStock(id: number, stock: Partial<InsertStock>): Promise<Stock | undefined> {
    const [updated] = await db.update(stocks).set(stock).where(eq(stocks.id, id)).returning();
    return updated || undefined;
  }

  async deleteStock(id: number): Promise<void> {
    await db.delete(stocks).where(eq(stocks.id, id));
  }

  // Stock Prices
  async getStockPrices(stockId: number, limit: number = 365): Promise<StockPrice[]> {
    return db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.stockId, stockId))
      .orderBy(desc(stockPrices.date))
      .limit(limit);
  }

  async getLatestPrice(stockId: number): Promise<StockPrice | undefined> {
    const [price] = await db
      .select()
      .from(stockPrices)
      .where(eq(stockPrices.stockId, stockId))
      .orderBy(desc(stockPrices.date))
      .limit(1);
    return price || undefined;
  }

  async createStockPrice(price: InsertStockPrice): Promise<StockPrice> {
    const [newPrice] = await db.insert(stockPrices).values(price).returning();
    return newPrice;
  }

  async createStockPrices(prices: InsertStockPrice[]): Promise<void> {
    if (prices.length === 0) return;
    await db.insert(stockPrices).values(prices).onConflictDoNothing();
  }

  // Portfolio Holdings
  async getAllHoldings(): Promise<PortfolioHolding[]> {
    return db.select().from(portfolioHoldings);
  }

  async getHolding(id: number): Promise<PortfolioHolding | undefined> {
    const [holding] = await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.id, id));
    return holding || undefined;
  }

  async getHoldingByStock(stockId: number): Promise<PortfolioHolding | undefined> {
    const [holding] = await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.stockId, stockId));
    return holding || undefined;
  }

  async createHolding(holding: InsertPortfolioHolding): Promise<PortfolioHolding> {
    const [newHolding] = await db.insert(portfolioHoldings).values(holding).returning();
    return newHolding;
  }

  async updateHolding(id: number, holding: Partial<InsertPortfolioHolding>): Promise<PortfolioHolding | undefined> {
    const [updated] = await db.update(portfolioHoldings).set(holding).where(eq(portfolioHoldings.id, id)).returning();
    return updated || undefined;
  }

  async deleteHolding(id: number): Promise<void> {
    await db.delete(portfolioHoldings).where(eq(portfolioHoldings.id, id));
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByStock(stockId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.stockId, stockId)).orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  // Watchlist
  async getAllWatchlistItems(): Promise<WatchlistItem[]> {
    return db.select().from(watchlist);
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    const [item] = await db.select().from(watchlist).where(eq(watchlist.id, id));
    return item || undefined;
  }

  async getWatchlistByStock(stockId: number): Promise<WatchlistItem | undefined> {
    const [item] = await db.select().from(watchlist).where(eq(watchlist.stockId, stockId));
    return item || undefined;
  }

  async createWatchlistItem(item: InsertWatchlist): Promise<WatchlistItem> {
    const [newItem] = await db.insert(watchlist).values(item).returning();
    return newItem;
  }

  async updateWatchlistItem(id: number, item: Partial<InsertWatchlist>): Promise<WatchlistItem | undefined> {
    const [updated] = await db.update(watchlist).set(item).where(eq(watchlist.id, id)).returning();
    return updated || undefined;
  }

  async deleteWatchlistItem(id: number): Promise<void> {
    await db.delete(watchlist).where(eq(watchlist.id, id));
  }

  // Trading Rules
  async getAllTradingRules(): Promise<TradingRule[]> {
    return db.select().from(tradingRules);
  }

  async getTradingRule(id: number): Promise<TradingRule | undefined> {
    const [rule] = await db.select().from(tradingRules).where(eq(tradingRules.id, id));
    return rule || undefined;
  }

  async createTradingRule(rule: InsertTradingRule): Promise<TradingRule> {
    const [newRule] = await db.insert(tradingRules).values(rule).returning();
    return newRule;
  }

  async updateTradingRule(id: number, rule: Partial<InsertTradingRule>): Promise<TradingRule | undefined> {
    const [updated] = await db.update(tradingRules).set(rule).where(eq(tradingRules.id, id)).returning();
    return updated || undefined;
  }

  async deleteTradingRule(id: number): Promise<void> {
    await db.delete(tradingRules).where(eq(tradingRules.id, id));
  }

  // Stats
  async getStats(): Promise<{
    totalStocks: number;
    totalPricePoints: number;
    totalTransactions: number;
    lastSync: string | null;
  }> {
    const [stockCount] = await db.select({ count: sql<number>`count(*)` }).from(stocks);
    const [priceCount] = await db.select({ count: sql<number>`count(*)` }).from(stockPrices);
    const [txCount] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const [lastStock] = await db.select({ lastUpdated: stocks.lastUpdated }).from(stocks).orderBy(desc(stocks.lastUpdated)).limit(1);

    return {
      totalStocks: Number(stockCount?.count || 0),
      totalPricePoints: Number(priceCount?.count || 0),
      totalTransactions: Number(txCount?.count || 0),
      lastSync: lastStock?.lastUpdated?.toISOString() || null,
    };
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await db.delete(watchlist);
    await db.delete(transactions);
    await db.delete(portfolioHoldings);
    await db.delete(stockPrices);
    await db.delete(tradingRules);
    await db.delete(stocks);
  }
}

export const storage = new DatabaseStorage();

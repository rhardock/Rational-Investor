import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Stocks table - master list of tracked stocks
export const stocks = pgTable("stocks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector"),
  marketCap: real("market_cap"),
  peRatio: real("pe_ratio"),
  dividendYield: real("dividend_yield"),
  fiftyTwoWeekHigh: real("fifty_two_week_high"),
  fiftyTwoWeekLow: real("fifty_two_week_low"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Stock prices - historical price data
export const stockPrices = pgTable("stock_prices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: integer("volume"),
});

// Portfolio holdings - stocks currently owned
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  shares: real("shares").notNull(),
  averageCost: real("average_cost").notNull(),
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  notes: text("notes"),
});

// Transactions - buy/sell history
export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'buy' or 'sell'
  shares: real("shares").notNull(),
  price: real("price").notNull(),
  fees: real("fees").default(0),
  date: timestamp("date").notNull(),
  notes: text("notes"),
});

// Watchlist - stocks to monitor
export const watchlist = pgTable("watchlist", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stockId: integer("stock_id").notNull().references(() => stocks.id, { onDelete: "cascade" }),
  targetBuyPrice: real("target_buy_price"),
  notes: text("notes"),
  alertEnabled: boolean("alert_enabled").default(false),
});

// Trading rules - criteria for buy/sell decisions
export const tradingRules = pgTable("trading_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  ruleType: text("rule_type").notNull(), // 'entry', 'exit', 'position_size'
  condition: text("condition").notNull(),
  value: real("value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

// Relations
export const stocksRelations = relations(stocks, ({ many }) => ({
  prices: many(stockPrices),
  holdings: many(portfolioHoldings),
  transactions: many(transactions),
  watchlistItems: many(watchlist),
}));

export const stockPricesRelations = relations(stockPrices, ({ one }) => ({
  stock: one(stocks, {
    fields: [stockPrices.stockId],
    references: [stocks.id],
  }),
}));

export const portfolioHoldingsRelations = relations(portfolioHoldings, ({ one }) => ({
  stock: one(stocks, {
    fields: [portfolioHoldings.stockId],
    references: [stocks.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  stock: one(stocks, {
    fields: [transactions.stockId],
    references: [stocks.id],
  }),
}));

export const watchlistRelations = relations(watchlist, ({ one }) => ({
  stock: one(stocks, {
    fields: [watchlist.stockId],
    references: [stocks.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
  lastUpdated: true,
});

export const insertStockPriceSchema = createInsertSchema(stockPrices).omit({
  id: true,
});

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
});

export const insertTradingRuleSchema = createInsertSchema(tradingRules).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;

export type InsertStockPrice = z.infer<typeof insertStockPriceSchema>;
export type StockPrice = typeof stockPrices.$inferSelect;

export type InsertPortfolioHolding = z.infer<typeof insertPortfolioHoldingSchema>;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type WatchlistItem = typeof watchlist.$inferSelect;

export type InsertTradingRule = z.infer<typeof insertTradingRuleSchema>;
export type TradingRule = typeof tradingRules.$inferSelect;

// Extended types for frontend
export type StockWithPrice = Stock & {
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
};

export type HoldingWithStock = PortfolioHolding & {
  stock: Stock;
  currentPrice?: number;
  totalValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
};

export type TransactionWithStock = Transaction & {
  stock: Stock;
};

export type WatchlistItemWithStock = WatchlistItem & {
  stock: StockWithPrice;
};

// Technical indicator types
export type TechnicalIndicators = {
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema12?: number;
  ema26?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
};

export type StockAnalysis = StockWithPrice & {
  indicators: TechnicalIndicators;
  signals: {
    trend: 'bullish' | 'bearish' | 'neutral';
    rsiSignal: 'oversold' | 'overbought' | 'neutral';
    macdSignal: 'buy' | 'sell' | 'neutral';
    overallScore: number; // 0-100
  };
};

// Position sizing types
export type PositionSizeCalc = {
  portfolioValue: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  recommendedShares: number;
  maxInvestment: number;
  riskAmount: number;
};

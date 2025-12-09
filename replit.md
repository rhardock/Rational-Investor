# Rational Investor - Stock Portfolio Management

## Overview
Rational Investor is a comprehensive stock investing application that tracks stock prices, calculates technical indicators, manages portfolio holdings with performance analytics, and provides buy/sell recommendations based on technical analysis.

## Current State
The application is fully functional with:
- Real-time stock data from Yahoo Finance
- Technical analysis (SMA, EMA, RSI calculations)
- Portfolio tracking with buy/sell transaction management
- Market overview with major indices
- Position size calculator with risk management
- Watchlist functionality
- Dark mode support

## Project Architecture

### Frontend (client/src)
- **App.tsx** - Main app with Shadcn sidebar navigation and routing
- **pages/** - Dashboard, Portfolio, Analysis, Watchlist, Market, Calculator, Settings
- **components/** - Reusable UI components (stock charts, metric cards, forms, sidebar)
- **lib/** - Query client configuration and utilities

### Backend (server/)
- **routes.ts** - API endpoints for all features
- **storage.ts** - DatabaseStorage with PostgreSQL via Drizzle ORM
- **yahoo.ts** - Yahoo Finance v3 integration for live market data
- **indicators.ts** - Technical analysis calculations (SMA, EMA, RSI)
- **db.ts** - Database connection pool

### Shared (shared/)
- **schema.ts** - Drizzle schema definitions and TypeScript types

## Database Schema
- **stocks** - Stock metadata (symbol, name, sector, market cap, etc.)
- **stock_prices** - Historical OHLCV price data
- **portfolio_holdings** - Current positions with average cost
- **transactions** - Buy/sell transaction history
- **watchlist** - Stocks being monitored
- **trading_rules** - Risk management rules

## Key Features
1. **Dashboard** - Portfolio summary with market indices, holdings, and recent transactions
2. **Portfolio** - Detailed position management with gain/loss tracking
3. **Stock Analysis** - Technical indicators and buy/sell recommendations
4. **Watchlist** - Track stocks for potential investment
5. **Market Overview** - Major indices (S&P 500, NASDAQ, DOW, Russell, VIX, 10Y Treasury)
6. **Risk Calculator** - Position sizing based on risk tolerance
7. **Settings** - Trading rules and preferences

## Recent Changes
- 2024-12-09: Fixed Yahoo Finance v3 initialization for newer library version
- 2024-12-09: Added defensive handling for null price data to prevent NaN calculations
- 2024-12-09: Auto-creation of stock metadata when analyzing new symbols

## User Preferences
- Dark mode supported via theme toggle
- Financial professional aesthetic with Inter font
- JetBrains Mono for numeric displays

## Running the Application
The app runs via `npm run dev` which starts:
- Express backend on port 5000
- Vite frontend development server

## Environment Variables
- DATABASE_URL - PostgreSQL connection string (auto-configured)
- SESSION_SECRET - Session encryption key

# Rational Investor - Design Guidelines

## Design Approach

**System**: Hybrid approach drawing from Material Design principles + inspiration from leading financial platforms (Robinhood's clarity, Bloomberg's data density, Interactive Brokers' functionality)

**Rationale**: Financial tools prioritize data comprehension, trust, and efficiency. Users need to quickly scan metrics, analyze charts, and make informed decisions without visual distractions.

## Typography

**Font Families**:
- Primary (UI/Data): Inter or Roboto (Google Fonts CDN)
- Monospace (Numbers/Prices): JetBrains Mono or Roboto Mono

**Hierarchy**:
- Page titles: text-3xl font-bold
- Section headings: text-xl font-semibold
- Card titles: text-lg font-medium
- Body text: text-base font-normal
- Data labels: text-sm font-medium
- Metrics/prices: text-2xl font-bold (monospace)
- Small data: text-xs

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Page margins: Container max-w-7xl with px-4 md:px-8

**Grid Structure**:
- Dashboard overview: 3-4 column grid (lg:grid-cols-4 md:grid-cols-2)
- Portfolio table: Full-width responsive table
- Stock analysis: 2-column split (chart + metrics sidebar)
- Market overview: 3-column grid for major indices

## Component Library

### Navigation
- Persistent sidebar (w-64) with collapsible option on mobile
- Nav items with icon + label, active state indicator
- Main sections: Dashboard, Portfolio, Analysis, Watchlist, Market Overview

### Dashboard Cards
- Elevation: border with subtle shadow
- Structure: Header with title/action, content area, optional footer
- Metric cards: Large number display, label, percentage change indicator (up/down arrow)
- Compact stat rows for secondary metrics

### Data Tables
- Sticky headers for scrollable content
- Sortable columns (with sort indicator icons)
- Row hover states for clarity
- Alternating row treatment for readability
- Right-aligned numeric columns
- Action buttons in final column

### Charts
- Use Chart.js or Recharts library
- Candlestick charts for price history
- Line charts for moving averages overlay
- Area charts for portfolio value over time
- Minimum height: h-64, responsive scaling

### Forms & Inputs
- Transaction entry: Grid layout (2-column on desktop)
- Input groups: Label above, helper text below
- Number inputs with step controls for shares/price
- Date pickers for buy/sell dates
- Validation feedback inline

### Buttons
- Primary actions: Solid fill, medium size (px-6 py-2.5)
- Secondary: Outline variant
- Danger/sell actions: Distinct treatment
- Icon buttons for table actions (square, p-2)

### Portfolio Holdings Display
- Card-based layout with stock ticker prominent
- Each holding shows: ticker, shares, avg cost, current price, total value, gain/loss %
- Visual indicator for positive/negative performance
- Quick action buttons (Sell, View Analysis)

### Risk Assessment Panel
- Position sizing calculator
- Input: Portfolio value, risk %, stop-loss distance
- Output: Recommended shares, max investment amount
- Warning indicators for oversized positions

### Market Overview
- 3 major index cards (S&P 500, NASDAQ, DOW)
- Each shows: current value, change, % change, mini trend chart
- Trend indicators (simple up/down with context)

### Stock Analysis View
- Main chart area (2/3 width)
- Metrics sidebar (1/3 width): Current price, volume, P/E ratio, market cap, 52-week range
- Technical indicators below chart: Moving averages table, RSI gauge
- Buy/sell recommendation based on rules

### Watchlist
- Compact card grid or list view toggle
- Each item: Ticker, current price, change %, mini sparkline
- Quick "Add to Portfolio" action

## Icons
**Library**: Heroicons (via CDN)
- Use outline variants for navigation
- Solid variants for status indicators
- Financial icons: trending-up, trending-down, chart-bar, currency-dollar

## Responsive Behavior
- Desktop (lg+): Full sidebar, multi-column dashboards
- Tablet (md): Collapsible sidebar, 2-column grids
- Mobile: Bottom navigation or hamburger menu, single column stacks, horizontally scrollable tables

## Data Visualization Principles
- Emphasize readability over decoration
- Use consistent scale across related charts
- Clear axis labels and legends
- Tooltips on hover for detailed data points
- Performance indicators use directional cues (arrows) alongside numbers

## Animations
Minimal use only where enhancing comprehension:
- Smooth transitions for sidebar collapse/expand
- Fade-in for loading states
- Number count-up for dramatic metric changes (subtle, fast)

This design creates a professional, data-focused application that prioritizes clarity, efficiency, and informed decision-making over visual flourishes.
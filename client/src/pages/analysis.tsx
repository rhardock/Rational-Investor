import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "wouter";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Minus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { StockChart } from "@/components/stock-chart";
import { cn } from "@/lib/utils";
import type { StockAnalysis, StockPrice } from "@shared/schema";

interface AnalysisData {
  stock: StockAnalysis;
  prices: StockPrice[];
  sma20: number[];
  sma50: number[];
}

export default function Analysis() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialSymbol = params.get("symbol") || "";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchSymbol, setSearchSymbol] = useState(initialSymbol);

  const { data: analysis, isLoading, error, refetch, isFetching } = useQuery<AnalysisData>({
    queryKey: ["/api/analysis", searchSymbol],
    enabled: !!searchSymbol,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      setSearchSymbol(symbol.trim().toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Analysis</h1>
        <p className="text-muted-foreground">
          Analyze stocks with technical indicators and signals
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="pl-9"
                data-testid="input-analysis-symbol"
              />
            </div>
            <Button type="submit" data-testid="button-analyze">
              Analyze
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && <AnalysisSkeleton />}

      {error && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-70" />
            <h3 className="text-lg font-medium mb-2">Stock Not Found</h3>
            <p className="text-muted-foreground">
              Could not find data for "{searchSymbol}". Please check the symbol and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {analysis && !isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-2xl">{analysis.stock.symbol}</CardTitle>
                  <CardDescription className="text-base">
                    {analysis.stock.name}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <p className="text-3xl font-bold font-mono">
                      ${(analysis.stock.currentPrice || 0).toFixed(2)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => refetch?.()}
                          aria-label="Refresh price"
                          disabled={!!isFetching}
                          data-testid="button-refresh-price"
                        >
                          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Refresh price</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {(analysis.stock.priceChangePercent || 0) >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-chart-2" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={cn(
                        "font-mono font-medium",
                        (analysis.stock.priceChangePercent || 0) >= 0
                          ? "text-chart-2"
                          : "text-destructive"
                      )}
                    >
                      {(analysis.stock.priceChange || 0) >= 0 ? "+" : ""}
                      {(analysis.stock.priceChange || 0).toFixed(2)} (
                      {(analysis.stock.priceChangePercent || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {analysis.prices && analysis.prices.length > 0 && (
              <StockChart
                prices={analysis.prices}
                title="Price History with Moving Averages"
                showMA
                sma20={analysis.sma20}
                sma50={analysis.sma50}
              />
            )}

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SMA 20</p>
                    <p className="text-lg font-mono font-semibold">
                      ${analysis.stock.indicators.sma20?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SMA 50</p>
                    <p className="text-lg font-mono font-semibold">
                      ${analysis.stock.indicators.sma50?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SMA 200</p>
                    <p className="text-lg font-mono font-semibold">
                      ${analysis.stock.indicators.sma200?.toFixed(2) || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">RSI (14)</p>
                    <p className="text-lg font-mono font-semibold">
                      {analysis.stock.indicators.rsi?.toFixed(1) || "N/A"}
                    </p>
                  </div>
                </div>

                {analysis.stock.indicators.rsi !== undefined && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">RSI Level</span>
                      <Badge
                        variant={
                          analysis.stock.signals.rsiSignal === "oversold"
                            ? "default"
                            : analysis.stock.signals.rsiSignal === "overbought"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {analysis.stock.signals.rsiSignal}
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="w-[30%] bg-chart-2/30" />
                        <div className="w-[40%] bg-muted" />
                        <div className="w-[30%] bg-destructive/30" />
                      </div>
                      <div
                        className="absolute top-0 h-full w-1 bg-foreground rounded"
                        style={{ left: `${analysis.stock.indicators.rsi}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0 (Oversold)</span>
                      <span>50 (Neutral)</span>
                      <span>100 (Overbought)</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Analysis Score
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(analysis.stock.signals.overallScore / 100) * 352} 352`}
                        className={cn(
                          analysis.stock.signals.overallScore >= 70
                            ? "text-chart-2"
                            : analysis.stock.signals.overallScore >= 40
                            ? "text-chart-4"
                            : "text-destructive"
                        )}
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold font-mono">
                      {analysis.stock.signals.overallScore}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {analysis.stock.signals.overallScore >= 70
                      ? "Strong Buy Signal"
                      : analysis.stock.signals.overallScore >= 50
                      ? "Moderate Buy Signal"
                      : analysis.stock.signals.overallScore >= 40
                      ? "Hold / Neutral"
                      : "Caution Advised"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trend</span>
                    <div className="flex items-center gap-2">
                      {analysis.stock.signals.trend === "bullish" ? (
                        <TrendingUp className="h-4 w-4 text-chart-2" />
                      ) : analysis.stock.signals.trend === "bearish" ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge
                        variant={
                          analysis.stock.signals.trend === "bullish"
                            ? "default"
                            : analysis.stock.signals.trend === "bearish"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {analysis.stock.signals.trend}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RSI Signal</span>
                    <Badge
                      variant={
                        analysis.stock.signals.rsiSignal === "oversold"
                          ? "default"
                          : analysis.stock.signals.rsiSignal === "overbought"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {analysis.stock.signals.rsiSignal}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">MACD Signal</span>
                    <Badge
                      variant={
                        analysis.stock.signals.macdSignal === "buy"
                          ? "default"
                          : analysis.stock.signals.macdSignal === "sell"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {analysis.stock.signals.macdSignal}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Stock Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sector</span>
                  <span className="text-sm font-medium">
                    {analysis.stock.sector || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Market Cap</span>
                  <span className="text-sm font-medium font-mono">
                    {analysis.stock.marketCap
                      ? `$${(analysis.stock.marketCap / 1e9).toFixed(2)}B`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">P/E Ratio</span>
                  <span className="text-sm font-medium font-mono">
                    {analysis.stock.peRatio?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dividend Yield</span>
                  <span className="text-sm font-medium font-mono">
                    {analysis.stock.dividendYield
                      ? `${(analysis.stock.dividendYield).toFixed(2)}%`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">52W High</span>
                  <span className="text-sm font-medium font-mono">
                    ${analysis.stock.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">52W Low</span>
                  <span className="text-sm font-medium font-mono">
                    ${analysis.stock.fiftyTwoWeekLow?.toFixed(2) || "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "border-2",
                analysis.stock.signals.overallScore >= 60
                  ? "border-chart-2/50 bg-chart-2/5"
                  : analysis.stock.signals.overallScore >= 40
                  ? "border-chart-4/50 bg-chart-4/5"
                  : "border-destructive/50 bg-destructive/5"
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {analysis.stock.signals.overallScore >= 60 ? (
                    <CheckCircle className="h-6 w-6 text-chart-2 mt-0.5" />
                  ) : analysis.stock.signals.overallScore >= 40 ? (
                    <Activity className="h-6 w-6 text-chart-4 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">
                      {analysis.stock.signals.overallScore >= 60
                        ? "Consider Buying"
                        : analysis.stock.signals.overallScore >= 40
                        ? "Hold / Monitor"
                        : "Exercise Caution"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {analysis.stock.signals.overallScore >= 60
                        ? "Technical indicators suggest favorable entry conditions. Always set stop-loss orders."
                        : analysis.stock.signals.overallScore >= 40
                        ? "Mixed signals. Wait for clearer trend confirmation before taking positions."
                        : "Current indicators suggest weakness. Consider waiting for better entry points."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!searchSymbol && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">Enter a Stock Symbol</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for any stock symbol to view detailed technical analysis, indicators, and
              buy/sell recommendations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="text-right">
                <Skeleton className="h-10 w-32 mb-2" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

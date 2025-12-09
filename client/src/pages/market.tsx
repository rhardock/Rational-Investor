import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

interface MarketData {
  indices: MarketIndex[];
  lastUpdated: string;
  marketStatus: "open" | "closed" | "pre-market" | "after-hours";
}

export default function MarketOverview() {
  const { data: market, isLoading, isFetching } = useQuery<MarketData>({
    queryKey: ["/api/market"],
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/market"] });
  };

  if (isLoading) {
    return <MarketSkeleton />;
  }

  const data = market || {
    indices: [
      { symbol: "^GSPC", name: "S&P 500", value: 4500, change: 15.2, changePercent: 0.34, previousClose: 4484.8 },
      { symbol: "^IXIC", name: "NASDAQ Composite", value: 14100, change: -28.5, changePercent: -0.20, previousClose: 14128.5 },
      { symbol: "^DJI", name: "Dow Jones Industrial Average", value: 35200, change: 125.8, changePercent: 0.36, previousClose: 35074.2 },
      { symbol: "^RUT", name: "Russell 2000", value: 1850, change: 8.3, changePercent: 0.45, previousClose: 1841.7 },
      { symbol: "^VIX", name: "CBOE Volatility Index", value: 18.5, change: -0.8, changePercent: -4.15, previousClose: 19.3 },
      { symbol: "^TNX", name: "10-Year Treasury Yield", value: 4.25, change: 0.02, changePercent: 0.47, previousClose: 4.23 },
    ],
    lastUpdated: new Date().toISOString(),
    marketStatus: "closed" as const,
  };

  const getMarketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-chart-2 text-white">Market Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Market Closed</Badge>;
      case "pre-market":
        return <Badge className="bg-chart-4 text-white">Pre-Market</Badge>;
      case "after-hours":
        return <Badge className="bg-chart-3 text-white">After Hours</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Market Overview</h1>
          <p className="text-muted-foreground">
            Major indices and market indicators
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {getMarketStatusBadge(data.marketStatus)}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            data-testid="button-refresh-market"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.indices.map((index) => (
          <Card
            key={index.symbol}
            className="hover-elevate"
            data-testid={`index-card-${index.symbol}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{index.symbol}</p>
                  <h3 className="font-semibold text-lg">{index.name}</h3>
                </div>
                {index.change >= 0 ? (
                  <div className="h-10 w-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono">
                    {index.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "font-mono font-medium",
                      index.change >= 0 ? "text-chart-2" : "text-destructive"
                    )}
                  >
                    {index.change >= 0 ? "+" : ""}
                    {index.change.toFixed(2)}
                  </span>
                  <Badge
                    variant={index.changePercent >= 0 ? "default" : "destructive"}
                    className="font-mono"
                  >
                    {index.changePercent >= 0 ? "+" : ""}
                    {index.changePercent.toFixed(2)}%
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Prev Close: {index.previousClose.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Market Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Gainers</h4>
              <div className="space-y-1">
                {data.indices
                  .filter((i) => i.changePercent > 0)
                  .sort((a, b) => b.changePercent - a.changePercent)
                  .slice(0, 3)
                  .map((index) => (
                    <div
                      key={index.symbol}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{index.name}</span>
                      <span className="text-sm font-mono text-chart-2">
                        +{index.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                {data.indices.filter((i) => i.changePercent > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground">No gainers today</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Losers</h4>
              <div className="space-y-1">
                {data.indices
                  .filter((i) => i.changePercent < 0)
                  .sort((a, b) => a.changePercent - b.changePercent)
                  .slice(0, 3)
                  .map((index) => (
                    <div
                      key={index.symbol}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{index.name}</span>
                      <span className="text-sm font-mono text-destructive">
                        {index.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                {data.indices.filter((i) => i.changePercent < 0).length === 0 && (
                  <p className="text-sm text-muted-foreground">No losers today</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Fear & Greed</h4>
              <div className="space-y-2">
                {data.indices.find((i) => i.symbol === "^VIX") && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">VIX</span>
                      <span className="font-mono text-sm">
                        {data.indices.find((i) => i.symbol === "^VIX")?.value.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          (data.indices.find((i) => i.symbol === "^VIX")?.value || 0) < 15
                            ? "bg-chart-2"
                            : (data.indices.find((i) => i.symbol === "^VIX")?.value || 0) < 25
                            ? "bg-chart-4"
                            : "bg-destructive"
                        )}
                        style={{
                          width: `${Math.min(
                            (data.indices.find((i) => i.symbol === "^VIX")?.value || 0) * 2,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(data.indices.find((i) => i.symbol === "^VIX")?.value || 0) < 15
                        ? "Low volatility - Greed"
                        : (data.indices.find((i) => i.symbol === "^VIX")?.value || 0) < 25
                        ? "Moderate volatility"
                        : "High volatility - Fear"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </p>
    </div>
  );
}

function MarketSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <Skeleton className="h-10 w-28 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

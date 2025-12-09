import { useQuery } from "@tanstack/react-query";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { MetricCard, IndexCard } from "@/components/metric-card";
import { StockSearch } from "@/components/stock-search";
import { TransactionForm } from "@/components/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HoldingWithStock, TransactionWithStock } from "@shared/schema";

interface DashboardData {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: HoldingWithStock[];
  recentTransactions: TransactionWithStock[];
  indices: {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
  }[];
}

export default function Dashboard() {
  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const data = dashboard || {
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    holdings: [],
    recentTransactions: [],
    indices: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your portfolio overview and market summary
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StockSearch buttonLabel="Add Stock" variant="outline" />
          <TransactionForm />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Portfolio Value"
          value={`$${data.totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={data.dayChangePercent}
          changeLabel="today"
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Gain/Loss"
          value={`${data.totalGainLoss >= 0 ? "+" : ""}$${Math.abs(
            data.totalGainLoss
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={data.totalGainLossPercent}
          changeLabel="all time"
          icon={
            data.totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-chart-2" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )
          }
        />
        <MetricCard
          title="Total Cost Basis"
          value={`$${data.totalCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Day Change"
          value={`${data.dayChange >= 0 ? "+" : ""}$${Math.abs(
            data.dayChange
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          change={data.dayChangePercent}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-medium">Top Holdings</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {data.holdings.length} positions
              </Badge>
            </CardHeader>
            <CardContent>
              {data.holdings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No holdings yet</p>
                  <p className="text-sm">Add a stock and record a buy transaction to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.holdings.slice(0, 5).map((holding) => (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-sm text-primary">
                            {holding.stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{holding.stock.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {holding.shares} shares
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold">
                          ${(holding.totalValue || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-mono",
                            (holding.gainLossPercent || 0) >= 0
                              ? "text-chart-2"
                              : "text-destructive"
                          )}
                        >
                          {(holding.gainLossPercent || 0) >= 0 ? "+" : ""}
                          {(holding.gainLossPercent || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Record your first buy or sell transaction</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentTransactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={tx.type === "buy" ? "default" : "destructive"}
                          className="uppercase text-xs"
                        >
                          {tx.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{tx.stock.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono">
                          {tx.shares} @ ${tx.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          ${(tx.shares * tx.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium">Market Indices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.indices.length === 0 ? (
                <>
                  <IndexCard
                    name="S&P 500"
                    symbol="^GSPC"
                    value={4500}
                    change={12.5}
                    changePercent={0.28}
                  />
                  <IndexCard
                    name="NASDAQ"
                    symbol="^IXIC"
                    value={14200}
                    change={-25.3}
                    changePercent={-0.18}
                  />
                  <IndexCard
                    name="Dow Jones"
                    symbol="^DJI"
                    value={35600}
                    change={45.2}
                    changePercent={0.13}
                  />
                </>
              ) : (
                data.indices.map((index) => (
                  <IndexCard
                    key={index.symbol}
                    name={index.name}
                    symbol={index.symbol}
                    value={index.value}
                    change={index.change}
                    changePercent={index.changePercent}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full mb-3" />
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full mb-3" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

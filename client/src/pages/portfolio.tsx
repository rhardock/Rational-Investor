import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  LineChart,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionForm } from "@/components/transaction-form";
import { StockSearch } from "@/components/stock-search";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { HoldingWithStock } from "@shared/schema";

interface PortfolioData {
  holdings: HoldingWithStock[];
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export default function Portfolio() {
  const { toast } = useToast();

  const { data: portfolio, isLoading } = useQuery<PortfolioData>({
    queryKey: ["/api/portfolio"],
  });

  const deleteHoldingMutation = useMutation({
    mutationFn: async (holdingId: number) => {
      await apiRequest("DELETE", `/api/portfolio/${holdingId}`);
    },
    onSuccess: () => {
      toast({ title: "Holding removed", description: "Position has been removed from portfolio." });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove holding.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  const data = portfolio || {
    holdings: [],
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your holdings and track performance
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StockSearch buttonLabel="Add Stock" variant="outline" />
          <TransactionForm />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-bold font-mono">
              ${data.totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Cost Basis</p>
            <p className="text-2xl font-bold font-mono">
              ${data.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Gain/Loss</p>
            <p
              className={cn(
                "text-2xl font-bold font-mono",
                data.totalGainLoss >= 0 ? "text-chart-2" : "text-destructive"
              )}
            >
              {data.totalGainLoss >= 0 ? "+" : ""}$
              {Math.abs(data.totalGainLoss).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Return</p>
            <div className="flex items-center gap-2">
              {data.totalGainLossPercent >= 0 ? (
                <TrendingUp className="h-5 w-5 text-chart-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <p
                className={cn(
                  "text-2xl font-bold font-mono",
                  data.totalGainLossPercent >= 0 ? "text-chart-2" : "text-destructive"
                )}
              >
                {data.totalGainLossPercent >= 0 ? "+" : ""}
                {data.totalGainLossPercent.toFixed(2)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg font-medium">Holdings</CardTitle>
          <Badge variant="secondary">{data.holdings.length} positions</Badge>
        </CardHeader>
        <CardContent>
          {data.holdings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No holdings yet</h3>
              <p className="text-sm mb-4">
                Start building your portfolio by adding stocks and recording transactions.
              </p>
              <div className="flex items-center justify-center gap-2">
                <StockSearch buttonLabel="Add Your First Stock" />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Cost</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead className="text-right">Return %</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.holdings.map((holding) => (
                    <TableRow key={holding.id} data-testid={`holding-row-${holding.stock.symbol}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="font-semibold text-xs text-primary">
                              {holding.stock.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{holding.stock.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {holding.stock.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {holding.shares.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${holding.averageCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${(holding.currentPrice || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        ${(holding.totalValue || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          (holding.gainLoss || 0) >= 0 ? "text-chart-2" : "text-destructive"
                        )}
                      >
                        {(holding.gainLoss || 0) >= 0 ? "+" : ""}$
                        {Math.abs(holding.gainLoss || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={(holding.gainLossPercent || 0) >= 0 ? "default" : "destructive"}
                          className="font-mono"
                        >
                          {(holding.gainLossPercent || 0) >= 0 ? "+" : ""}
                          {(holding.gainLossPercent || 0).toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${holding.stock.symbol}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/analysis?symbol=${holding.stock.symbol}`}>
                                <LineChart className="h-4 w-4 mr-2" />
                                View Analysis
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteHoldingMutation.mutate(holding.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

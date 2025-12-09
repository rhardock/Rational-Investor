import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Eye,
  Plus,
  TrendingUp,
  TrendingDown,
  LineChart,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StockSearch } from "@/components/stock-search";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { WatchlistItemWithStock } from "@shared/schema";

export default function Watchlist() {
  const { toast } = useToast();

  const { data: watchlistItems = [], isLoading } = useQuery<WatchlistItemWithStock[]>({
    queryKey: ["/api/watchlist"],
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/watchlist/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Removed from watchlist" });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist.",
        variant: "destructive",
      });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/watchlist/${id}`, { alertEnabled: enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (stockId: number) => {
      await apiRequest("POST", "/api/watchlist", { stockId });
    },
    onSuccess: () => {
      toast({ title: "Added to watchlist" });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Stock may already be in your watchlist.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <WatchlistSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground">
            Monitor stocks you're interested in buying
          </p>
        </div>
        <StockSearch
          buttonLabel="Add to Watchlist"
          onStockAdded={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
          }}
        />
      </div>

      {watchlistItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-16">
            <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add stocks you're interested in to monitor their prices and get alerts when they
              reach your target price.
            </p>
            <StockSearch buttonLabel="Add Your First Stock" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistItems.map((item) => (
            <Card key={item.id} className="hover-elevate" data-testid={`watchlist-card-${item.stock.symbol}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {item.stock.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.stock.symbol}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {item.stock.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleAlertMutation.mutate({
                        id: item.id,
                        enabled: !item.alertEnabled,
                      })
                    }
                    data-testid={`button-alert-${item.stock.symbol}`}
                  >
                    {item.alertEnabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="text-lg font-bold font-mono">
                      ${(item.stock.currentPrice || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Change</span>
                    <div className="flex items-center gap-1">
                      {(item.stock.priceChangePercent || 0) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-chart-2" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={cn(
                          "font-mono font-medium",
                          (item.stock.priceChangePercent || 0) >= 0
                            ? "text-chart-2"
                            : "text-destructive"
                        )}
                      >
                        {(item.stock.priceChangePercent || 0) >= 0 ? "+" : ""}
                        {(item.stock.priceChangePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {item.targetBuyPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Target Price</span>
                      <Badge
                        variant={
                          (item.stock.currentPrice || 0) <= item.targetBuyPrice
                            ? "default"
                            : "secondary"
                        }
                      >
                        ${item.targetBuyPrice.toFixed(2)}
                      </Badge>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/analysis?symbol=${item.stock.symbol}`}>
                      <LineChart className="h-4 w-4 mr-1" />
                      Analyze
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromWatchlistMutation.mutate(item.id)}
                    data-testid={`button-remove-${item.stock.symbol}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div>
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

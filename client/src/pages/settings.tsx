import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, RefreshCw, Trash2, Database, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TradingRule } from "@shared/schema";

interface SettingsData {
  defaultRiskPercent: number;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
}

export default function Settings() {
  const { toast } = useToast();
  const [riskPercent, setRiskPercent] = useState("2");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: rules = [], isLoading: rulesLoading } = useQuery<TradingRule[]>({
    queryKey: ["/api/trading-rules"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalStocks: number;
    totalPricePoints: number;
    totalTransactions: number;
    lastSync: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const refreshPricesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/stocks/refresh");
    },
    onSuccess: () => {
      toast({ title: "Prices refreshed", description: "All stock prices have been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh prices. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/data/all");
    },
    onSuccess: () => {
      toast({ title: "Data cleared", description: "All application data has been reset." });
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear data.",
        variant: "destructive",
      });
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PATCH", `/api/trading-rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading-rules"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your trading preferences and data management
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Preferences</CardTitle>
              <CardDescription>
                Set your default risk management parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="riskPercent">Default Risk Per Trade (%)</Label>
                <Input
                  id="riskPercent"
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  min="0.5"
                  max="5"
                  step="0.5"
                  data-testid="input-default-risk"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1-2% for conservative trading
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-refresh Prices</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically update stock prices
                  </p>
                </div>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  data-testid="switch-auto-refresh"
                />
              </div>

              <Button className="w-full" data-testid="button-save-settings">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : stats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracked Stocks</span>
                    <span className="font-medium">{stats.totalStocks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Data Points</span>
                    <span className="font-medium">{stats.totalPricePoints.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transactions</span>
                    <span className="font-medium">{stats.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="font-medium">
                      {stats.lastSync ? new Date(stats.lastSync).toLocaleString() : "Never"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => refreshPricesMutation.mutate()}
                  disabled={refreshPricesMutation.isPending}
                  data-testid="button-refresh-prices"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshPricesMutation.isPending ? "animate-spin" : ""
                    }`}
                  />
                  Refresh Prices
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" data-testid="button-clear-data">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your stocks, portfolio holdings,
                        transactions, and watchlist items. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearDataMutation.mutate()}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trading Rules</CardTitle>
              <CardDescription>
                Manage your automated trading rules and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No trading rules configured</p>
                  <p className="text-sm">Rules help automate your decision-making</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {rule.ruleType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      </div>
                      <Switch
                        checked={rule.isActive || false}
                        onCheckedChange={(checked) =>
                          toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                        }
                        data-testid={`switch-rule-${rule.id}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Provider</span>
                <span className="font-medium">Yahoo Finance</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Rational Investor is designed to help you make data-driven investment decisions.
                Always do your own research before making investment decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

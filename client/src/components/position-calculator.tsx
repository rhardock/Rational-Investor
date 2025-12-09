import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PositionResult {
  recommendedShares: number;
  maxInvestment: number;
  riskAmount: number;
  riskPerShare: number;
  percentOfPortfolio: number;
}

export function PositionCalculator() {
  const [portfolioValue, setPortfolioValue] = useState<string>("100000");
  const [riskPercent, setRiskPercent] = useState<string>("2");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [result, setResult] = useState<PositionResult | null>(null);

  const calculate = () => {
    const pv = parseFloat(portfolioValue);
    const rp = parseFloat(riskPercent);
    const ep = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);

    if (isNaN(pv) || isNaN(rp) || isNaN(ep) || isNaN(sl) || ep <= sl) {
      setResult(null);
      return;
    }

    const riskAmount = pv * (rp / 100);
    const riskPerShare = ep - sl;
    const recommendedShares = Math.floor(riskAmount / riskPerShare);
    const maxInvestment = recommendedShares * ep;
    const percentOfPortfolio = (maxInvestment / pv) * 100;

    setResult({
      recommendedShares,
      maxInvestment,
      riskAmount,
      riskPerShare,
      percentOfPortfolio,
    });
  };

  const isHighRisk = result && result.percentOfPortfolio > 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Position Size Calculator
        </CardTitle>
        <CardDescription>
          Calculate the optimal number of shares based on your risk tolerance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="portfolioValue">Portfolio Value ($)</Label>
            <Input
              id="portfolioValue"
              type="number"
              value={portfolioValue}
              onChange={(e) => setPortfolioValue(e.target.value)}
              placeholder="100000"
              data-testid="input-portfolio-value"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="riskPercent">Risk Per Trade (%)</Label>
            <Input
              id="riskPercent"
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="2"
              min="0.1"
              max="10"
              step="0.1"
              data-testid="input-risk-percent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entryPrice">Entry Price ($)</Label>
            <Input
              id="entryPrice"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="150.00"
              step="0.01"
              data-testid="input-entry-price"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stopLoss">Stop Loss Price ($)</Label>
            <Input
              id="stopLoss"
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="140.00"
              step="0.01"
              data-testid="input-stop-loss"
            />
          </div>
        </div>

        <Button onClick={calculate} className="w-full" data-testid="button-calculate">
          Calculate Position Size
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recommended Shares</p>
                <p className="text-2xl font-bold font-mono">{result.recommendedShares}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Max Investment</p>
                <p className="text-2xl font-bold font-mono">
                  ${result.maxInvestment.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Risk Amount</p>
                <p className="text-lg font-semibold font-mono text-destructive">
                  ${result.riskAmount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Risk Per Share</p>
                <p className="text-lg font-semibold font-mono">
                  ${result.riskPerShare.toFixed(2)}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-md",
                isHighRisk
                  ? "bg-destructive/10 text-destructive"
                  : "bg-chart-2/10 text-chart-2"
              )}
            >
              {isHighRisk ? (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">High Concentration Warning</p>
                    <p className="text-sm opacity-90">
                      This position would be {result.percentOfPortfolio.toFixed(1)}% of your
                      portfolio. Consider reducing position size.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Position Size OK</p>
                    <p className="text-sm opacity-90">
                      This position is {result.percentOfPortfolio.toFixed(1)}% of your portfolio.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

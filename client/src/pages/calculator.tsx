import { PositionCalculator } from "@/components/position-calculator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, AlertTriangle, Target, TrendingDown } from "lucide-react";

export default function Calculator() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Risk Management</h1>
        <p className="text-muted-foreground">
          Calculate position sizes and manage your investment risk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PositionCalculator />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Management Rules
              </CardTitle>
              <CardDescription>
                Follow these principles to protect your capital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-chart-2">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Never Risk More Than 2%</h4>
                  <p className="text-sm text-muted-foreground">
                    Limit each trade to 1-2% of your total portfolio value. This protects you
                    from catastrophic losses.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-chart-2">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Always Set a Stop-Loss</h4>
                  <p className="text-sm text-muted-foreground">
                    Before entering any trade, determine your exit point. Never trade without
                    knowing your maximum loss.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-chart-2">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Position Sizing Matters</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the calculator to determine how many shares to buy based on your risk
                    tolerance and stop-loss level.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-chart-2">4</span>
                </div>
                <div>
                  <h4 className="font-medium">Diversify Your Holdings</h4>
                  <p className="text-sm text-muted-foreground">
                    Don't put all your eggs in one basket. Aim for no single position to exceed
                    10% of your portfolio.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Entry Criteria Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  Stock is above 50-day and 200-day moving averages
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  RSI is between 30-70 (not overbought/oversold)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  Major market indices are in uptrend
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  Clear stop-loss level identified
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  Risk/reward ratio is at least 2:1
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-chart-2" />
                  Position size calculated and verified
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Exit Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Stock breaks below your stop-loss price
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Stock closes below 50-day moving average
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  RSI reaches overbought territory (&gt;70) after a run
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Major market indices turn bearish
                </li>
                <li className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Original thesis for buying no longer valid
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

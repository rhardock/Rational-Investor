import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive && (
              <TrendingUp className="h-4 w-4 text-chart-2" />
            )}
            {isNegative && (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            {isNeutral && (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isPositive && "text-chart-2",
                isNegative && "text-destructive",
                isNeutral && "text-muted-foreground"
              )}
            >
              {isPositive && "+"}
              {change.toFixed(2)}%
            </span>
            {changeLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface IndexCardProps {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  miniChartData?: number[];
}

export function IndexCard({
  name,
  symbol,
  value,
  change,
  changePercent,
}: IndexCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="hover-elevate cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{name}</p>
            <p className="text-xs font-medium text-muted-foreground">{symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-mono">{value.toLocaleString()}</p>
            <div className="flex items-center justify-end gap-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-chart-2" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-medium font-mono",
                  isPositive ? "text-chart-2" : "text-destructive"
                )}
              >
                {isPositive && "+"}
                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StockSearchProps {
  onStockAdded?: () => void;
  buttonLabel?: string;
  variant?: "default" | "outline" | "ghost";
}

export function StockSearch({
  onStockAdded,
  buttonLabel = "Add Stock",
  variant = "default",
}: StockSearchProps) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const { toast } = useToast();

  const addStockMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const response = await apiRequest("POST", "/api/stocks", { symbol });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Stock added",
        description: `${symbol.toUpperCase()} has been added to tracking.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setSymbol("");
      setOpen(false);
      onStockAdded?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding stock",
        description: error.message || "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      addStockMutation.mutate(symbol.trim().toUpperCase());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} data-testid="button-add-stock">
          <Plus className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock to Track</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter stock symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="pl-9"
                data-testid="input-stock-symbol"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!symbol.trim() || addStockMutation.isPending}
              data-testid="button-submit-stock"
            >
              {addStockMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, AlertCircle, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useFirestore, useUser } from "@/firebase";
import { setBudget, deleteBudget } from "@/lib/finance-service";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Utilities", "Entertainment", 
  "Housing", "Health", "Education", "Miscellaneous"
];

interface BudgetProgressProps {
  budgets: any[];
  transactions: any[];
}

export function BudgetProgress({ budgets, transactions }: BudgetProgressProps) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "Food",
    limitAmount: "",
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
  });

  // Check for budget alerts
  useEffect(() => {
    budgets.forEach(budget => {
      const spent = monthlyTransactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      if (spent >= budget.limitAmount && budget.limitAmount > 0) {
        toast({
          variant: "destructive",
          title: "Budget Reached!",
          description: `You've reached or exceeded your $${budget.limitAmount} budget for ${budget.category}.`,
        });
      }
    });
  }, [budgets.length, monthlyTransactions.length, toast]);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setLoading(true);
    try {
      await setBudget(db, user.uid, {
        category: formData.category,
        limitAmount: parseFloat(formData.limitAmount),
        month: currentMonth,
        year: currentYear,
      });
      toast({ title: "Budget Set", description: `Monthly budget for ${formData.category} updated.` });
      setOpen(false);
      setFormData({ category: "Food", limitAmount: "" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to set budget." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: any) => {
    setFormData({
      category: budget.category,
      limitAmount: budget.limitAmount.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!db || !user) return;
    try {
      await deleteBudget(db, user.uid, budgetId);
      toast({ title: "Budget Deleted", description: "The budget has been removed." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete budget." });
    }
  };

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {budgets.map((budget) => {
        const spent = monthlyTransactions
          .filter(t => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const percent = Math.min((spent / (budget.limitAmount || 1)) * 100, 100);
        const isOver = spent >= budget.limitAmount && budget.limitAmount > 0;

        return (
          <Card key={budget.id} className="border-none ios-shadow bg-white/50 rounded-2xl overflow-hidden transition-all hover:bg-white group relative">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg", isOver ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary")}>
                    <Target className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{budget.category}</div>
                    <div className="text-sm font-bold tracking-tight">${spent.toLocaleString()} / ${budget.limitAmount}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {isOver && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl ios-shadow border-none w-32">
                      <DropdownMenuItem onClick={() => handleEdit(budget)} className="rounded-xl font-bold text-[10px] uppercase tracking-wider">
                        <Edit2 className="mr-2 h-3 w-3" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(budget.id)} className="rounded-xl font-bold text-[10px] uppercase tracking-wider text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Progress value={percent} className={cn("h-1.5 rounded-full", isOver ? "[&>div]:bg-red-500 bg-red-100" : "[&>div]:bg-primary bg-primary/10")} />
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/20 text-primary hover:bg-primary/5 transition-all group">
            <Plus className="h-5 w-5 group-hover:scale-125 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Set Budget</span>
          </button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center font-bold tracking-tight">Monthly Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetBudget} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase ml-1 opacity-60">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="rounded-xl h-11 bg-muted/50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase ml-1 opacity-60">Monthly Limit</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                className="rounded-xl h-11 bg-muted/50 border-none font-bold"
                value={formData.limitAmount}
                onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest" disabled={loading}>
                {loading ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
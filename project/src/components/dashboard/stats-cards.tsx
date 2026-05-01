
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, CreditCard, Calendar } from "lucide-react";

export function StatsCards({ expenses }: { expenses: any[] }) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthSpent = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatCard 
        label="Total Out" 
        value={totalSpent} 
        icon={Wallet} 
        color="text-primary" 
        desc="Lifetime total"
      />
      <StatCard 
        label="Monthly" 
        value={monthSpent} 
        icon={Calendar} 
        color="text-accent" 
        desc="Current month"
      />
      <StatCard 
        label="Records" 
        value={expenses.length} 
        icon={CreditCard} 
        color="text-muted-foreground" 
        desc="Total logs"
        isCount
      />
      <StatCard 
        label="Average" 
        value={avgExpense} 
        icon={TrendingUp} 
        color="text-primary/70" 
        desc="Per transaction"
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, desc, isCount }: any) {
  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">{label}</span>
          <Icon className={`h-3 w-3 ${color}`} />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight">
            {isCount ? value : `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </div>
          <p className="text-[9px] text-muted-foreground font-medium truncate">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

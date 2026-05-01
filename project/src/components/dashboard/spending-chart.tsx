"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from 'react';
import { cn } from '@/lib/utils';

const COLORS = ['#007AFF', '#32ADE6', '#5856D6', '#FF9500', '#FF3B30', '#34C759'];

export function SpendingCharts({ expenses }: { expenses: any[] }) {
  const [filter, setFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const categoryDataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryDataMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const getFilteredData = () => {
    if (filter === 'weekly') {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const dayAmount = expenses
          .filter(e => e.date.startsWith(dateStr) && e.type === 'expense')
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
          amount: dayAmount,
        };
      });
    }

    if (filter === 'monthly') {
      return Array.from({ length: 12 }).map((_, i) => {
        const d = new Date();
        d.setMonth(i);
        const year = d.getFullYear();
        const month = i;
        const monthAmount = expenses
          .filter(e => {
            const ed = new Date(e.date);
            return ed.getMonth() === month && ed.getFullYear() === year && e.type === 'expense';
          })
          .reduce((sum, e) => sum + e.amount, 0);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          amount: monthAmount,
        };
      });
    }

    // Yearly
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }).map((_, i) => {
      const year = currentYear - (4 - i);
      const yearAmount = expenses
        .filter(e => new Date(e.date).getFullYear() === year && e.type === 'expense')
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        label: year.toString(),
        amount: yearAmount,
      };
    });
  };

  const chartData = getFilteredData();

  if (expenses.length === 0) {
    return (
      <Card className="p-12 text-center text-xs text-muted-foreground bg-white/50 border-dashed rounded-3xl ios-shadow">
        Add transactions to see visual analytics.
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1">
      <div className="flex bg-muted/50 p-1 rounded-2xl w-fit mb-2">
        {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              filter === f ? "bg-white text-primary ios-shadow" : "text-muted-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none ios-shadow bg-white/50 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Spending Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.4} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 8 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '600' }}
                />
                <Bar dataKey="amount" fill="#007AFF" radius={[6, 6, 6, 6]} barSize={filter === 'weekly' ? 30 : 15} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none ios-shadow bg-white/50 rounded-3xl overflow-hidden">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '600' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
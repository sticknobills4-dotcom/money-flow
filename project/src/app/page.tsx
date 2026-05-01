"use client";

import { useFirestore, useCollection, useUser, useAuth, useMemoFirebase } from "@/firebase";
import { getTransactionsQuery, getAccountsQuery, getBudgetsQuery } from "@/lib/finance-service";
import { getUserProfile, UserProfile } from "@/lib/user-service";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingCharts } from "@/components/dashboard/spending-chart";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { AccountCards } from "@/components/dashboard/account-cards";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { ChatWindow } from "@/components/chat/chat-window";
import { PiggyBank } from "@/components/dashboard/piggy-bank";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trash2, LayoutDashboard, History, Loader2, 
  ArrowUpRight, ArrowDownLeft, PieChart, 
  LogOut, Wallet, Target, Calendar as CalendarIcon, 
  Filter, FileDown, CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, useMemo, useRef } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [animationType, setAnimationType] = useState<'income' | 'expense' | null>(null);
  
  const prevTransactionsLength = useRef<number>(-1);

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && db) getUserProfile(db, user.uid).then(setProfile);
  }, [user, db]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getTransactionsQuery(db, user.uid);
  }, [db, user?.uid]);
  const { data: transactions } = useCollection(transactionsQuery);

  const accountsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAccountsQuery(db, user.uid);
  }, [db, user?.uid]);
  const { data: accounts } = useCollection(accountsQuery);

  const budgetsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getBudgetsQuery(db, user.uid);
  }, [db, user?.uid]);
  const { data: budgets } = useCollection(budgetsQuery);

  // Animation trigger logic
  useEffect(() => {
    if (transactions) {
      if (prevTransactionsLength.current !== -1 && transactions.length > prevTransactionsLength.current) {
        const latest = transactions[0];
        if (latest) {
          if (latest.type === 'income') setAnimationType('income');
          else if (latest.type === 'expense') setAnimationType('expense');
          
          setTimeout(() => setAnimationType(null), 2000);
        }
      }
      prevTransactionsLength.current = transactions.length;
    }
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesDate = !filterDate || format(new Date(t.date), 'yyyy-MM-dd') === format(filterDate, 'yyyy-MM-dd');
      return matchesType && matchesDate;
    });
  }, [transactions, filterType, filterDate]);

  const handleDelete = (id: string) => {
    if (!db || !user) return;
    deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Cashflow AI - Transaction Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: filteredTransactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd'),
        t.description || t.category,
        t.category,
        t.type.toUpperCase(),
        `$${t.amount.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillStyle: 'fill', fillColor: [0, 40, 26] },
    });

    doc.save(`cashflow-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden font-body flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white border-b px-6 h-16 flex items-center justify-between ios-shadow">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-2xl shadow-sm">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-primary tracking-tight">Cashflow AI</span>
        </div>
        <UserMenu profile={profile} email={user.email} onLogout={handleLogout} />
      </header>

      {/* Spacing for sticky header */}
      <div className="h-16 w-full" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Piggy Bank Animation Area */}
        {activeTab === 'dashboard' && (
          <div className="mb-8 relative z-0">
            <PiggyBank animationType={animationType} />
          </div>
        )}

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
            <StatsCards expenses={transactions || []} />
            
            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                <Wallet className="h-3.5 w-3.5" />
                Accounts
              </h2>
              <AccountCards accounts={accounts || []} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                <Target className="h-3.5 w-3.5" />
                Budgets
              </h2>
              <BudgetProgress budgets={budgets || []} transactions={transactions || []} />
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                <PieChart className="h-3.5 w-3.5" />
                Analysis
              </h2>
              <SpendingCharts expenses={transactions || []} />
            </section>
          </div>
        )}

        {/* Transactions Content */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl ios-shadow border">
              <div className="flex flex-wrap items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9 bg-white">
                      <Filter className="mr-2 h-3.5 w-3.5" />
                      {filterType === 'all' ? 'All' : filterType}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl border-none ios-shadow w-40 bg-white z-[200]">
                    <DropdownMenuItem onClick={() => setFilterType('all')} className="rounded-xl font-bold text-xs">All Types</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('income')} className="rounded-xl font-bold text-xs text-green-600">Income</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('expense')} className="rounded-xl font-bold text-xs text-red-600">Expense</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType('transfer')} className="rounded-xl font-bold text-xs text-blue-600">Transfer</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("rounded-xl font-bold uppercase text-[10px] tracking-widest h-9 bg-white", filterDate && "text-primary border-primary")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {filterDate ? format(filterDate, "MMM d") : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-3xl shadow-xl border-none bg-white z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                      className="rounded-3xl"
                    />
                    <div className="p-2 border-t flex justify-center">
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase w-full" onClick={() => setFilterDate(undefined)}>Clear Date</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleExportPDF} size="sm" className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9">
                <FileDown className="mr-2 h-3.5 w-3.5" />
                Export PDF
              </Button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                <History className="h-3.5 w-3.5" />
                {filteredTransactions.length} Records
              </h2>
              <TransactionList transactions={filteredTransactions} onDelete={handleDelete} />
            </div>
          </div>
        )}
      </main>

      {/* iOS Style Bottom Tab Bar */}
      <nav className="ios-tab-bar z-[100]">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Insights" />
        
        <div className="relative pt-6">
          <AddExpenseModal />
        </div>

        <NavButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={History} label="History" />
      </nav>

      <ChatWindow />
      <Toaster />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center gap-1.5 flex-1 py-1 transition-all duration-300",
      active ? 'text-primary' : 'text-muted-foreground'
    )}>
      <Icon className={cn("h-6 w-6", active ? 'scale-110' : 'opacity-30')} strokeWidth={active ? 2.5 : 2} />
      <span className={cn("text-[9px] font-bold tracking-[0.1em] uppercase", !active && "opacity-30")}>{label}</span>
    </button>
  );
}

function TransactionList({ transactions, onDelete }: { transactions: any[], onDelete: (id: string) => void }) {
  if (transactions.length === 0) {
    return (
      <Card className="p-16 text-center text-muted-foreground border-dashed bg-muted/20 rounded-[2rem]">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="h-10 w-10 opacity-20" />
          <p className="font-bold text-sm">No transactions found.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <Card key={t.id} className="p-4 border-none ios-shadow bg-white hover:bg-white transition-all rounded-3xl group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl transition-colors",
                t.type === 'income' ? 'bg-green-100 text-green-700' : 
                t.type === 'transfer' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
              )}>
                {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" strokeWidth={3} /> : 
                 t.type === 'transfer' ? <Wallet className="h-5 w-5" strokeWidth={3} /> : <ArrowDownLeft className="h-5 w-5" strokeWidth={3} />}
              </div>
              <div>
                <p className="font-bold text-base leading-none mb-1 text-primary">{t.description || t.category}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px] py-0 px-2 font-bold uppercase tracking-wider">{t.category}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase">{format(new Date(t.date), 'MMM d')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={cn(
                "font-bold text-lg tracking-tight",
                t.type === 'income' ? 'text-green-700' : 
                t.type === 'transfer' ? 'text-blue-700' : 'text-red-700'
              )}>
                {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}${t.amount.toLocaleString()}
              </p>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive/20 hover:text-destructive hover:bg-destructive/5 rounded-full" onClick={() => onDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function UserMenu({ profile, email, onLogout }: any) {
  const initials = profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-muted/50 p-0 border">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2 rounded-[2rem] ios-shadow border-none bg-white z-[200]" align="end">
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-primary">{profile?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground mt-1">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="p-3 text-red-600 cursor-pointer rounded-2xl focus:bg-red-50 focus:text-red-600 transition-colors">
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-bold">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
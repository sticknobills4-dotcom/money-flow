
"use client";

import { useState } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { addTransaction, getAccountsQuery } from "@/lib/finance-service";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Utilities", "Entertainment", 
  "Housing", "Health", "Education", "Miscellaneous"
];

export function AddExpenseModal() {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');

  const accountsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAccountsQuery(db, user.uid);
  }, [db, user?.uid]);
  const { data: accounts } = useCollection(accountsQuery);

  const [formData, setFormData] = useState({
    amount: "",
    category: "Miscellaneous",
    description: "",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
    toAccountId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !formData.accountId) {
      toast({ variant: "destructive", title: "Error", description: "Select an account." });
      return;
    }

    setLoading(true);
    try {
      await addTransaction(db, user.uid, {
        type,
        amount: parseFloat(formData.amount),
        category: type === 'income' ? 'Income' : type === 'transfer' ? 'Transfer' : formData.category,
        description: formData.description,
        date: formData.date,
        accountId: formData.accountId,
        toAccountId: type === 'transfer' ? formData.toAccountId : undefined
      });

      toast({ title: "Success", description: "Transaction recorded." });
      setOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Could not save transaction." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      category: "Miscellaneous",
      description: "",
      date: new Date().toISOString().split("T")[0],
      accountId: "",
      toAccountId: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-14 w-14 rounded-full ios-shadow bg-primary hover:bg-primary/90 transition-transform active:scale-90">
          <Plus className="h-8 w-8 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] sm:max-w-[425px] bg-white z-[150] border-none max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-center text-xl font-bold tracking-tight">New Record</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <ScrollArea className="flex-1 px-6 pb-4">
              <div className="space-y-4 pt-2">
                <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full mb-6">
                  <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-2xl h-11">
                    <TabsTrigger value="expense" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-[10px] uppercase">Expense</TabsTrigger>
                    <TabsTrigger value="income" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-[10px] uppercase">Income</TabsTrigger>
                    <TabsTrigger value="transfer" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-[10px] uppercase">Transfer</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="rounded-2xl h-12 bg-muted/50 border-none font-bold text-base"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">Date</Label>
                    <Input
                      type="date"
                      required
                      className="rounded-2xl h-12 bg-muted/50 border-none font-bold text-base min-w-full"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">{type === 'transfer' ? 'From' : 'Account'}</Label>
                  <Select 
                    value={formData.accountId} 
                    onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                  >
                    <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-none font-bold">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-white z-[200] border shadow-xl">
                      {accounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name} (${acc.balance})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {type === 'transfer' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">To</Label>
                    <Select 
                      value={formData.toAccountId} 
                      onValueChange={(v) => setFormData({ ...formData, toAccountId: v })}
                    >
                      <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-none font-bold">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-white z-[200] border shadow-xl">
                        {accounts?.filter(a => a.id !== formData.accountId).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name} (${acc.balance})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {type === 'expense' && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-white z-[200] border shadow-xl">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5 pb-2">
                  <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">Description</Label>
                  <Input
                    placeholder="What was this for?"
                    className="rounded-2xl h-12 bg-muted/50 border-none font-bold"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-2 shrink-0 bg-white border-t mt-auto">
              <Button type="submit" className="w-full h-14 rounded-2xl text-base font-bold ios-shadow" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Record Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

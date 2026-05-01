"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, Landmark, Banknote, Plus } from "lucide-react";
import { useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { addAccount } from "@/lib/finance-service";
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

const ACCOUNT_ICONS = {
  Bank: Landmark,
  Cash: Banknote,
  "Credit Card": CreditCard,
  Other: Wallet,
};

export function AccountCards({ accounts }: { accounts: any[] }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    type: "Bank" as any,
  });

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setLoading(true);
    try {
      await addAccount(db, user.uid, {
        name: formData.name,
        balance: parseFloat(formData.balance),
        type: formData.type,
      });
      toast({ title: "Account Created", description: `${formData.name} added successfully.` });
      setOpen(false);
      setFormData({ name: "", balance: "", type: "Bank" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create account." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {accounts.map((acc) => {
        const Icon = ACCOUNT_ICONS[acc.type as keyof typeof ACCOUNT_ICONS] || Wallet;
        return (
          <Card key={acc.id} className="border-none ios-shadow bg-white/50 backdrop-blur-sm group hover:bg-white transition-all cursor-default">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    {acc.name}
                  </p>
                  <p className="text-xl font-bold tracking-tight">${acc.balance.toLocaleString()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold uppercase py-0.5">{acc.type}</Badge>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:bg-muted/30 transition-all group">
            <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm">Add Account</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input 
                placeholder="e.g. My Savings" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank">Bank Account</SelectItem>
                  <SelectItem value="Cash">Cash / Wallet</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? "Creating..." : "Add Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
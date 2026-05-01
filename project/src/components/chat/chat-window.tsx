
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Send, Loader2, Sparkles, X } from "lucide-react";
import { naturalLanguageExpenseEntry } from "@/ai/flows/natural-language-expense-entry";
import { conversationalFinancialInsights } from "@/ai/flows/conversational-financial-insights-flow";
import { useFirestore, useUser } from "@/firebase";
import { addQuickExpense } from "@/lib/finance-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Message = {
  role: 'user' | 'bot';
  content: string;
  type?: 'insight' | 'entry' | 'normal';
};

export function ChatWindow() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hi! I'm your Cashflow AI assistant. Send a quick note like 'coffee 5' to track it, or ask me for financial tips!", type: 'normal' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !db || !user) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const entryKeywords = ['spent', 'paid', 'bought', 'cost', 'expense', 'tea', 'coffee', 'food', 'lunch', 'dinner', 'shopping'];
      const hasNumber = /\d+/.test(userMsg);
      const hasKeyword = entryKeywords.some(k => userMsg.toLowerCase().includes(k));
      
      const looksLikeEntry = hasNumber && (hasKeyword || userMsg.split(' ').length <= 3);

      if (looksLikeEntry) {
        const result = await naturalLanguageExpenseEntry({ naturalLanguageInput: userMsg });
        if (result && result.amount > 0) {
          await addQuickExpense(db, user.uid, {
            amount: result.amount,
            category: result.category,
            description: result.description,
            date: result.date,
          });
          
          setMessages(prev => [...prev, { 
            role: 'bot', 
            content: `Understood! I've recorded $${result.amount} for "${result.description}" in the ${result.category} category.`,
            type: 'entry' 
          }]);
          
          toast({
            title: "Quick Entry Saved",
            description: `$${result.amount} added to your transactions.`,
          });
        } else {
          const insight = await conversationalFinancialInsights({ userInput: userMsg });
          setMessages(prev => [...prev, { role: 'bot', content: insight, type: 'insight' }]);
        }
      } else {
        const insight = await conversationalFinancialInsights({ userInput: userMsg });
        setMessages(prev => [...prev, { role: 'bot', content: insight, type: 'insight' }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm having a bit of trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40">
      {isOpen ? (
        <Card className="flex flex-col ios-shadow border-none bg-white w-[85vw] h-[55vh] md:w-[300px] md:h-[400px] rounded-[2rem] overflow-hidden transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-10">
          <CardHeader className="bg-primary p-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1 rounded-lg">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <CardTitle className="text-white text-[10px] font-bold tracking-tight uppercase">AI Assistant</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-white hover:bg-white/10 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-3 bg-muted/5" viewportRef={viewportRef}>
            <div className="space-y-3 pb-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn(
                    "max-w-[85%] rounded-[1.25rem] p-3 text-[10px] shadow-sm font-medium leading-relaxed",
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border-border/50 text-foreground rounded-tl-none'
                  )}>
                    {m.type === 'entry' && <Sparkles className="h-2 w-2 inline mr-2 text-primary" />}
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-[1rem] rounded-tl-none p-2 flex items-center gap-2">
                    <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                    <span className="text-muted-foreground italic font-semibold text-[9px]">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardFooter className="p-2 border-t bg-white">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex w-full items-center gap-2"
            >
              <Input 
                placeholder="Ask me anything..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary h-8 px-3 text-[10px] font-medium"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-xl ios-shadow"
              >
                <Send className="h-3 w-3" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-8 w-8 rounded-[1rem] ios-shadow p-0 bg-primary hover:scale-105 active:scale-95 transition-all duration-300 group pulse-primary"
        >
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </Button>
      )}
    </div>
  );
}

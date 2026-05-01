
"use client";

import { PiggyBank as PiggyIcon, Coins, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PiggyBankProps {
  animationType: 'income' | 'expense' | null;
}

export function PiggyBank({ animationType }: PiggyBankProps) {
  const [impact, setImpact] = useState(false);

  useEffect(() => {
    if (animationType) {
      setImpact(true);
      const timer = setTimeout(() => setImpact(false), 600);
      return () => clearTimeout(timer);
    }
  }, [animationType]);

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* Decorative Background Glow */}
      <div className={cn(
        "absolute w-24 h-24 rounded-full blur-3xl transition-colors duration-700 opacity-20",
        animationType === 'income' ? 'bg-yellow-400' : 
        animationType === 'expense' ? 'bg-destructive' : 'bg-primary'
      )} />

      <div className="relative">
        {/* Animated Coins Background Layer */}
        {animationType === 'income' && (
          <div className="absolute inset-0 flex justify-center pointer-events-none -top-12">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="absolute animate-coin-physics-in text-yellow-500"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  left: `${(i - 2) * 20}px` 
                }}
              >
                <Coins className="h-4 w-4 fill-current drop-shadow-lg" />
              </div>
            ))}
          </div>
        )}

        {/* The Piggy Bank - Lowered Z-Index to stay behind header/menus */}
        <div className={cn(
          "relative z-10 p-4 bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-white/20 ios-shadow transition-all duration-500",
          impact && "animate-piggy-impact",
          animationType === 'income' ? 'ring-2 ring-yellow-400/30' : 
          animationType === 'expense' ? 'ring-2 ring-destructive/30' : ''
        )}>
          <PiggyIcon 
            className={cn(
              "h-10 w-10 transition-colors duration-300",
              animationType === 'income' ? 'text-yellow-600' : 
              animationType === 'expense' ? 'text-destructive' : 'text-primary'
            )} 
            strokeWidth={1.5} 
          />
          
          {impact && (
            <div className="absolute -top-1 -right-1 text-yellow-400">
              <Sparkle className="h-4 w-4 animate-pulse" />
            </div>
          )}
        </div>

        {/* Falling Coins Layer */}
        {animationType === 'expense' && (
          <div className="absolute inset-0 flex justify-center pointer-events-none top-12">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="absolute animate-coin-physics-out text-primary/40"
                style={{ 
                  animationDelay: `${i * 0.25}s`,
                  left: `${(i - 2) * 15}px` 
                }}
              >
                <Coins className="h-3 w-3 fill-current" />
              </div>
            ))}
          </div>
        )}

        {/* Pedestal Effect */}
        <div className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-2 rounded-[100%] blur-md transition-colors duration-500",
          animationType === 'income' ? 'bg-yellow-400/40' : 
          animationType === 'expense' ? 'bg-destructive/40' : 'bg-primary/20'
        )} />
      </div>
      
      <div className="mt-3 flex flex-col items-center gap-1">
        <p className={cn(
          "text-[8px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
          animationType ? "opacity-100 scale-105" : "opacity-40"
        )}>
          {animationType === 'income' ? 'Wealth Growing' : 
           animationType === 'expense' ? 'Balance Moving' : 'Active Portfolio'}
        </p>
      </div>
    </div>
  );
}

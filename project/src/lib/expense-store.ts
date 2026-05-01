"use client";

import { useState, useEffect, useCallback } from 'react';

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
};

export function useExpenseStore() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cashflow-ai-expenses');
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load expenses', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveExpenses = useCallback((newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('cashflow-ai-expenses', JSON.stringify(newExpenses));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 9),
    };
    saveExpenses([newExpense, ...expenses]);
    return newExpense;
  }, [expenses, saveExpenses]);

  const updateExpense = useCallback((id: string, updated: Partial<Expense>) => {
    saveExpenses(expenses.map(e => e.id === id ? { ...e, ...updated } : e));
  }, [expenses, saveExpenses]);

  const deleteExpense = useCallback((id: string) => {
    saveExpenses(expenses.filter(e => e.id !== id));
  }, [expenses, saveExpenses]);

  return {
    expenses,
    isLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
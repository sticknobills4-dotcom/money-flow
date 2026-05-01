import { 
  collection, 
  doc, 
  Firestore, 
  serverTimestamp,
  query,
  orderBy,
  runTransaction,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface TransactionData {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  accountId: string;
  toAccountId?: string;
}

export interface AccountData {
  name: string;
  balance: number;
  type: 'Bank' | 'Cash' | 'Credit Card' | 'Other';
}

export interface BudgetData {
  category: string;
  limitAmount: number;
  month: number;
  year: number;
}

/**
 * Adds a new transaction and updates account balances atomically.
 */
export async function addTransaction(db: Firestore, userId: string, data: TransactionData) {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  const accountRef = doc(db, 'users', userId, 'accounts', data.accountId);
  const toAccountRef = data.toAccountId ? doc(db, 'users', userId, 'accounts', data.toAccountId) : null;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Get the source account
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists()) {
        throw new Error("Source account does not exist!");
      }

      const currentBalance = accountDoc.data().balance;
      let newBalance = currentBalance;

      // 2. Calculate new balance for source account
      if (data.type === 'expense' || data.type === 'transfer') {
        newBalance -= data.amount;
      } else if (data.type === 'income') {
        newBalance += data.amount;
      }

      // 3. Update source account balance
      transaction.update(accountRef, { balance: newBalance });

      // 4. Handle destination account for transfers
      if (data.type === 'transfer' && toAccountRef) {
        const toAccountDoc = await transaction.get(toAccountRef);
        if (!toAccountDoc.exists()) {
          throw new Error("Destination account does not exist!");
        }
        const toNewBalance = toAccountDoc.data().balance + data.amount;
        transaction.update(toAccountRef, { balance: toNewBalance });
      }

      // 5. Add the transaction record - Sanitize data to avoid 'undefined' values
      const newTransactionRef = doc(transactionsRef);
      const transactionToSave: any = {
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date,
        accountId: data.accountId,
        createdAt: serverTimestamp(),
      };
      
      if (data.type === 'transfer' && data.toAccountId) {
        transactionToSave.toAccountId = data.toAccountId;
      }

      transaction.set(newTransactionRef, transactionToSave);
    });
  } catch (error: any) {
    console.error("Transaction failed: ", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `users/${userId}/transactions`,
      operation: 'write',
      requestResourceData: data,
    }));
  }
}

/**
 * Helper for AI chat to quickly add an expense to the first available account.
 * If no accounts exist, it creates a default "Cash" account.
 */
export async function addQuickExpense(db: Firestore, userId: string, data: Omit<TransactionData, 'type' | 'accountId'>) {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  const accountsSnap = await getDocs(query(accountsRef, limit(1)));
  
  let accountId: string;

  if (accountsSnap.empty) {
    // Create a default account if none exists
    const newAccountRef = await addDoc(accountsRef, {
      name: 'Cash',
      balance: 0,
      type: 'Cash',
      createdAt: serverTimestamp(),
    });
    accountId = newAccountRef.id;
  } else {
    accountId = accountsSnap.docs[0].id;
  }

  return addTransaction(db, userId, {
    ...data,
    type: 'expense',
    accountId
  });
}

/**
 * Adds a new financial account.
 */
export async function addAccount(db: Firestore, userId: string, data: AccountData) {
  const accountsRef = collection(db, 'users', userId, 'accounts');
  return addDoc(accountsRef, {
    ...data,
    createdAt: serverTimestamp(),
  }).catch((error) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `users/${userId}/accounts`,
      operation: 'create',
      requestResourceData: data,
    }));
  });
}

/**
 * Sets or updates a budget.
 */
export async function setBudget(db: Firestore, userId: string, data: BudgetData) {
  const budgetId = `${data.category}-${data.year}-${data.month}`;
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId);
  return setDoc(budgetRef, data).catch((error) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `users/${userId}/budgets/${budgetId}`,
      operation: 'write',
      requestResourceData: data,
    }));
  });
}

/**
 * Deletes a budget.
 */
export async function deleteBudget(db: Firestore, userId: string, budgetId: string) {
  const budgetRef = doc(db, 'users', userId, 'budgets', budgetId);
  return deleteDoc(budgetRef).catch((error) => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: `users/${userId}/budgets/${budgetId}`,
      operation: 'delete',
    }));
  });
}

/**
 * Queries
 */
export function getTransactionsQuery(db: Firestore, userId: string) {
  return query(collection(db, 'users', userId, 'transactions'), orderBy('date', 'desc'));
}

export function getAccountsQuery(db: Firestore, userId: string) {
  return query(collection(db, 'users', userId, 'accounts'), orderBy('name', 'asc'));
}

export function getBudgetsQuery(db: Firestore, userId: string) {
  return query(collection(db, 'users', userId, 'budgets'), orderBy('category', 'asc'));
}
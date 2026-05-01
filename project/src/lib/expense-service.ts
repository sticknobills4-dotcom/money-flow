import { 
  collection, 
  addDoc, 
  Firestore, 
  serverTimestamp
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type ExpenseData = {
  amount: number;
  category: string;
  description: string;
  date: string;
};

/**
 * Adds a new expense to the user's transaction subcollection.
 */
export function addExpense(db: Firestore, userId: string, data: ExpenseData) {
  const transactionsRef = collection(db, 'users', userId, 'transactions');
  
  addDoc(transactionsRef, {
    ...data,
    type: 'expense',
    accountId: 'manual-entry',
    createdAt: serverTimestamp(),
  }).catch((error) => {
    const permissionError = new FirestorePermissionError({
      path: `users/${userId}/transactions`,
      operation: 'create',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

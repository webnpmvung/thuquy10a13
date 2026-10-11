import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, StudentMember, ClassSettings, AuditLog } from '../types/fund';
import { DEFAULT_SETTINGS, DEFAULT_STUDENTS, DEFAULT_TRANSACTIONS, DEFAULT_AUDIT_LOGS } from '../data/initialData';

// ==================== 0. UTILITY WIPE & CLEAR FUNCTIONS ====================

export async function clearFirestoreCollection(collectionName: string): Promise<void> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return;
    
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 400);
      chunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error clearing collection ${collectionName}:`, err);
  }
}

export async function clearAllClassDataFromFirestore(): Promise<void> {
  try {
    await deleteDoc(doc(db, 'class_fund', 'transactions'));
    await deleteDoc(doc(db, 'class_fund', 'students'));
    await deleteDoc(doc(db, 'class_fund', 'auditLogs'));
    await deleteDoc(doc(db, 'class_fund', 'settings'));
  } catch (_) {}

  await clearFirestoreCollection('transactions');
  await clearFirestoreCollection('students');
  await clearFirestoreCollection('audit_logs');
}

// ==================== 1. TRANSACTIONS ====================

export function subscribeTransactions(
  onData: (transactions: Transaction[]) => void,
  onError?: (error: any) => void
): () => void {
  const txCollection = collection(db, 'transactions');

  const unsubscribe = onSnapshot(txCollection, async (snapshot) => {
    try {
      if (!snapshot.empty) {
        const list: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Transaction;
          list.push({ ...data, id: docSnap.id });
        });

        // Sort by date desc, time desc
        list.sort((a, b) => {
          const comp = (b.date || '').localeCompare(a.date || '');
          if (comp !== 0) return comp;
          return (b.time || '').localeCompare(a.time || '');
        });

        onData(list);
      } else {
        // If collection 'transactions' is empty, check legacy 'class_fund/transactions'
        try {
          const legacySnap = await getDoc(doc(db, 'class_fund', 'transactions'));
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data()?.data;
            if (Array.isArray(legacyData) && legacyData.length > 0) {
              console.log('Migrating legacy transactions into individual Firestore documents...', legacyData.length);
              for (const t of legacyData) {
                if (t && t.id) {
                  await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
                }
              }
              onData(legacyData);
              return;
            }
          }
        } catch (migErr) {
          console.warn('Legacy migration check notice:', migErr);
        }

        // Collection is empty -> User deleted or wiped data
        onData([]);
      }
    } catch (err) {
      console.error('Error in transactions snapshot processing:', err);
      if (onError) onError(err);
    }
  }, (err) => {
    console.error('Firestore transactions snapshot error:', err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

export async function saveSingleTransaction(transaction: Transaction): Promise<void> {
  if (!transaction || !transaction.id) return;
  // Clean undefined fields for Firestore
  const cleanData = JSON.parse(JSON.stringify(transaction));
  await setDoc(doc(db, 'transactions', transaction.id), cleanData, { merge: true });
}

export async function deleteSingleTransaction(
  transactionId: string, 
  softDelete: boolean = true, 
  auditData?: Partial<Transaction>
): Promise<void> {
  if (!transactionId) return;
  if (softDelete) {
    const updatePayload: any = {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      ...(auditData || {})
    };
    await setDoc(doc(db, 'transactions', transactionId), updatePayload, { merge: true });
  } else {
    await deleteDoc(doc(db, 'transactions', transactionId));
  }
}

export async function batchSaveTransactions(transactions: Transaction[]): Promise<void> {
  if (!Array.isArray(transactions) || transactions.length === 0) return;
  for (const t of transactions) {
    if (t && t.id) {
      const clean = JSON.parse(JSON.stringify(t));
      await setDoc(doc(db, 'transactions', t.id), clean, { merge: true });
    }
  }
}

// ==================== 2. STUDENTS ====================

export function subscribeStudents(
  onData: (students: StudentMember[]) => void,
  onError?: (error: any) => void
): () => void {
  const studentsCollection = collection(db, 'students');

  const unsubscribe = onSnapshot(studentsCollection, async (snapshot) => {
    try {
      if (!snapshot.empty) {
        const list: StudentMember[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as StudentMember;
          list.push({ ...data, id: docSnap.id });
        });

        // Sort by stt asc
        list.sort((a, b) => (a.stt || 0) - (b.stt || 0));
        onData(list);
      } else {
        // Fallback to legacy 'class_fund/students'
        try {
          const legacySnap = await getDoc(doc(db, 'class_fund', 'students'));
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data()?.data;
            if (Array.isArray(legacyData) && legacyData.length > 0) {
              for (const s of legacyData) {
                if (s && s.id) {
                  await setDoc(doc(db, 'students', s.id), s, { merge: true });
                }
              }
              onData(legacyData);
              return;
            }
          }
        } catch (_) {}

        // Collection is empty -> User deleted or wiped data
        onData([]);
      }
    } catch (err) {
      console.error('Error in students snapshot:', err);
      if (onError) onError(err);
    }
  }, (err) => {
    console.error('Firestore students snapshot error:', err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

export async function saveSingleStudent(student: StudentMember): Promise<void> {
  if (!student || !student.id) return;
  const clean = JSON.parse(JSON.stringify(student));
  await setDoc(doc(db, 'students', student.id), clean, { merge: true });
}

export async function batchSaveStudents(students: StudentMember[]): Promise<void> {
  if (!Array.isArray(students) || students.length === 0) return;
  for (const s of students) {
    if (s && s.id) {
      const clean = JSON.parse(JSON.stringify(s));
      await setDoc(doc(db, 'students', s.id), clean, { merge: true });
    }
  }
}

// ==================== 3. SETTINGS ====================

export function subscribeSettings(
  onData: (settings: ClassSettings) => void,
  onError?: (error: any) => void
): () => void {
  const settingsDocRef = doc(db, 'settings', 'config');

  const unsubscribe = onSnapshot(settingsDocRef, async (snapshot) => {
    try {
      if (snapshot.exists()) {
        const data = snapshot.data() as ClassSettings;
        const merged: ClassSettings = { 
          ...DEFAULT_SETTINGS, 
          ...data,
          sheetConfig: {
            ...DEFAULT_SETTINGS.sheetConfig,
            ...(data.sheetConfig || {}),
          },
          fundCampaign: {
            ...DEFAULT_SETTINGS.fundCampaign,
            ...(data.fundCampaign || {}),
          }
        };
        if (!merged.adminGoogleEmails || merged.adminGoogleEmails.length === 0) {
          merged.adminGoogleEmails = ['webnpmvung1@gmail.com'];
        } else if (!merged.adminGoogleEmails.map(e => e.toLowerCase().trim()).includes('webnpmvung1@gmail.com')) {
          merged.adminGoogleEmails = [...merged.adminGoogleEmails, 'webnpmvung1@gmail.com'];
        }
        if (!merged.treasurerGoogleEmails) {
          merged.treasurerGoogleEmails = [];
        }
        onData(merged);
      } else {
        // Check legacy 'class_fund/settings'
        try {
          const legacySnap = await getDoc(doc(db, 'class_fund', 'settings'));
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data()?.data;
            if (legacyData) {
              await setDoc(settingsDocRef, legacyData, { merge: true });
              onData({ ...DEFAULT_SETTINGS, ...legacyData });
              return;
            }
          }
        } catch (_) {}

        await saveClassSettings(DEFAULT_SETTINGS);
        await batchSaveStudents(DEFAULT_STUDENTS);
        await batchSaveTransactions(DEFAULT_TRANSACTIONS);
        await saveSingleAuditLog(DEFAULT_AUDIT_LOGS[0]);
        onData(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error('Error in settings snapshot:', err);
      if (onError) onError(err);
    }
  }, (err) => {
    console.error('Firestore settings snapshot error:', err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

export async function saveClassSettings(settings: ClassSettings): Promise<void> {
  if (!settings) return;
  const clean = JSON.parse(JSON.stringify(settings));
  await setDoc(doc(db, 'settings', 'config'), clean, { merge: true });
  // Also keep legacy doc in sync
  try {
    await setDoc(doc(db, 'class_fund', 'settings'), { data: clean });
  } catch (_) {}
}

// ==================== 4. AUDIT LOGS ====================

export function subscribeAuditLogs(
  onData: (logs: AuditLog[]) => void,
  onError?: (error: any) => void
): () => void {
  const logsCollection = collection(db, 'audit_logs');

  const unsubscribe = onSnapshot(logsCollection, async (snapshot) => {
    try {
      if (!snapshot.empty) {
        const list: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as AuditLog), id: docSnap.id });
        });
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        onData(list);
      } else {
        // Fallback to legacy
        try {
          const legacySnap = await getDoc(doc(db, 'class_fund', 'auditLogs'));
          if (legacySnap.exists()) {
            const legacyData = legacySnap.data()?.data;
            if (Array.isArray(legacyData) && legacyData.length > 0) {
              for (const l of legacyData) {
                if (l && l.id) {
                  await setDoc(doc(db, 'audit_logs', l.id), l, { merge: true });
                }
              }
              onData(legacyData);
              return;
            }
          }
        } catch (_) {}

        onData([]);
      }
    } catch (err) {
      console.error('Error in audit logs snapshot:', err);
      if (onError) onError(err);
    }
  }, (err) => {
    console.error('Firestore audit logs snapshot error:', err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

export async function saveSingleAuditLog(log: AuditLog): Promise<void> {
  if (!log || !log.id) return;
  const clean = JSON.parse(JSON.stringify(log));
  await setDoc(doc(db, 'audit_logs', log.id), clean, { merge: true });
}

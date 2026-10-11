import { ClassSettings, StudentMember, Transaction, AuditLog } from '../types/fund';
import { DEFAULT_SETTINGS, DEFAULT_STUDENTS, DEFAULT_TRANSACTIONS, DEFAULT_AUDIT_LOGS } from '../data/initialData';
import { 
  batchSaveTransactions, 
  saveClassSettings, 
  batchSaveStudents, 
  saveSingleAuditLog,
  clearFirestoreCollection 
} from '../services/firestoreService';

/**
 * Online Cloud Data Service (Zero LocalStorage / Zero Temporary Browser Memory)
 * All persistence is performed directly on Google Cloud Firestore.
 */

const CACHE_SETTINGS_KEY = 'fund_settings_10a13_cache';

export function loadSettings(): ClassSettings {
  try {
    const cached = localStorage.getItem(CACHE_SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ClassSettings): void {
  try {
    localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
  saveClassSettings(settings).catch(e => console.error("Firestore Save Settings Error:", e));
}

export function loadStudents(): StudentMember[] {
  return DEFAULT_STUDENTS;
}

export function saveStudents(students: StudentMember[]): void {
  if (Array.isArray(students) && students.length > 0) {
    batchSaveStudents(students).catch(e => console.error("Firestore Save Students Error:", e));
  }
}

export function loadTransactions(): Transaction[] {
  return DEFAULT_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  if (Array.isArray(transactions) && transactions.length > 0) {
    batchSaveTransactions(transactions).catch(e => console.error("Firestore Save TX Error:", e));
  }
}

export function loadAuditLogs(): AuditLog[] {
  return DEFAULT_AUDIT_LOGS;
}

export function saveAuditLogs(logs: AuditLog[]): void {
  if (Array.isArray(logs) && logs.length > 0) {
    const latest = logs[0];
    if (latest) {
      saveSingleAuditLog(latest).catch(e => console.error("Firestore Save Audit Error:", e));
    }
  }
}

/**
 * Export active online dataset to JSON file for offline backup
 */
export function exportBackupData(
  activeSettings: ClassSettings = DEFAULT_SETTINGS,
  activeStudents: StudentMember[] = [],
  activeTransactions: Transaction[] = [],
  activeAuditLogs: AuditLog[] = []
): string {
  const data = {
    version: '3.0-firestore-online',
    exportDate: new Date().toISOString(),
    settings: activeSettings,
    students: activeStudents,
    transactions: activeTransactions,
    auditLogs: activeAuditLogs,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import JSON backup directly into Firestore online
 */
export async function importBackupData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) {
      await saveClassSettings(data.settings);
    }
    if (Array.isArray(data.students)) {
      await clearFirestoreCollection('students');
      if (data.students.length > 0) {
        await batchSaveStudents(data.students);
      }
    }
    if (Array.isArray(data.transactions)) {
      await clearFirestoreCollection('transactions');
      if (data.transactions.length > 0) {
        await batchSaveTransactions(data.transactions);
      }
    }
    if (Array.isArray(data.auditLogs)) {
      await clearFirestoreCollection('audit_logs');
      if (data.auditLogs.length > 0) {
        for (const log of data.auditLogs) {
          if (log && log.id) {
            await saveSingleAuditLog(log);
          }
        }
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup data to Firestore', e);
    return false;
  }
}

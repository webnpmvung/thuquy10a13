import React, { useEffect } from 'react';
import { 
  subscribeTransactions, 
  subscribeStudents, 
  subscribeSettings, 
  subscribeAuditLogs 
} from '../services/firestoreService';
import { ClassSettings, StudentMember, Transaction, AuditLog } from '../types/fund';
import isEqual from 'lodash/isEqual';

interface Props {
  setSettings: React.Dispatch<React.SetStateAction<ClassSettings>>;
  setStudents: React.Dispatch<React.SetStateAction<StudentMember[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  isRemoteSyncingRef?: React.MutableRefObject<boolean>;
  onConnectionStatus?: (connected: boolean) => void;
  onInitialDataLoaded?: () => void;
}

export const FirebaseSync: React.FC<Props> = ({ 
  setSettings, 
  setStudents, 
  setTransactions, 
  setAuditLogs, 
  isRemoteSyncingRef,
  onConnectionStatus,
  onInitialDataLoaded
}) => {
  const loadedFlags = React.useRef({ tx: false, students: false, settings: false });
  const hasTriggeredInitialLoaded = React.useRef(false);

  const checkLoaded = () => {
    if (hasTriggeredInitialLoaded.current) return;
    if (loadedFlags.current.tx && loadedFlags.current.students && loadedFlags.current.settings) {
      hasTriggeredInitialLoaded.current = true;
      if (onInitialDataLoaded) {
        onInitialDataLoaded();
      }
    }
  };

  useEffect(() => {
    // 1. Transactions subscription (per-document Firestore collection)
    const unsubTx = subscribeTransactions(
      (txList) => {
        if (isRemoteSyncingRef) isRemoteSyncingRef.current = true;
        setTransactions((prev) => isEqual(prev, txList) ? prev : txList);
        if (onConnectionStatus) onConnectionStatus(true);
        loadedFlags.current.tx = true;
        checkLoaded();
      },
      (err) => {
        console.error('FirebaseSync TX error:', err);
        if (onConnectionStatus) onConnectionStatus(false);
      }
    );

    // 2. Students subscription
    const unsubStudents = subscribeStudents(
      (studentList) => {
        if (isRemoteSyncingRef) isRemoteSyncingRef.current = true;
        setStudents((prev) => isEqual(prev, studentList) ? prev : studentList);
        loadedFlags.current.students = true;
        checkLoaded();
      },
      (err) => console.error('FirebaseSync Students error:', err)
    );

    // 3. Settings subscription
    const unsubSettings = subscribeSettings(
      (settingsData) => {
        if (isRemoteSyncingRef) isRemoteSyncingRef.current = true;
        try {
          localStorage.setItem('fund_settings_10a13_cache', JSON.stringify(settingsData));
        } catch {}
        setSettings((prev) => isEqual(prev, settingsData) ? prev : settingsData);
        loadedFlags.current.settings = true;
        checkLoaded();
      },
      (err) => console.error('FirebaseSync Settings error:', err)
    );

    // 4. Audit logs subscription
    const unsubAudit = subscribeAuditLogs(
      (logs) => {
        if (isRemoteSyncingRef) isRemoteSyncingRef.current = true;
        setAuditLogs((prev) => isEqual(prev, logs) ? prev : logs);
      },
      (err) => console.error('FirebaseSync Audit error:', err)
    );

    return () => {
      unsubTx();
      unsubStudents();
      unsubSettings();
      unsubAudit();
    };
  }, [setSettings, setStudents, setTransactions, setAuditLogs, isRemoteSyncingRef, onConnectionStatus]);

  return null;
};

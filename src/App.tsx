import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Receipt, 
  Users, 
  BarChart3, 
  Plus, 
  Sparkles, 
  Share2, 
  FileSpreadsheet, 
  Eye, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle,
  Clock,
  RefreshCw,
  History,
  Image as ImageIcon,
  Banknote,
  UserCheck,
  Database,
  X
} from 'lucide-react';

import { 
  ClassSettings, 
  StudentMember, 
  Transaction, 
  TransactionType, 
  UserRole,
  AuditLog,
  AuthUserProfile 
} from './types/fund';
import { 
  DEFAULT_SETTINGS, 
  DEFAULT_STUDENTS, 
  DEFAULT_TRANSACTIONS, 
  DEFAULT_AUDIT_LOGS 
} from './data/initialData';
import { 
  saveSingleTransaction, 
  deleteSingleTransaction, 
  saveSingleAuditLog, 
  saveSingleStudent, 
  batchSaveStudents,
  batchSaveTransactions,
  saveClassSettings,
  clearFirestoreCollection,
  clearAllClassDataFromFirestore 
} from './services/firestoreService';
import { auth, getRedirectResult, signOutUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { formatVND, getTodayDateString, getCurrentTimeString } from './utils/formatters';
import { exportBackupData, loadSettings, saveSettings } from './utils/storage';

// Components
import { Navbar } from './components/Navbar';
import { OverviewCards } from './components/OverviewCards';
import { TransactionList } from './components/TransactionList';
import { ReportsTab } from './components/ReportsTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { SharePublicLinkModal } from './components/SharePublicLinkModal';
import { SettingsModal } from './components/SettingsModal';
import { RoleAuthModal } from './components/RoleAuthModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AdminActionConfirmModal } from './components/AdminActionConfirmModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { ReceiptGalleryModal } from './components/ReceiptGalleryModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';

import { FirebaseSync } from './components/FirebaseSync';

export default function App() {
  // Main State (Online 100% via Cloud Firestore, zero localStorage)
  const [settings, setSettings] = useState<ClassSettings>(() => loadSettings());
  const [students, setStudents] = useState<StudentMember[]>(() => DEFAULT_STUDENTS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Role: 'viewer' (Cả lớp chỉ xem) | 'treasurer' (Thủ quỹ chỉ thêm) | 'admin' (Admin có quyền sửa/xóa có ghi chú)
  const [currentRole, setCurrentRole] = useState<UserRole>('viewer');

  // Google Auth User profile
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');

  // Modals state
  const [isRoleAuthModalOpen, setIsRoleAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAdminConfirmModalOpen, setIsAdminConfirmModalOpen] = useState(false);
  const [adminActionType, setAdminActionType] = useState<'edit' | 'delete'>('delete');
  const [targetTransactionForAdmin, setTargetTransactionForAdmin] = useState<Transaction | null>(null);

  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReceiptGalleryOpen, setIsReceiptGalleryOpen] = useState(false);
  const [isFirebaseSetupModalOpen, setIsFirebaseSetupModalOpen] = useState(false);

  const [viewingReceipt, setViewingReceipt] = useState<{
    imageUrl: string;
    title: string;
    images?: {url: string; timestamp: string}[];
    amount?: number;
    date?: string;
    recordedBy?: string;
  } | null>(null);

  // Auto Logout after 2 minutes of inactivity (Bảo mật sổ quỹ)
  const [autoLogoutWarningSeconds, setAutoLogoutWarningSeconds] = useState<number | null>(null);
  const [autoLogoutNotice, setAutoLogoutNotice] = useState<string | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());

  // Inactivity timeout: 2 minutes = 120,000ms
  useEffect(() => {
    // Only track inactivity if user is logged in (has non-viewer role or logged-in Google profile)
    const isLoggedIn = Boolean(currentUser || currentRole !== 'viewer');
    if (!isLoggedIn) {
      setAutoLogoutWarningSeconds(null);
      return;
    }

    lastActivityTimeRef.current = Date.now();

    const recordUserActivity = () => {
      lastActivityTimeRef.current = Date.now();
      setAutoLogoutWarningSeconds((prev) => (prev !== null ? null : prev));
    };

    // User activity events: mouse move, touch, keyboard, scroll, click
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    let lastThrottledTime = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastThrottledTime > 500) {
        lastThrottledTime = now;
        recordUserActivity();
      }
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, throttledHandler, { passive: true });
    });

    const INACTIVITY_LIMIT_MS = 2 * 60 * 1000; // 2 minutes
    const WARNING_THRESHOLD_MS = 15 * 1000; // 15 seconds warning before logout

    const intervalId = setInterval(async () => {
      const idleTime = Date.now() - lastActivityTimeRef.current;
      const remainingMs = INACTIVITY_LIMIT_MS - idleTime;

      if (remainingMs <= 0) {
        // Inactive for 2 minutes -> Auto logout now!
        clearInterval(intervalId);
        setAutoLogoutWarningSeconds(null);
        try {
          await signOutUser();
        } catch (err) {
          console.warn('Auto signout error:', err);
        }
        setCurrentUser(null);
        setCurrentRole('viewer');

        // Close all editing and privileged modals
        setIsSettingsModalOpen(false);
        setIsAddModalOpen(false);
        setIsSheetModalOpen(false);
        setIsAuditModalOpen(false);
        setIsAdminConfirmModalOpen(false);
        setIsFirebaseSetupModalOpen(false);

        // Display notice
        setAutoLogoutNotice('Hệ thống đã tự động đăng xuất sau 2 phút không sử dụng để bảo vệ an toàn sổ quỹ lớp!');
      } else if (remainingMs <= WARNING_THRESHOLD_MS) {
        const remainingSec = Math.ceil(remainingMs / 1000);
        setAutoLogoutWarningSeconds(remainingSec);
      } else {
        setAutoLogoutWarningSeconds(null);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, throttledHandler);
      });
    };
  }, [currentUser, currentRole]);

  // Auto dismiss logout notice after 8 seconds
  useEffect(() => {
    if (autoLogoutNotice) {
      const timer = setTimeout(() => setAutoLogoutNotice(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [autoLogoutNotice]);

  // Lock background body scroll whenever any modal is open to eliminate duplicate scrollbars
  const isAnyModalOpen = Boolean(
    isRoleAuthModalOpen ||
    isAddModalOpen ||
    isAuditModalOpen ||
    isAdminConfirmModalOpen ||
    isSheetModalOpen ||
    isShareModalOpen ||
    isSettingsModalOpen ||
    isReceiptGalleryOpen ||
    isFirebaseSetupModalOpen ||
    viewingReceipt
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isAnyModalOpen]);

  // 1. Google Authentication listener & role auto-resolution
  useEffect(() => {
    // Check if returning from a Google OAuth redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Handled by onAuthStateChanged
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result note:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const profile: AuthUserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setCurrentUser(profile);

        // Check if user's email matches admin or treasurer lists
        const userEmail = (user.email || '').toLowerCase().trim();
        const adminEmails = (settings.adminGoogleEmails || []).map(e => e.toLowerCase().trim());
        const treasurerEmails = (settings.treasurerGoogleEmails || []).map(e => e.toLowerCase().trim());

        if (adminEmails.includes(userEmail)) {
          setCurrentRole('admin');
        } else if (treasurerEmails.includes(userEmail)) {
          setCurrentRole('treasurer');
        } else {
          setCurrentRole('viewer');
        }
      } else {
        setCurrentUser(null);
        setCurrentRole('viewer');
      }
    });

    return () => unsubscribe();
  }, [settings.adminGoogleEmails, settings.treasurerGoogleEmails]);

  // Guard for opening Firestore Setup
  const handleOpenFirebaseSetup = () => {
    if (currentRole !== 'admin') {
      alert('Chỉ tài khoản Quản trị viên (Admin) đăng nhập qua Google mới có quyền truy cập cấu hình Firestore.');
      return;
    }
    setIsFirebaseSetupModalOpen(true);
  };

  // 2. Sync from URL params on load (e.g. public shared link)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'class_10a13' || params.get('mode') === 'view') {
        setCurrentRole('viewer');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 3. Tự động sao lưu dữ liệu ngầm (Auto-Backup) định kỳ lên Google Drive mỗi ngày một lần cho Admin
  const hasAttemptedDailyBackupRef = useRef(false);

  useEffect(() => {
    // Điều kiện: Dữ liệu đã load xong từ Firestore VÀ người dùng đang có quyền Admin
    if (!isFirestoreLoaded) return;
    if (currentRole !== 'admin') return;

    const appsScriptUrl = settings.sheetConfig?.appsScriptImageUrl?.trim();
    if (!appsScriptUrl) return;

    // Lấy ngày hôm nay theo định dạng YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Kiểm tra localStorage xem biến last_drive_backup_date có khác với ngày hôm nay không
    const lastBackupDate = localStorage.getItem('last_drive_backup_date');
    if (lastBackupDate === todayStr) {
      // Đã sao lưu trong ngày hôm nay rồi, không cần chạy lại
      return;
    }

    if (hasAttemptedDailyBackupRef.current) {
      return;
    }
    hasAttemptedDailyBackupRef.current = true;

    // Tiến hành sao lưu hoàn toàn ngầm (silent)
    const runSilentAutoBackup = async () => {
      try {
        const backupContent = exportBackupData(settings, students, transactions, auditLogs);
        const folderId = settings.sheetConfig?.driveFolderId?.trim() || '1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4';
        const fileName = `Backup_SoQuy_10A13_${year}${month}${day}.json`;

        // Đánh dấu ngay vào localStorage để không gửi lặp lại trong cùng 1 ngày
        localStorage.setItem('last_drive_backup_date', todayStr);

        // Gửi request fetch ngầm (mode: 'no-cors')
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'backup_data',
            backupContent,
            folderId,
            fileName,
          }),
        });

        console.log(`[Auto-Backup] Tự động sao lưu dữ liệu ngày ${todayStr} lên Google Drive ngầm thành công.`);
      } catch (err) {
        // Hoàn toàn chạy ngầm (silent), không hiển thị popup báo lỗi hay làm gián đoạn trải nghiệm của Admin
        console.warn('[Auto-Backup] Lỗi sao lưu ngầm lên Google Drive:', err);
      }
    };

    runSilentAutoBackup();
  }, [isFirestoreLoaded, currentRole, settings, students, transactions, auditLogs]);

  const isRemoteSyncingRef = useRef(false);

  // Calculations
  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.isDeleted);
  }, [transactions]);

  const deletedTransactions = useMemo(() => {
    return transactions.filter((t) => t.isDeleted);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    return activeTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [activeTransactions]);

  const totalExpense = useMemo(() => {
    return activeTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [activeTransactions]);

  const currentBalance = totalIncome - totalExpense;
  const paidStudentsCount = students.filter((s) => s.hasPaid).length;
  const receiptsCount = activeTransactions.filter((t) => t.receiptImage || (t.receiptImages && t.receiptImages.length > 0)).length;

  // Open Add Transaction Modal
  const handleOpenAddModal = (type: 'income' | 'expense') => {
    setAddModalType(type);
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Transaction (Only Admin can trigger this)
  const handleAdminRequestEdit = (tx: Transaction) => {
    if (currentRole !== 'admin') {
      alert('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa giao dịch!');
      return;
    }
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  // Open Delete Transaction (Only Admin can trigger this)
  const handleAdminRequestDelete = (tx: Transaction) => {
    if (currentRole !== 'admin') {
      alert('Chỉ Quản trị viên (Admin) mới có quyền xóa giao dịch!');
      return;
    }
    setTargetTransactionForAdmin(tx);
    setAdminActionType('delete');
    setIsAdminConfirmModalOpen(true);
  };

  // Confirm Delete Transaction with required Reason
  const handleConfirmAdminDelete = async (reason: string) => {
    if (!targetTransactionForAdmin) return;
    const tx = targetTransactionForAdmin;
    const nowStr = `${getTodayDateString()} ${getCurrentTimeString()}`;
    const performer = currentUser?.displayName 
      ? `${currentUser.displayName} (Admin)`
      : settings.adminName || 'Admin (Quản trị viên)';

    // Update locally
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === tx.id
          ? {
              ...t,
              isDeleted: true,
              deletedAt: nowStr,
              deletedBy: performer,
              deleteReason: reason,
            }
          : t
      )
    );

    // Add entry to Audit Log
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      transactionId: tx.id,
      action: 'deleted',
      performedBy: performer,
      timestamp: nowStr,
      reason,
      snapshotTitle: tx.title,
      snapshotAmount: tx.amount,
      snapshotCategory: tx.category,
      snapshotDate: tx.date,
      details: `Đã xóa giao dịch ${tx.type === 'income' ? 'thu' : 'chi'} ${formatVND(tx.amount)} khỏi sổ quỹ.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    setTargetTransactionForAdmin(null);

    // Save directly to Firestore collection
    try {
      await deleteSingleTransaction(tx.id, true, {
        deletedAt: nowStr,
        deletedBy: performer,
        deleteReason: reason
      });
      await saveSingleAuditLog(newLog);
    } catch (err) {
      console.error('Firestore delete error:', err);
    }
  };

  // Save Transaction (Add new by Treasurer/Admin OR Edit by Admin)
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id'> | Transaction,
    editReason?: string
  ) => {
    const nowStr = `${getTodayDateString()} ${getCurrentTimeString()}`;
    const performer = currentUser?.displayName 
      ? currentUser.displayName 
      : currentRole === 'admin' 
      ? settings.adminName || 'Admin' 
      : settings.treasurerName || 'Thủ Quỹ';

    if ('id' in txData && txData.id) {
      if (currentRole !== 'admin') {
        alert('Chỉ tài khoản Quản trị viên (Admin) mới có quyền chỉnh sửa giao dịch!');
        return;
      }
      // Editing existing transaction
      const existing = transactions.find((t) => t.id === txData.id);
      const updatedTx: Transaction = {
        ...(txData as Transaction),
        isEdited: true,
        lastEditedAt: nowStr,
        lastEditedBy: performer,
        editReason: editReason || 'Admin điều chỉnh số liệu theo hóa đơn gốc',
        previousAmount: existing?.amount,
        previousTitle: existing?.title,
      };

      setTransactions((prev) =>
        prev.map((t) => (t.id === txData.id ? updatedTx : t))
      );

      // Add to Audit Log
      const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        transactionId: txData.id,
        action: 'updated',
        performedBy: performer,
        timestamp: nowStr,
        reason: editReason || 'Admin điều chỉnh giao dịch',
        snapshotTitle: updatedTx.title,
        snapshotAmount: updatedTx.amount,
        snapshotCategory: updatedTx.category,
        snapshotDate: updatedTx.date,
        details: `Đã cập nhật số tiền từ ${formatVND(existing?.amount || 0)} thành ${formatVND(updatedTx.amount)}.`,
      };

      setAuditLogs((prev) => [newLog, ...prev]);

      // Direct write to Firestore document
      try {
        await saveSingleTransaction(updatedTx);
        await saveSingleAuditLog(newLog);
      } catch (err) {
        console.error('Firestore save tx error:', err);
      }
    } else {
      // Adding new transaction
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
        paymentMethod: 'cash',
        recordedBy: txData.recordedBy || performer
      };

      setTransactions((prev) => [newTx, ...prev]);

      // Confetti celebration
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.8 },
      });

      // Direct write to Firestore document
      try {
        await saveSingleTransaction(newTx);
      } catch (err) {
        console.error('Firestore save new tx error:', err);
      }
    }
  };

  // Restore a deleted transaction (Admin only)
  const handleRestoreTransaction = async (tx: Transaction) => {
    const nowStr = `${getTodayDateString()} ${getCurrentTimeString()}`;
    const restoredTx: Transaction = {
      ...tx,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deleteReason: undefined,
    };

    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? restoredTx : t))
    );

    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      transactionId: tx.id,
      action: 'restored',
      performedBy: currentUser?.displayName || settings.adminName || 'Admin',
      timestamp: nowStr,
      snapshotTitle: tx.title,
      snapshotAmount: tx.amount,
      details: `Đã khôi phục giao dịch về lại sổ quỹ chính.`,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      await saveSingleTransaction(restoredTx);
      await saveSingleAuditLog(newLog);
    } catch (err) {
      console.error('Firestore restore tx error:', err);
    }
  };

  // Reset to default sample data directly on Cloud Firestore
  const handleResetData = async () => {
    isRemoteSyncingRef.current = true;
    try {
      await clearAllClassDataFromFirestore();
      
      await batchSaveTransactions(DEFAULT_TRANSACTIONS);
      await saveSingleAuditLog(DEFAULT_AUDIT_LOGS[0]);
      await batchSaveStudents(DEFAULT_STUDENTS);
      await saveClassSettings(DEFAULT_SETTINGS);

      setTransactions(DEFAULT_TRANSACTIONS);
      setAuditLogs(DEFAULT_AUDIT_LOGS);
      setStudents(DEFAULT_STUDENTS);
      setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Reset data to Firestore error:', err);
      throw err;
    } finally {
      setTimeout(() => {
        isRemoteSyncingRef.current = false;
      }, 1000);
    }
  };

  // Reset for new school year / semester
  const handleNewSemesterReset = async () => {
    isRemoteSyncingRef.current = true;
    try {
      await clearFirestoreCollection('transactions');
      await clearFirestoreCollection('audit_logs');

      const resetStudents = students.map((s) => ({
        ...s,
        hasPaid: false,
        paidAmount: 0,
        paidDate: undefined,
        cashReceiver: undefined,
        note: '',
      }));

      await clearFirestoreCollection('students');
      await batchSaveStudents(resetStudents);

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        transactionId: 'system',
        action: 'semester_reset',
        performedBy: currentRole === 'admin' ? `Admin (${settings.adminName || 'Quản trị viên'})` : 'Hệ thống',
        timestamp: new Date().toISOString(),
        details: 'Khởi tạo học kỳ mới - Chuyển toàn bộ danh sách đóng tiền học sinh về Chưa nộp, làm sạch sổ thu chi.',
      };
      await saveSingleAuditLog(newLog);

      setTransactions([]);
      setAuditLogs([newLog]);
      setStudents(resetStudents);
    } catch (err) {
      console.error('Semester reset to Firestore error:', err);
      throw err;
    } finally {
      setTimeout(() => {
        isRemoteSyncingRef.current = false;
      }, 1000);
    }
  };

  // Wipe all data completely from Firestore
  const handleWipeAllData = async () => {
    isRemoteSyncingRef.current = true;
    try {
      await clearAllClassDataFromFirestore();
      await saveClassSettings(DEFAULT_SETTINGS);

      const wipeLog: AuditLog = {
        id: 'log-' + Date.now(),
        transactionId: 'system',
        action: 'wipe_all_data',
        performedBy: currentRole === 'admin' ? `Admin (${settings.adminName || 'Quản trị viên'})` : 'Hệ thống',
        timestamp: new Date().toISOString(),
        details: 'Xóa trắng toàn bộ dữ liệu ứng dụng (Giao dịch, Học sinh, Nhật ký).',
      };
      await saveSingleAuditLog(wipeLog);

      setTransactions([]);
      setAuditLogs([wipeLog]);
      setStudents([]);
      setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Wipe data from Firestore error:', err);
      throw err;
    } finally {
      setTimeout(() => {
        isRemoteSyncingRef.current = false;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Firebase Real-Time Firestore Sync */}
      <FirebaseSync 
        setSettings={setSettings}
        setStudents={setStudents}
        setTransactions={setTransactions}
        setAuditLogs={setAuditLogs}
        isRemoteSyncingRef={isRemoteSyncingRef}
        onConnectionStatus={(status) => setIsFirebaseConnected(status)}
        onInitialDataLoaded={() => setIsFirestoreLoaded(true)}
      />

      {/* Top Navbar */}
      <Navbar
        settings={settings}
        currentRole={currentRole}
        currentUser={currentUser}
        onOpenRoleAuthModal={() => setIsRoleAuthModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenAuditLogModal={() => setIsAuditModalOpen(true)}
        onOpenReceiptGalleryModal={() => setIsReceiptGalleryOpen(true)}
        onOpenFirebaseSetupModal={handleOpenFirebaseSetup}
        auditCount={auditLogs.length}
        receiptsCount={receiptsCount}
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Overview Stats Cards & Quick Actions */}
        <OverviewCards
          balance={currentBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          paidStudentsCount={paidStudentsCount}
          totalStudentsCount={students.length}
          targetPerStudent={settings.fundCampaign.targetPerStudent || 200000}
          receiptsCount={receiptsCount}
          currentRole={currentRole}
          treasurerName={settings.treasurerName}
          treasurer2Name={settings.treasurer2Name}
          adminName={settings.adminName}
          onOpenAddModal={handleOpenAddModal}
          onOpenReceiptGallery={() => setIsReceiptGalleryOpen(true)}
          onOpenAuditModal={() => setIsAuditModalOpen(true)}
          onOpenRoleAuthModal={() => setIsRoleAuthModalOpen(true)}
        />

        {/* Navigation Tabs - Grid 2 cols, zero horizontal scrollbar! */}
        <div className="grid grid-cols-2 border border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1.5">
          <button
            id="tab-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`w-full py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer truncate ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">Sổ Thu Chi Tiền Mặt</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
              activeTab === 'transactions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {activeTransactions.length}
            </span>
          </button>

          <button
            id="tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`w-full py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer truncate ${
              activeTab === 'reports'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="truncate">Báo Cáo & Thống Kê</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            currentRole={currentRole}
            onEditTransaction={handleAdminRequestEdit}
            onDeleteTransaction={handleAdminRequestDelete}
            onViewReceipt={(imageUrl, title, images) => setViewingReceipt({ imageUrl, title, images })}
            onOpenAuditModal={() => setIsAuditModalOpen(true)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            transactions={activeTransactions}
            students={students}
            settings={settings}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Role Authentication / Google Login Modal */}
      <RoleAuthModal
        isOpen={isRoleAuthModalOpen}
        onClose={() => setIsRoleAuthModalOpen(false)}
        currentRole={currentRole}
        settings={settings}
        currentUser={currentUser}
        onSwitchRole={(newRole) => setCurrentRole(newRole)}
        onUpdateSettings={async (newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
          await saveClassSettings(newSettings);
        }}
        onOpenSettings={() => {
          setIsRoleAuthModalOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* 2. Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={addModalType}
        editingTransaction={editingTransaction}
        treasurerName={settings.treasurerName}
        adminName={settings.adminName}
        currentRole={currentRole}
        appsScriptImageUrl={settings.sheetConfig?.appsScriptImageUrl}
        driveFolderId={settings.sheetConfig?.driveFolderId}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
      />

      {/* 3. Admin Confirm Delete / Edit with Required Reason */}
      <AdminActionConfirmModal
        isOpen={isAdminConfirmModalOpen}
        onClose={() => setIsAdminConfirmModalOpen(false)}
        actionType={adminActionType}
        transaction={targetTransactionForAdmin}
        adminName={settings.adminName}
        onConfirm={handleConfirmAdminDelete}
      />

      {/* 4. Audit Log & Trash Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={auditLogs}
        deletedTransactions={deletedTransactions}
        currentRole={currentRole}
        onRestoreTransaction={handleRestoreTransaction}
        onViewReceipt={(imageUrl, title, images) => setViewingReceipt({ imageUrl, title, images })}
      />

      {/* 5. Single Receipt Image Viewer Modal (Zoom, Rotate, Download) */}
      <ReceiptViewerModal
        isOpen={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        imageUrl={viewingReceipt?.imageUrl || ''}
        images={viewingReceipt?.images || []}
        title={viewingReceipt?.title || 'Hóa đơn'}
        amount={viewingReceipt?.amount}
        date={viewingReceipt?.date}
        recordedBy={viewingReceipt?.recordedBy}
      />

      {/* 6. Receipt Gallery Modal */}
      <ReceiptGalleryModal
        isOpen={isReceiptGalleryOpen}
        onClose={() => setIsReceiptGalleryOpen(false)}
        transactions={transactions}
        onViewSingleReceipt={(imageUrl, title) => setViewingReceipt({ imageUrl, title })}
      />

      {/* 7. Google Sheets Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        settings={settings}
        currentRole={currentRole}
        onSaveSettings={async (s) => {
          setSettings(s);
          try {
            localStorage.setItem('fund_settings_10a13_cache', JSON.stringify(s));
          } catch {}
          await saveClassSettings(s);
        }}
        transactions={activeTransactions}
        students={students}
      />

      {/* 8. Share Public Link Modal */}
      <SharePublicLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        settings={settings}
        currentBalance={currentBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        paidCount={paidStudentsCount}
        totalStudents={students.length}
      />

      {/* 9. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        currentRole={currentRole}
        transactions={transactions}
        students={students}
        auditLogs={auditLogs}
        onSaveSettings={async (s) => {
          setSettings(s);
          try {
            localStorage.setItem('fund_settings_10a13_cache', JSON.stringify(s));
          } catch {}
          await saveClassSettings(s);
        }}
        onResetData={handleResetData}
        onNewSemesterReset={handleNewSemesterReset}
        onWipeAllData={handleWipeAllData}
        onOpenFirebaseSetupModal={handleOpenFirebaseSetup}
      />

      {/* 10. Firebase & Google Auth Setup Modal */}
      <FirebaseSetupModal
        isOpen={isFirebaseSetupModalOpen}
        onClose={() => setIsFirebaseSetupModalOpen(false)}
        currentRole={currentRole}
      />

      {/* Auto-Logout Notice Toast */}
      {autoLogoutNotice && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 animate-in slide-in-from-top-4 duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-200 leading-snug">
              {autoLogoutNotice}
            </p>
          </div>
          <button
            onClick={() => setAutoLogoutNotice(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auto-Logout Warning Countdown (Last 15 seconds) */}
      {autoLogoutWarningSeconds !== null && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-2xl shadow-2xl border border-amber-500/50 animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-amber-300">Bảo mật phiên làm việc</p>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Tự động đăng xuất sau <strong className="text-amber-400 font-mono text-xs">{autoLogoutWarningSeconds}s</strong> nếu không sử dụng
            </p>
          </div>
          <button
            onClick={() => {
              lastActivityTimeRef.current = Date.now();
              setAutoLogoutWarningSeconds(null);
            }}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shrink-0 transition-colors shadow-xs"
          >
            Duy trì
          </button>
        </div>
      )}
    </div>
  );
}

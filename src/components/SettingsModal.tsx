import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Building2, 
  Key, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  School, 
  Coins, 
  ShieldCheck, 
  UserCheck, 
  Banknote, 
  Sparkles, 
  Info, 
  Trash2,
  Mail,
  Plus,
  Lock,
  Database,
  HardDrive,
  Loader2
} from 'lucide-react';
import { ClassSettings, UserRole, Transaction, StudentMember, AuditLog } from '../types/fund';
import { exportBackupData, importBackupData } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClassSettings;
  currentRole: UserRole;
  onSaveSettings: (settings: ClassSettings) => Promise<void> | void;
  onResetData: () => void;
  onNewSemesterReset: () => void;
  onWipeAllData: () => void;
  onOpenFirebaseSetupModal?: () => void;
  transactions?: Transaction[];
  students?: StudentMember[];
  auditLogs?: AuditLog[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentRole,
  onSaveSettings,
  onResetData,
  onNewSemesterReset,
  onWipeAllData,
  onOpenFirebaseSetupModal,
  transactions = [],
  students = [],
  auditLogs = [],
}) => {
  const [formData, setFormData] = useState<ClassSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'roles_google' | 'campaign' | 'backup' | 'admin_reset'>('general');
  
  // State for adding new emails
  const [newTreasurerEmail, setNewTreasurerEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // State for Drive backup
  const [isBackingUpToDrive, setIsBackingUpToDrive] = useState(false);
  const [driveBackupMessage, setDriveBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Saving state & visual feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data reset/cleanup states
  const [isResetting, setIsResetting] = useState(false);
  const [resetActionText, setResetActionText] = useState('');

  // Synchronize form state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setEmailError('');
      setIsSaving(false);
      setSaveSuccess(false);

      // Lock background body scroll to eliminate background scrollbars
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = currentRole === 'admin';

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddTreasurerEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const email = newTreasurerEmail.trim().toLowerCase();
    if (!email) return;
    if (!validateEmail(email)) {
      setEmailError('Địa chỉ email Google không hợp lệ.');
      return;
    }
    const currentList = formData.treasurerGoogleEmails || [];
    if (currentList.map(e => e.toLowerCase()).includes(email)) {
      setEmailError('Email này đã có trong danh sách Thủ Quỹ.');
      return;
    }
    setFormData({
      ...formData,
      treasurerGoogleEmails: [...currentList, email]
    });
    setNewTreasurerEmail('');
  };

  const handleRemoveTreasurerEmail = (emailToRemove: string) => {
    const currentList = formData.treasurerGoogleEmails || [];
    setFormData({
      ...formData,
      treasurerGoogleEmails: currentList.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase())
    });
  };

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    if (!validateEmail(email)) {
      setEmailError('Địa chỉ email Google không hợp lệ.');
      return;
    }
    const currentList = formData.adminGoogleEmails || ['webnpmvung1@gmail.com'];
    if (currentList.map(e => e.toLowerCase()).includes(email)) {
      setEmailError('Email này đã có trong danh sách Quản Trị Viên.');
      return;
    }
    setFormData({
      ...formData,
      adminGoogleEmails: [...currentList, email]
    });
    setNewAdminEmail('');
  };

  const handleRemoveAdminEmail = (emailToRemove: string) => {
    const currentList = formData.adminGoogleEmails || ['webnpmvung1@gmail.com'];
    if (currentList.length <= 1) {
      alert('Không thể xóa Quản Trị Viên duy nhất của hệ thống.');
      return;
    }
    setFormData({
      ...formData,
      adminGoogleEmails: currentList.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase())
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (Admin) mới có quyền lưu cấu hình sổ quỹ.');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsSaving(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Lỗi khi lưu cài đặt:', err);
      setIsSaving(false);
      alert('Không thể lưu cài đặt lên Cloud Firestore. Vui lòng kiểm tra lại kết nối!');
    }
  };

  const handleManualDriveBackup = async () => {
    const url = formData.sheetConfig?.appsScriptImageUrl?.trim();
    if (!url) {
      alert('Vui lòng cấu hình "URL Google Apps Script Upload Ảnh / Drive" trong tab Cài Đặt Chung trước khi sao lưu!');
      return;
    }

    setIsBackingUpToDrive(true);
    setDriveBackupMessage(null);

    try {
      const backupContent = exportBackupData(formData, students, transactions, auditLogs);
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const folderId = formData.sheetConfig?.driveFolderId?.trim() || '1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4';
      const fileName = `Backup_SoQuy_10A13_${dateStr}.json`;

      await fetch(url, {
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

      localStorage.setItem('last_drive_backup_date', todayIso);
      setDriveBackupMessage({
        type: 'success',
        text: `Đã gửi bản sao lưu ${fileName} lên Google Drive thành công!`,
      });
    } catch (err: any) {
      setDriveBackupMessage({
        type: 'error',
        text: `Lỗi sao lưu lên Google Drive: ${err?.message || 'Không thể kết nối Apps Script'}`,
      });
    } finally {
      setIsBackingUpToDrive(false);
    }
  };

  const handleDownloadBackup = () => {
    const json = exportBackupData(formData, students, transactions, auditLogs);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_So_Quy_10A13_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = await importBackupData(content);
          if (success) {
            alert('Khôi phục dữ liệu trực tuyến lên Cloud Firestore thành công! Hệ thống đã cập nhật tức thì.');
            onClose();
          } else {
            alert('Tệp dữ liệu không hợp lệ hoặc có lỗi khi tải lên Firestore.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDoNewSemesterReset = async () => {
    if (confirm('Bạn chắc chắn muốn chuyển sang học kỳ mới? Toàn bộ trạng thái đóng tiền của học sinh sẽ chuyển về Chưa nộp, làm sạch sổ thu chi.')) {
      setIsResetting(true);
      setResetActionText('Đang khởi tạo học kỳ mới...');
      try {
        await onNewSemesterReset();
        alert('Đã bắt đầu học kỳ mới thành công trên Cloud Firestore!');
        onClose();
      } catch (err) {
        console.error('Lỗi khi chuyển học kỳ mới:', err);
        alert('Có lỗi xảy ra khi chuyển sang học kỳ mới. Vui lòng kiểm tra lại kết nối!');
      } finally {
        setIsResetting(false);
        setResetActionText('');
      }
    }
  };

  const handleDoResetData = async () => {
    if (confirm('Thao tác này sẽ khôi phục dữ liệu mẫu 10A13 ban đầu lên Cloud Firestore. Bạn có muốn tiếp tục?')) {
      setIsResetting(true);
      setResetActionText('Đang khôi phục dữ liệu mẫu...');
      try {
        await onResetData();
        alert('Đã khôi phục dữ liệu mẫu 10A13 thành công!');
        onClose();
      } catch (err) {
        console.error('Lỗi khi khôi phục dữ liệu mẫu:', err);
        alert('Có lỗi xảy ra khi khôi phục dữ liệu mẫu. Vui lòng kiểm tra lại kết nối!');
      } finally {
        setIsResetting(false);
        setResetActionText('');
      }
    }
  };

  const handleDoWipeAllData = async () => {
    const confirm1 = confirm('CẢNH BÁO: Bạn chuẩn bị XÓA TRẮNG toàn bộ số dư và giao dịch trên Cloud Firestore. Bạn có chắc không?');
    if (confirm1) {
      const confirm2 = prompt('Nhập "XOA HET" để xác nhận xóa vĩnh viễn:');
      if (confirm2 === 'XOA HET') {
        setIsResetting(true);
        setResetActionText('Đang xóa trắng dữ liệu...');
        try {
          await onWipeAllData();
          alert('Đã xóa trắng toàn bộ dữ liệu thành công!');
          onClose();
        } catch (err) {
          console.error('Lỗi khi xóa dữ liệu:', err);
          alert('Có lỗi xảy ra khi xóa toàn bộ dữ liệu. Vui lòng kiểm tra lại kết nối!');
        } finally {
          setIsResetting(false);
          setResetActionText('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cài Đặt Sổ Quỹ Lớp 10A13</h3>
              <p className="text-[11px] text-slate-500">Phân quyền tài khoản Google & Quản lý quỹ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: 2-row grid on mobile so ALL 5 tabs are 100% visible with zero horizontal cutoff */}
        <div className="p-2 sm:p-2.5 bg-slate-50/95 border-b border-slate-200 shrink-0">
          {/* Mobile Grid View (sm:hidden) */}
          <div className="space-y-1.5 sm:hidden">
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`py-1.5 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Chung</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('campaign')}
                className={`py-1.5 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'campaign'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span>Mức Thu</span>
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('roles_google')}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'roles_google'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                  <span>Thủ Quỹ</span>
                </button>
              ) : (
                <div />
              )}
            </div>

            {isAdmin && (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('backup')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'backup'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 shrink-0 text-orange-600" />
                  <span>Sao Lưu & Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin_reset')}
                  className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    activeTab === 'admin_reset'
                      ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-500/20'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>Dọn Dẹp Dữ Liệu</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Flex View (hidden sm:flex) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'general'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Thông Tin Chung</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('campaign')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'campaign'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Mức Thu Quỹ</span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('roles_google')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'roles_google'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Cấp Quyền Thủ Quỹ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('backup')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'backup'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-orange-600" />
                  <span>Sao Lưu & Firestore</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('admin_reset')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                    activeTab === 'admin_reset'
                      ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-500/20'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Dọn Dẹp Dữ Liệu</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Form Body with SINGLE vertical scrollbar */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm min-h-0 thin-scrollbar overscroll-contain">
            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Trường Học</label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Lớp Học</label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Năm Học</label>
                  <input
                    type="text"
                    required
                    value={formData.schoolYear}
                    onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thủ Quỹ 1</label>
                    <input
                      type="text"
                      required
                      value={formData.treasurerName}
                      onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                      className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thủ Quỹ 2 (Tùy chọn)</label>
                    <input
                      type="text"
                      value={formData.treasurer2Name || ''}
                      onChange={(e) => setFormData({ ...formData, treasurer2Name: e.target.value })}
                      placeholder="Để trống nếu không có"
                      className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ Tên Quản Trị Viên (GVCN / Lớp Trưởng)</label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quy Cách Cất Giữ Tiền Mặt</label>
                  <input
                    type="text"
                    value={formData.cashStorageNote}
                    onChange={(e) => setFormData({ ...formData, cashStorageNote: e.target.value })}
                    placeholder="VD: Két sắt bảo mật tại lớp / Thủ quỹ Thu Uyên giữ..."
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Cấu hình URL Google Apps Script Upload Ảnh */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-950 uppercase flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-teal-600" />
                      <span>URL Google Apps Script Upload Ảnh (Google Drive)</span>
                      {!isAdmin && <Lock className="w-3 h-3 text-slate-400 ml-1" />}
                    </label>
                    {!isAdmin && (
                      <span className="text-[10px] text-teal-900 bg-teal-100 px-2 py-0.5 rounded-full font-medium">
                        Chỉ Admin mới có quyền sửa
                      </span>
                    )}
                  </div>
                  <input
                    type="url"
                    readOnly={!isAdmin}
                    value={formData.sheetConfig?.appsScriptImageUrl || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      sheetConfig: {
                        ...formData.sheetConfig,
                        appsScriptImageUrl: e.target.value
                      }
                    })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className={`w-full px-3 py-2 text-xs font-mono rounded-xl border ${
                      isAdmin 
                        ? 'bg-white border-teal-300 focus:outline-hidden focus:border-teal-600' 
                        : 'bg-teal-100/50 border-teal-200 text-slate-600 cursor-not-allowed'
                    }`}
                  />
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Ảnh hóa đơn tải lên sẽ được chuyển thành link Google Drive cá nhân, không tốn dung lượng Firestore. Bấm biểu tượng <strong>Google Sheets</strong> trên thanh tiêu đề để xem hướng dẫn chi tiết và sao chép mã Apps Script.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: ROLES & GOOGLE EMAIL DELEGATION (ADMIN ONLY) */}
            {activeTab === 'roles_google' && isAdmin && (
              <div className="space-y-5">
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Cấp Quyền Qua Tài Khoản Google (Không Cần PIN)</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Hệ thống xác thực 100% bằng tài khoản Google. Quản trị viên chỉ cần thêm email Google của Thủ Quỹ vào danh sách bên dưới, Thủ Quỹ đăng nhập sẽ tự động có quyền ghi chép thu/chi.
                  </p>
                </div>

                {/* Section 1: Cấp quyền Thủ Quỹ */}
                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-600" />
                      <span>Danh Sách Thủ Quỹ Lớp (Email Google)</span>
                    </label>
                    <span className="text-[10px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      {(formData.treasurerGoogleEmails || []).length} tài khoản
                    </span>
                  </div>

                  {/* Add Treasurer Input */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="thuquy10a13@gmail.com"
                        value={newTreasurerEmail}
                        onChange={(e) => setNewTreasurerEmail(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-hidden focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddTreasurerEmail}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cấp Quyền</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Treasurers */}
                  <div className="space-y-1.5 pt-1">
                    {(formData.treasurerGoogleEmails || []).length === 0 ? (
                      <div className="p-3 bg-white/80 rounded-lg border border-dashed border-amber-300 text-center text-xs text-amber-700">
                        Chưa có tài khoản Thủ quỹ nào. Nhập email Google ở trên và bấm <strong>Cấp Quyền</strong>.
                      </div>
                    ) : (
                      formData.treasurerGoogleEmails?.map((email) => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-2.5 bg-white border border-amber-200 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{email}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-medium">
                              Thủ Quỹ
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTreasurerEmail(email)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Thu hồi quyền Thủ Quỹ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 2: Quản Trị Viên (Admin) */}
                <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-950 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Danh Sách Quản Trị Viên (Admin)</span>
                    </label>
                    <span className="text-[10px] bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      {(formData.adminGoogleEmails || ['webnpmvung1@gmail.com']).length} tài khoản
                    </span>
                  </div>

                  {/* Add Admin Input */}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="admin@gmail.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-hidden focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddAdminEmail}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Admin</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Admins */}
                  <div className="space-y-1.5 pt-1">
                    {(formData.adminGoogleEmails || ['webnpmvung1@gmail.com']).map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2.5 bg-white border border-purple-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{email}</span>
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-medium">
                            Admin
                          </span>
                        </div>
                        {(formData.adminGoogleEmails || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdminEmail(email)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Xóa quyền Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {emailError && (
                  <p className="text-xs text-rose-600 font-medium">{emailError}</p>
                )}
              </div>
            )}

            {/* TAB 3: CAMPAIGN */}
            {activeTab === 'campaign' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Đợt Thu Quỹ</label>
                  <input
                    type="text"
                    value={formData.fundCampaign.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fundCampaign: { ...formData.fundCampaign, title: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mức Thu Mỗi Bạn (VNĐ)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formData.fundCampaign.targetPerStudent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fundCampaign: {
                          ...formData.fundCampaign,
                          targetPerStudent: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-base sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa Điểm Nộp Tiền Mặt Tại Lớp</label>
                  <input
                    type="text"
                    value={formData.fundCampaign.collectionLocation || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fundCampaign: {
                          ...formData.fundCampaign,
                          collectionLocation: e.target.value,
                        },
                      })
                    }
                    placeholder="VD: Bàn 1 dãy 2 - Đầu giờ hoặc ra chơi"
                    className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: BACKUP & FIRESTORE (ADMIN ONLY) */}
            {activeTab === 'backup' && isAdmin && (
              <div className="space-y-4">
                {/* Thẻ Sao lưu Tự Động Lên Google Drive */}
                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-teal-950 text-xs uppercase flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-teal-600" />
                      <span>Tự Động Sao Lưu Hàng Ngày Lên Google Drive (Auto-Backup)</span>
                    </h4>
                    <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
                      Tự động ngầm
                    </span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    Hệ thống tự động gói toàn bộ số dư, học sinh, giao dịch và nhật ký thành tệp <code className="font-mono bg-teal-100 px-1 py-0.5 rounded text-[11px]">Backup_SoQuy_10A13_YYYYMMDD.json</code> và lưu thẳng vào Google Drive cá nhân mỗi khi Admin mở ứng dụng.
                  </p>
                  <div className="text-[11px] text-teal-800 flex items-center justify-between pt-1">
                    <span>Lần sao lưu gần nhất: <strong>{localStorage.getItem('last_drive_backup_date') || 'Chưa thực hiện hôm nay'}</strong></span>
                    <button
                      type="button"
                      disabled={isBackingUpToDrive}
                      onClick={handleManualDriveBackup}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      {isBackingUpToDrive ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi file...</span>
                        </>
                      ) : (
                        <>
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>Sao Lưu Lên Drive Ngay</span>
                        </>
                      )}
                    </button>
                  </div>
                  {driveBackupMessage && (
                    <div className={`p-2 rounded-lg text-xs font-medium ${driveBackupMessage.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900 border border-rose-200'}`}>
                      {driveBackupMessage.text}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-orange-950 text-xs uppercase flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span>Cấu Hình & Kết Nối Cloud Firestore (Vercel / GitHub)</span>
                  </h4>
                  <p className="text-xs text-orange-900 leading-relaxed">
                    Kiểm tra trạng thái kết nối Cloud Firestore, tự tạo database riêng và lấy các biến môi trường cho Vercel.
                  </p>
                  {onOpenFirebaseSetupModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFirebaseSetupModal();
                      }}
                      className="px-3.5 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-orange-700 cursor-pointer shadow-xs"
                    >
                      <span>Mở Bảng Cấu Hình Firestore</span>
                    </button>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Sao Lưu Dữ Liệu Tệp .JSON</h4>
                  <p className="text-xs text-slate-600">
                    Tải toàn bộ số dư, danh sách thu tiền mặt, các giao dịch và nhật ký kiểm toán về máy tính/điện thoại.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-black cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Tệp Sao Lưu (.JSON)</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">Khôi Phục Từ Tệp .JSON</h4>
                  <p className="text-xs text-slate-600">
                    Chọn tệp sao lưu .json đã lưu trước đó để phục hồi dữ liệu vào sổ quỹ.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Chọn Tệp Phục Hồi</span>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 5: ADMIN RESET (ADMIN ONLY) */}
            {activeTab === 'admin_reset' && isAdmin && (
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <RotateCcw className="w-4 h-4" />
                    <span>Khu Vực Quản Trị Hệ Thống (Nguy Hiểm)</span>
                  </div>
                  <p>Các hành động dưới đây sẽ xóa dữ liệu. Hãy đảm bảo bạn đã <strong>Sao Lưu Dữ Liệu</strong> trước khi thực hiện.</p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-white border-b border-slate-200">
                    <h5 className="font-bold text-slate-800 text-xs">Bắt Đầu Học Kỳ Mới</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Giữ lại số dư quỹ cuối kỳ làm số dư ban đầu, xóa danh sách đóng tiền học sinh về chưa nộp.
                    </p>
                    <button
                      type="button"
                      disabled={isResetting || isSaving}
                      onClick={handleDoNewSemesterReset}
                      className="mt-2.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Bắt Đầu Học Kỳ Mới</span>
                    </button>
                  </div>

                  <div className="p-4 bg-white border-b border-slate-200">
                    <h5 className="font-bold text-slate-800 text-xs">Đặt Lại Dữ Liệu Mẫu Ban Đầu</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Khôi phục lại danh sách lớp và các giao dịch mẫu ban đầu của tháng 09/2024.
                    </p>
                    <button
                      type="button"
                      disabled={isResetting || isSaving}
                      onClick={handleDoResetData}
                      className="mt-2.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Khôi Phục Dữ Liệu Mẫu</span>
                    </button>
                  </div>

                  <div className="p-4 bg-rose-50/50">
                    <h5 className="font-bold text-rose-800 text-xs">Xóa Toàn Bộ Dữ Liệu (Trắng Sổ)</h5>
                    <p className="text-[11px] text-rose-600 mt-0.5">
                      Xóa trắng tất cả giao dịch và đặt số dư quỹ về 0 đ.
                    </p>
                    <button
                      type="button"
                      disabled={isResetting || isSaving}
                      onClick={handleDoWipeAllData}
                      className="mt-2.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Xóa Toàn Bộ Dữ Liệu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Đồng bộ tự động lên Cloud Firestore</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              {isAdmin ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu lên Cloud...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Đã lưu thành công!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Cài Đặt (Admin)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="text-xs text-slate-500 italic px-2">
                  Chỉ Quản trị viên (Admin) mới có quyền lưu cấu hình
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

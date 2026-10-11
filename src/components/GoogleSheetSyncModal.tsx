import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Code, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  HardDrive,
  Save,
  Lock,
  ShieldCheck,
  UserCheck,
  Eye,
  Loader2
} from 'lucide-react';
import { ClassSettings, StudentMember, Transaction, UserRole } from '../types/fund';
import { DEFAULT_STUDENTS } from '../data/initialData';
import { 
  APPS_SCRIPT_CODE_TEMPLATE, 
  APPS_SCRIPT_IMAGE_UPLOAD_TEMPLATE 
} from '../utils/googleSheetsScript';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClassSettings;
  currentRole: UserRole;
  onSaveSettings: (settings: ClassSettings) => Promise<void> | void;
  transactions: Transaction[];
  students: StudentMember[];
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentRole,
  onSaveSettings,
  transactions,
  students,
}) => {
  const isAdmin = currentRole === 'admin';
  const isTreasurer = currentRole === 'treasurer';
  const isViewer = currentRole === 'viewer';

  const [activeTab, setActiveTab] = useState<'drive_images' | 'google_sheets'>('google_sheets');
  
  // Sheet config states
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(settings.sheetConfig?.spreadsheetUrl || '');
  const [appsScriptUrl, setAppsScriptUrl] = useState(settings.sheetConfig?.appsScriptUrl || '');
  const [appsScriptImageUrl, setAppsScriptImageUrl] = useState(settings.sheetConfig?.appsScriptImageUrl || '');
  const [driveFolderId, setDriveFolderId] = useState(settings.sheetConfig?.driveFolderId || '');
  const [autoSync, setAutoSync] = useState(settings.sheetConfig?.autoSync || false);
  
  // UI states
  const [copiedSheetCode, setCopiedSheetCode] = useState(false);
  const [copiedImageCode, setCopiedImageCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTestingImageScript, setIsTestingImageScript] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSheetCode, setShowSheetCode] = useState(false);
  const [showImageCode, setShowImageCode] = useState(false);

  // Sync state whenever modal opens or settings update
  useEffect(() => {
    if (isOpen) {
      setSpreadsheetUrl(settings.sheetConfig?.spreadsheetUrl || '');
      setAppsScriptUrl(settings.sheetConfig?.appsScriptUrl || '');
      setAppsScriptImageUrl(settings.sheetConfig?.appsScriptImageUrl || '');
      setDriveFolderId(settings.sheetConfig?.driveFolderId || '');
      setAutoSync(settings.sheetConfig?.autoSync || false);
      setSyncMessage(null);
      setIsSaving(false);
      setSaveSuccess(false);
      setIsSyncing(false);
      // Default to google_sheets tab
      setActiveTab('google_sheets');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleCopySheetCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_TEMPLATE);
    setCopiedSheetCode(true);
    setTimeout(() => setCopiedSheetCode(false), 3000);
  };

  const handleCopyImageCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_IMAGE_UPLOAD_TEMPLATE);
    setCopiedImageCode(true);
    setTimeout(() => setCopiedImageCode(false), 3000);
  };

  const handleCopyPublicLink = () => {
    const url = spreadsheetUrl.trim();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Only Admin is allowed to save configuration
  const handleSaveConfig = async () => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (Admin) mới có quyền lưu và thay đổi cấu hình Google Sheets & Google Drive.');
      return;
    }

    setIsSaving(true);
    setSyncMessage(null);

    try {
      const updatedSettings: ClassSettings = {
        ...settings,
        sheetConfig: {
          ...settings.sheetConfig,
          spreadsheetUrl: spreadsheetUrl.trim(),
          appsScriptUrl: appsScriptUrl.trim(),
          appsScriptImageUrl: appsScriptImageUrl.trim(),
          driveFolderId: driveFolderId.trim(),
          autoSync,
          lastSyncedAt: settings.sheetConfig?.lastSyncedAt,
        },
      };

      await onSaveSettings(updatedSettings);
      setSaveSuccess(true);
      setSyncMessage({
        type: 'success',
        text: 'Đã lưu thành công cấu hình Google Drive & Google Sheets lên Cloud Firestore!',
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save config error:', err);
      setSyncMessage({
        type: 'error',
        text: 'Không thể lưu cấu hình lên Cloud Firestore. Vui lòng kiểm tra lại kết nối mạng!',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test Image Upload Script URL (Admin only)
  const handleTestImageScript = async () => {
    const url = appsScriptImageUrl.trim();
    if (!url) {
      setSyncMessage({
        type: 'error',
        text: 'Vui lòng dán URL Google Apps Script Upload Ảnh trước khi kiểm tra!',
      });
      return;
    }

    setIsTestingImageScript(true);
    setSyncMessage(null);

    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setSyncMessage({
          type: 'success',
          text: `Kết nối thành công tới Web App Google Drive! ${data?.message || 'Sẵn sàng nhận ảnh hóa đơn.'}`,
        });
      } else {
        setSyncMessage({
          type: 'error',
          text: `Ứng dụng web phản hồi mã lỗi HTTP ${res.status}. Vui lòng kiểm tra quyền "Bất kỳ ai (Anyone)".`,
        });
      }
    } catch (err: any) {
      console.error('Test script error:', err);
      setSyncMessage({
        type: 'error',
        text: `Lỗi kết nối tới URL Apps Script: ${err?.message || 'Kiểm tra xem bạn đã chọn quyền truy cập là "Anyone" chưa.'}`,
      });
    } finally {
      setIsTestingImageScript(false);
    }
  };

  // Sync transactions & students to Google Sheets (Admin AND Treasurer can trigger)
  const handleSyncNow = async () => {
    if (isViewer) {
      alert('Chưa đăng nhập! Chỉ Thủ Quỹ hoặc Quản Trị Viên mới có quyền bấm đồng bộ.');
      return;
    }

    const scriptUrl = appsScriptUrl.trim();
    if (!scriptUrl) {
      setSyncMessage({
        type: 'error',
        text: 'Chưa có URL Ứng dụng web Google Apps Script để đồng bộ. Vui lòng liên hệ Admin cấu hình trước!',
      });
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const effectiveStudents = (students && students.length > 0) ? students : DEFAULT_STUDENTS;
      const effectiveTransactions = transactions || [];

      const payload = {
        action: 'sync_all',
        className: settings.className,
        schoolYear: settings.schoolYear,
        treasurer: settings.treasurerName,
        transactions: effectiveTransactions,
        students: effectiveStudents,
      };

      await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      const nowStr = new Date().toLocaleString('vi-VN');
      const updatedSettings: ClassSettings = {
        ...settings,
        sheetConfig: {
          ...settings.sheetConfig,
          spreadsheetUrl: spreadsheetUrl.trim(),
          appsScriptUrl: scriptUrl,
          appsScriptImageUrl: appsScriptImageUrl.trim(),
          driveFolderId: driveFolderId.trim(),
          autoSync,
          lastSyncedAt: nowStr,
        },
      };

      await onSaveSettings(updatedSettings);

      setSyncMessage({
        type: 'success',
        text: `Đã gửi lệnh đồng bộ thành công cả 2 sheet: "So_Thu_Chi" (${effectiveTransactions.length} giao dịch) và "Danh_Sach_10A13" (${effectiveStudents.length} học sinh) sang Google Sheets lúc ${nowStr}! Bạn có thể mở bảng tính để kiểm tra số liệu.`,
      });
    } catch (err: any) {
      console.error('Error syncing to Google Sheet:', err);
      setSyncMessage({
        type: 'error',
        text: `Lỗi kết nối: ${err.message || 'Không thể gửi dữ liệu tới URL Apps Script'}. Vui lòng kiểm tra quyền "Bất kỳ ai (Anyone)".`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ==================== RENDER VIEW FOR UNHEALTHY / VIEWER ROLE (CHƯA ĐĂNG NHẬP / CẢ LỚP) ====================
  if (isViewer) {
    const publicSpreadsheetUrl = (settings.sheetConfig?.spreadsheetUrl || '').trim();

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">
                  Bảng Tính Google Sheets Lớp {settings.className}
                </h3>
                <p className="text-xs text-slate-500">Xem dữ liệu thu chi & danh sách đóng quỹ trực tuyến</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Viewer role badge notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Trạng thái: <strong>Xem công khai (Chưa đăng nhập)</strong></span>
              </span>
              <span className="text-[11px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                Cả Lớp
              </span>
            </div>

            {/* Main Public Link Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Link Xem Bảng Tính Google Sheets (Cho Cả Lớp)</span>
              </div>

              {publicSpreadsheetUrl ? (
                <div className="space-y-3">
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Bảng tính chứa đầy đủ các bảng kê tiền mặt, phiếu chi, hóa đơn kèm ảnh và danh sách {students.length} bạn học sinh đã hoàn thành đóng quỹ.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicSpreadsheetUrl}
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-emerald-300 rounded-xl text-slate-700 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPublicLink}
                      className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Sao chép link Google Sheets"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <a
                    href={publicSpreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Mở Bảng Tính Google Sheets Trên Tab Mới</span>
                  </a>

                  {settings.sheetConfig?.lastSyncedAt && (
                    <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-1">
                      <RefreshCw className="w-3 h-3 text-emerald-600" />
                      <span>Lần đồng bộ gần nhất: <strong>{settings.sheetConfig.lastSyncedAt}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white/90 border border-dashed border-emerald-300 rounded-xl text-xs text-emerald-800 space-y-1">
                  <p className="font-semibold">Chưa có liên kết bảng tính công khai</p>
                  <p className="text-[11px] text-slate-500">
                    Quản trị viên (GVCN / Lớp Trưởng) chưa cập nhật đường link Google Sheets cho lớp. Vui lòng quay lại sau!
                  </p>
                </div>
              )}
            </div>

            {/* Role restriction explanation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11.5px] text-slate-500 leading-relaxed flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Quyền cấu hình hệ thống (Google Apps Script, lưu trữ Google Drive, lưu cấu hình) chỉ dành cho <strong>Quản Trị Viên (Admin)</strong>. Thủ quỹ có quyền bấm đồng bộ số liệu sau khi đăng nhập.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER VIEW FOR LOGGED IN USERS (ADMIN & TREASURER) ====================
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-sm shadow-xs ${
              isAdmin ? 'bg-purple-600' : 'bg-amber-600'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Google Drive & Google Sheets
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isAdmin ? 'Admin (Toàn quyền)' : 'Thủ Quỹ (Được Đồng Bộ)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {isAdmin 
                  ? 'Toàn quyền cấu hình Google Drive & Google Sheets' 
                  : 'Được phép bấm đồng bộ dữ liệu ngay lên Google Sheets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('google_sheets')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'google_sheets'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đồng Bộ Google Sheets</span>
            {appsScriptUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive_images')}
            className={`px-3.5 py-2 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'drive_images'
                ? 'border-teal-600 text-teal-700 bg-white rounded-t-lg shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-teal-600" />
            <span>Lưu Ảnh Lên Google Drive</span>
            {appsScriptImageUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5"></span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Status Message */}
          {syncMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{syncMessage.text}</span>
            </div>
          )}

          {/* Role Policy Notice for Treasurer */}
          {isTreasurer && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Quyền hạn của Thủ Quỹ:</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Bạn có quyền bấm <strong>"Đồng Bộ Lên Sheets Ngay"</strong> để cập nhật dữ liệu. Các thông số cấu hình URL và Thư mục Drive thuộc quyền quản lý của <strong>Quản Trị Viên (Admin)</strong> và được khóa ở chế độ chỉ đọc.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS SYNC */}
          {activeTab === 'google_sheets' && (
            <div className="space-y-4">
              {/* Spreadsheet Direct Link (Available to everyone) */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Link Xem Bảng Tính Google Sheets (Cho Cả Lớp)</span>
                  </label>
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở Sheet</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    readOnly={!isAdmin}
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className={`flex-1 px-3 py-2 text-xs font-mono rounded-xl border ${
                      isAdmin 
                        ? 'bg-white border-emerald-300 focus:outline-hidden focus:border-emerald-600' 
                        : 'bg-emerald-100/50 border-emerald-200 text-slate-700 cursor-not-allowed'
                    }`}
                  />
                  {spreadsheetUrl && (
                    <button
                      type="button"
                      onClick={handleCopyPublicLink}
                      className="px-3 py-2 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                      title="Sao chép link"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800">
                  {isAdmin 
                    ? 'Dán đường link bảng tính Google Sheet của lớp vào đây để chia sẻ cho học sinh và phụ huynh xem công khai.'
                    : 'Đường link Google Sheet công khai được chia sẻ cho cả lớp theo dõi.'}
                </p>
              </div>

              {/* Apps Script URL Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>URL Web App Apps Script (Để Đồng Bộ)</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-500 italic">Chỉ Admin mới có quyền sửa</span>
                  )}
                </div>
                <input
                  type="url"
                  readOnly={!isAdmin}
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`w-full px-3 py-2 text-base sm:text-xs font-mono rounded-xl border ${
                    isAdmin 
                      ? 'bg-slate-50 border-slate-300 focus:bg-white focus:outline-hidden focus:border-emerald-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  URL ứng dụng web Google Apps Script kết thúc bằng <code>/exec</code>, triển khai quyền "Anyone".
                </p>
              </div>

              {/* 3 Steps Guide Box (Only for Admin to deploy) */}
              {isAdmin && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Hướng dẫn 3 bước kết nối Google Sheet của lớp (Dành cho Admin):</span>
                  </div>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-600 pl-1">
                    <li>
                      Tạo 1 Google Sheet trống trên Google Drive của bạn.
                    </li>
                    <li>
                      Vào <strong>Tiện ích mở rộng (Extensions)</strong> → <strong>Apps Script</strong> → Xóa hết và dán mã bên dưới vào.
                    </li>
                    <li>
                      Bấm <strong>Triển khai (Deploy)</strong> → <strong>Lượt triển khai mới (New Web App)</strong> → Chọn quyền truy cập là <strong>Bất kỳ ai (Anyone)</strong> → Sao chép URL dán vào ô trên!
                    </li>
                  </ol>

                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySheetCode}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedSheetCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSheetCode ? 'Đã sao chép mã Apps Script!' : 'Sao chép mã Sheet Script (1-Click)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSheetCode(!showSheetCode)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showSheetCode ? 'Ẩn mã' : 'Xem mã nguồn'}</span>
                      {showSheetCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showSheetCode && (
                    <pre className="p-2.5 bg-slate-900 text-emerald-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-40 leading-relaxed">
                      {APPS_SCRIPT_CODE_TEMPLATE}
                    </pre>
                  )}
                </div>
              )}

              {/* Last sync info */}
              {settings.sheetConfig?.lastSyncedAt && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lần đồng bộ gần nhất: <strong>{settings.sheetConfig.lastSyncedAt}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE IMAGE UPLOAD */}
          {activeTab === 'drive_images' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 text-xs text-teal-900">
                <div className="font-bold flex items-center gap-1.5 text-teal-950">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Lưu trữ ảnh hóa đơn & Tự động sao lưu lên Google Drive</span>
                </div>
                <p className="text-[11.5px] text-teal-800 leading-relaxed">
                  Thay vì tốn dung lượng cơ sở dữ liệu Firestore, toàn bộ ảnh hóa đơn cùng các bản sao lưu dự phòng hàng ngày (<code className="font-mono bg-teal-100 px-1 py-0.5 rounded text-[10.5px]">Backup_SoQuy_10A13_YYYYMMDD.json</code>) sẽ được tự động gửi thẳng lên thư mục Google Drive cá nhân của bạn thông qua Google Apps Script Web App!
                </p>
              </div>

              {/* URL Google Apps Script Upload Ảnh Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>URL Apps Script Upload Ảnh Google Drive</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  {isAdmin && appsScriptImageUrl && (
                    <button
                      type="button"
                      onClick={handleTestImageScript}
                      disabled={isTestingImageScript}
                      className="text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTestingImageScript ? 'animate-spin' : ''}`} />
                      <span>{isTestingImageScript ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
                    </button>
                  )}
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-500 italic">Chỉ Admin mới có quyền sửa</span>
                  )}
                </div>
                <input
                  type="url"
                  readOnly={!isAdmin}
                  value={appsScriptImageUrl}
                  onChange={(e) => setAppsScriptImageUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className={`w-full px-3 py-2 text-base sm:text-xs font-mono rounded-xl border ${
                    isAdmin 
                      ? 'bg-slate-50 border-slate-300 focus:bg-white focus:outline-hidden focus:border-teal-500' 
                      : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  URL ứng dụng web Google Apps Script kết thúc bằng <code>/exec</code>, cấp quyền "Anyone".
                </p>
              </div>

              {/* Folder ID Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>ID Thư Mục Google Drive Lưu Ảnh (Tùy chọn)</span>
                    {!isAdmin && <Lock className="w-3 h-3 text-slate-400" />}
                  </label>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-500 italic">Chỉ Admin mới có quyền sửa</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly={!isAdmin}
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    placeholder="VD: 1B2c3D4e5F6g7H8i9J0k... (Để trống sẽ tự tạo thư mục HoaDon_SoQuy_10A13)"
                    className={`w-full px-3 py-2 text-base sm:text-xs font-mono rounded-xl border ${
                      isAdmin 
                        ? 'bg-slate-50 border-slate-300 focus:bg-white focus:outline-hidden focus:border-teal-500' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                    }`}
                  />
                  <FolderOpen className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ID thư mục trên thanh địa chỉ Google Drive. Nếu để trống, script sẽ tự động tạo thư mục mang tên <strong>HoaDon_SoQuy_10A13</strong>.
                </p>
              </div>

              {/* 3 Step Guide Box (Only for Admin to deploy) */}
              {isAdmin && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Hướng dẫn triển khai Web App Upload Ảnh (3 bước - Dành cho Admin):</span>
                  </div>
                  <ol className="space-y-1.5 list-decimal list-inside text-slate-600 pl-1">
                    <li>
                      Mở <a href="https://script.google.com/" target="_blank" rel="noopener noreferrer" className="text-teal-700 underline font-semibold">script.google.com</a> và bấm <strong>+ Dự án mới</strong> (New project).
                    </li>
                    <li>
                      Xóa hết mã mặc định, bấm nút <strong>"Sao chép mã Apps Script Upload Ảnh"</strong> bên dưới rồi dán vào và nhấn <strong>Lưu</strong> (Ctrl + S).
                    </li>
                    <li>
                      Bấm <strong>Triển khai (Deploy)</strong> → <strong>Lượt triển khai mới</strong> → Chọn loại <strong>Ứng dụng web (Web app)</strong> → Mục <em>Ai có quyền truy cập (Who has access)</em> chọn <strong>Bất kỳ ai (Anyone)</strong> → Bấm <strong>Triển khai</strong> và sao chép URL dán vào ô trên!
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyImageCode}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedImageCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedImageCode ? 'Đã sao chép mã Upload Ảnh!' : 'Sao chép mã Apps Script Upload Ảnh (1-Click)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowImageCode(!showImageCode)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showImageCode ? 'Ẩn mã' : 'Xem mã nguồn'}</span>
                      {showImageCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showImageCode && (
                    <pre className="p-2.5 bg-slate-900 text-teal-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                      {APPS_SCRIPT_IMAGE_UPLOAD_TEMPLATE}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {/* Admin: Show Save Config Button */}
            {isAdmin ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveConfig}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-75 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu lên Firestore...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã lưu thành công!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình (Admin)</span>
                  </>
                )}
              </button>
            ) : (
              /* Treasurer notice */
              <span className="text-[11px] text-slate-500 italic">
                * Chỉ Quản trị viên (Admin) mới có quyền lưu cấu hình.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
            >
              Đóng
            </button>

            {/* Sync Now Button - Available to both Admin and Treasurer! */}
            {(isAdmin || isTreasurer) && (
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Lên Sheets Ngay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

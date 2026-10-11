import React from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Share2, 
  FileSpreadsheet, 
  Settings, 
  Database,
  History, 
  UserCheck, 
  Image as ImageIcon
} from 'lucide-react';
import { ClassSettings, UserRole, AuthUserProfile } from '../types/fund';

interface NavbarProps {
  settings: ClassSettings;
  currentRole: UserRole;
  currentUser: AuthUserProfile | null;
  onOpenRoleAuthModal: () => void;
  onOpenShareModal: () => void;
  onOpenSheetModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuditLogModal: () => void;
  onOpenReceiptGalleryModal: () => void;
  onOpenFirebaseSetupModal: () => void;
  auditCount: number;
  receiptsCount: number;
  isSyncing?: boolean;
  isFirebaseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentRole,
  currentUser,
  onOpenRoleAuthModal,
  onOpenShareModal,
  onOpenSheetModal,
  onOpenSettingsModal,
  onOpenAuditLogModal,
  onOpenReceiptGalleryModal,
  onOpenFirebaseSetupModal,
  auditCount,
  receiptsCount,
  isSyncing = false,
  isFirebaseConnected = true,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30 w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        {/* ROW 1: Branding & User Profile + Settings Gear (Always visible on all screens!) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Branding: Class badge + Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-800 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs ring-2 ring-emerald-500/20 shrink-0">
              {settings.className}
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-800 tracking-wide uppercase truncate">
              SỔ QUỸ LỚP
            </div>
          </div>

          {/* Right Top Bar: Role Switcher, Audit Log & Settings Gear */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nhật ký Sửa/Xóa của Admin (Dời lên đầu trang) */}
            <button
              id="btn-audit-logs"
              onClick={onOpenAuditLogModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-900 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200/90 rounded-lg transition-all cursor-pointer flex items-center gap-1"
              title="Xem nhật ký sửa / xóa giao dịch của Admin"
            >
              <History className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="hidden md:inline">Nhật Ký</span>
              {auditCount > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                  {auditCount}
                </span>
              )}
            </button>

            {/* Role Status & Switcher / Google User Button */}
            <button
              id="btn-role-switcher"
              onClick={onOpenRoleAuthModal}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                currentRole === 'admin'
                  ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                  : currentRole === 'treasurer'
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title="Đăng nhập Google hoặc chuyển vai trò"
            >
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName || ''} 
                  className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-white/50"
                />
              ) : currentRole === 'admin' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : currentRole === 'treasurer' ? (
                <UserCheck className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-slate-500" />
              )}

              <span>
                {currentRole === 'admin' 
                  ? 'Admin' 
                  : currentRole === 'treasurer' 
                  ? 'Thủ Quỹ' 
                  : currentUser 
                  ? (currentUser.displayName?.split(' ').pop() || 'Đã vào') 
                  : 'Chỉ Xem'}
              </span>
            </button>

            {/* Settings Gear - Placed RIGHT HERE so on vertical phone it is NEVER CUT OFF */}
            {currentRole === 'admin' && (
              <button
                id="btn-settings"
                onClick={onOpenSettingsModal}
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Cài đặt thông tin lớp & phân quyền Admin"
              >
                <Settings className="w-4 h-4 text-slate-700" />
              </button>
            )}
          </div>
        </div>

        {/* ROW 2 (Mobile Toolbar) / Desktop Inline Action Bar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 pt-2 border-t border-slate-100">
          {/* Cloud Firestore Setup Button - Only accessible when Admin */}
          {currentRole === 'admin' && (
            <button
              id="btn-firebase-setup"
              onClick={onOpenFirebaseSetupModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-lg transition-colors cursor-pointer"
              title="Cấu hình & kiểm tra kết nối Firestore"
            >
              <div className="relative">
                <Database className="w-3.5 h-3.5 text-orange-600" />
                <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                  isFirebaseConnected ? 'bg-emerald-500 ring-1 ring-white' : 'bg-rose-500 ring-1 ring-white'
                }`} />
              </div>
              <span className="text-orange-950 font-bold">Firestore</span>
            </button>
          )}

          {/* Google Sheets Button */}
          <button
            id="btn-google-sheets"
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              settings.sheetConfig?.spreadsheetUrl || settings.sheetConfig?.appsScriptUrl
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
            title="Đồng bộ Google Sheets"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span>Google Sheets</span>
            {settings.sheetConfig?.appsScriptUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>

          {/* Hóa đơn Button (Đưa lên chung menu đầu trang) */}
          <button
            id="btn-receipt-gallery"
            onClick={onOpenReceiptGalleryModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Xem kho ảnh hóa đơn chứng từ"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>Hóa Đơn</span>
            {receiptsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-teal-600 text-white rounded-full text-[10px] font-bold">
                {receiptsCount}
              </span>
            )}
          </button>

          {/* Share Link Button */}
          <button
            id="btn-share-class"
            onClick={onOpenShareModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer ml-auto sm:ml-0"
            title="Gửi link xem sổ quỹ cho cả lớp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Gửi Link Lớp</span>
          </button>
        </div>
      </div>
    </header>
  );
};

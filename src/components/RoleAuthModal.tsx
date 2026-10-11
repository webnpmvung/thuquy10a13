import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Settings
} from 'lucide-react';
import { UserRole, AuthUserProfile, ClassSettings } from '../types/fund';
import { signInWithGoogle, signOutUser } from '../firebase';

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  settings: ClassSettings;
  currentUser: AuthUserProfile | null;
  onSwitchRole: (newRole: UserRole) => void;
  onUpdateSettings?: (newSettings: ClassSettings) => void;
  onOpenSettings?: () => void;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  settings,
  currentUser,
  onSwitchRole,
  onOpenSettings,
}) => {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const {
    adminName,
    adminGoogleEmails = ['webnpmvung1@gmail.com'],
    treasurerGoogleEmails = []
  } = settings;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setError(false);
    setErrorMessage('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        onClose();
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        // User closed the popup, cancel silently without error
        return;
      }
      console.warn('Google Sign-in warning:', err);
      setError(true);
      setErrorMessage(err?.message || 'Không thể đăng nhập tài khoản Google. Vui lòng thử lại.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutGoogle = async () => {
    try {
      await signOutUser();
      onSwitchRole('viewer');
      onClose();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  };

  const currentEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdminAccount = (adminGoogleEmails || []).map(e => e.toLowerCase().trim()).includes(currentEmail);
  const isTreasurerAccount = (treasurerGoogleEmails || []).map(e => e.toLowerCase().trim()).includes(currentEmail);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Đăng Nhập Tài Khoản Google</h3>
              <p className="text-xs text-slate-500">Bảo mật sổ quỹ & Phân quyền theo email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Pill */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Vai trò hiện tại:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${
              currentRole === 'admin'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : currentRole === 'treasurer'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {currentRole === 'admin' ? 'Quản Trị Viên' : currentRole === 'treasurer' ? 'Thủ Quỹ' : 'Chỉ Xem (Cả Lớp)'}
            </span>
          </div>

          {currentRole !== 'viewer' && (
            <button
              onClick={() => {
                onSwitchRole('viewer');
                onClose();
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
            >
              Chuyển về Chỉ Xem
            </button>
          )}
        </div>

        {/* Google Authentication Section */}
        <div className="space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Google User'} 
                    className="w-12 h-12 rounded-full border-2 border-indigo-400 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                    {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-900 text-sm truncate">{currentUser.displayName || 'Tài khoản Google'}</p>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Status details */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Quyền hạn hệ thống:</span>
                  <span className="font-bold">
                    {isAdminAccount ? (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Admin (Toàn quyền quản trị)
                      </span>
                    ) : isTreasurerAccount ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Thủ Quỹ (Ghi chép thu/chi)
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Chỉ Xem (Chưa cấp quyền)
                      </span>
                    )}
                  </span>
                </div>

                {/* If non-admin/non-treasurer */}
                {!isAdminAccount && !isTreasurerAccount && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                    <p>
                      Email <strong>{currentUser.email}</strong> chưa được Admin thêm vào danh sách Thủ Quỹ. Vui lòng liên hệ Quản trị viên ({adminName}) để được cấp quyền ghi chép.
                    </p>
                  </div>
                )}

                {/* Auto-logout security notice */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Hệ thống tự động đăng xuất sau 2 phút không sử dụng để bảo vệ an toàn sổ quỹ.</span>
                </div>

                {/* If admin: shortcut to grant treasurer rights */}
                {isAdminAccount && onOpenSettings && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSettings();
                      }}
                      className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Cấp quyền tài khoản cho Thủ Quỹ</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex justify-end">
                <button
                  onClick={handleSignOutGoogle}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất tài khoản Google</span>
                </button>
              </div>
            </div>
          ) : (
            /* Not logged in state */
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Đăng nhập an toàn qua tài khoản Google</span>
                </div>
                <p>
                  Hệ thống bảo mật và phân quyền theo email đăng nhập. Sau khi xác thực, hệ thống sẽ tự động đối chiếu để cấp quyền <strong>Admin</strong> hoặc <strong>Thủ Quỹ</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border-2 border-slate-300 text-slate-800 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isSigningIn ? 'Đang kết nối Google...' : 'Đăng nhập với Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Clean Error alert if any */}
        {error && errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Minh bạch quỹ lớp 10A13</span>
          {onOpenSettings && currentRole === 'admin' && (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Quản lý tài khoản Thủ Quỹ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

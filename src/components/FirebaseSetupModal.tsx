import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  HelpCircle, 
  Server,
  Lock,
  Cloud,
  FileCode,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Edit3
} from 'lucide-react';
import { UserRole } from '../types/fund';
import { 
  activeFirebaseConfig, 
  firebaseConfigSource, 
  db,
  saveCustomFirebaseConfig,
  resetCustomFirebaseConfig,
  getCustomFirebaseConfig,
  FirebaseCustomConfig
} from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: UserRole;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose, currentRole }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'edit_config' | 'rules' | 'guide' | 'env'>('status');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Editable config state for Admin
  const [editConfig, setEditConfig] = useState<FirebaseCustomConfig>({
    projectId: activeFirebaseConfig.projectId || '',
    apiKey: activeFirebaseConfig.apiKey || '',
    authDomain: activeFirebaseConfig.authDomain || '',
    storageBucket: activeFirebaseConfig.storageBucket || '',
    messagingSenderId: activeFirebaseConfig.messagingSenderId || '',
    appId: activeFirebaseConfig.appId || '',
    measurementId: activeFirebaseConfig.measurementId || 'G-LSJEQLNCTX',
    databaseId: activeFirebaseConfig.databaseId || '(default)',
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  if (!isOpen) return null;

  // Security guard: Only Admin can access Firestore configuration
  if (currentRole && currentRole !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-200 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Truy Cập Bị Giới Hạn</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cấu hình Firestore và Cơ sở dữ liệu chỉ được phép truy cập sau khi đăng nhập tài khoản <strong>Quản Trị Viên (Admin)</strong> qua Google.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const pingDocRef = doc(db, 'class_fund', 'ping_test');
      await setDoc(pingDocRef, { timestamp: new Date().toISOString(), status: 'connected' });
      const snap = await getDoc(pingDocRef);
      if (snap.exists()) {
        setTestResult({
          success: true,
          message: `Kết nối thành công tới Firestore (${activeFirebaseConfig.projectId})! Đọc/ghi dữ liệu thời gian thực và lưu trữ đám mây hoạt động 100%.`
        });
      } else {
        setTestResult({
          success: false,
          message: 'Không tìm thấy dữ liệu phản hồi từ Firestore.'
        });
      }
    } catch (err: any) {
      console.error('Test connection failed', err);
      setTestResult({
        success: false,
        message: `Lỗi kết nối Firestore: ${err.message || 'Kiểm tra lại cấu hình rules hoặc API key'}`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editConfig.projectId.trim() || !editConfig.apiKey.trim()) {
      alert('Vui lòng điền tối thiểu Firebase Project ID và API Key!');
      return;
    }
    setSaveSuccessMsg(true);
    setTimeout(() => {
      saveCustomFirebaseConfig({
        ...editConfig,
        projectId: editConfig.projectId.trim(),
        apiKey: editConfig.apiKey.trim(),
        authDomain: editConfig.authDomain.trim() || `${editConfig.projectId.trim()}.firebaseapp.com`,
        storageBucket: editConfig.storageBucket?.trim() || `${editConfig.projectId.trim()}.firebasestorage.app`,
        messagingSenderId: editConfig.messagingSenderId?.trim(),
        appId: editConfig.appId.trim(),
        measurementId: editConfig.measurementId?.trim(),
        databaseId: editConfig.databaseId?.trim() || '(default)',
      });
    }, 400);
  };

  const handleResetToDefault = () => {
    if (confirm('Khôi phục cấu hình Firebase về mặc định (.env)? Trang sẽ tự động tải lại.')) {
      resetCustomFirebaseConfig();
    }
  };

  const isCustomActive = Boolean(getCustomFirebaseConfig());

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const envTemplate = `# Cấu hình Firebase cho Sổ Quỹ 10A13
VITE_FIREBASE_API_KEY=${activeFirebaseConfig.apiKey || 'AIzaSy...'}
VITE_FIREBASE_AUTH_DOMAIN=${activeFirebaseConfig.authDomain || 'webthuquylop.firebaseapp.com'}
VITE_FIREBASE_PROJECT_ID=${activeFirebaseConfig.projectId || 'webthuquylop'}
VITE_FIREBASE_STORAGE_BUCKET=${activeFirebaseConfig.storageBucket || 'webthuquylop.firebasestorage.app'}
VITE_FIREBASE_MESSAGING_SENDER_ID=${activeFirebaseConfig.messagingSenderId || '261664509449'}
VITE_FIREBASE_APP_ID=${activeFirebaseConfig.appId || '1:261664509449:web:0abcdefeedfbab80df32d8'}
VITE_FIREBASE_DATABASE_ID=(default)`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Cấu Hình Firestore & Cơ Sở Dữ Liệu</h3>
              <p className="text-xs text-slate-500">Cho phép Admin tùy chỉnh thông số kết nối Cloud Firestore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-1.5 shrink-0 overflow-x-auto text-xs font-semibold hide-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'status' 
                ? 'border-orange-600 text-orange-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Trạng Thái & Kiểm Tra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit_config')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'edit_config' 
                ? 'border-orange-600 text-orange-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4 text-orange-600" />
            <span>Tùy Chỉnh Thông Số</span>
            {isCustomActive && (
              <span className="w-2 h-2 rounded-full bg-orange-500 ml-0.5"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'rules' 
                ? 'border-orange-600 text-orange-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Quy Tắc Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('env')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'env' 
                ? 'border-orange-600 text-orange-600 font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Biến Môi Trường .env</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: STATUS & PING */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Nguồn cấu hình hiện tại:</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    firebaseConfigSource === 'custom'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : firebaseConfigSource === 'env'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {firebaseConfigSource === 'custom' 
                      ? 'Admin Tùy Chỉnh (Trình duyệt)' 
                      : firebaseConfigSource === 'env' 
                      ? 'Biến môi trường Vercel (.env)' 
                      : 'Cấu hình Cloud đang hoạt động'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Firebase Project ID:</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">{activeFirebaseConfig.projectId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Auth Domain:</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">{activeFirebaseConfig.authDomain}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Firebase Storage Bucket:</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">{activeFirebaseConfig.storageBucket || 'Chưa thiết lập'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Đang gửi ping thử...' : 'Kiểm tra kết nối Firestore ngay'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('edit_config')}
                    className="text-xs text-orange-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa thông số kết nối →</span>
                  </button>
                </div>
              </div>

              {/* Ping Result Alert */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{testResult.success ? 'Kết Nối Thành Công' : 'Lỗi Kết Nối'}</p>
                    <p className="leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT CONFIGURATION (NEW ADMIN FEATURE) */}
          {activeTab === 'edit_config' && (
            <form onSubmit={handleSaveCustomConfig} className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-orange-600" />
                  <span>Tùy chỉnh thông số Firebase Project của bạn</span>
                </p>
                <p className="text-[11.5px] text-orange-900 leading-relaxed">
                  Quản trị viên có thể nhập thông số từ Firebase Console của dự án riêng (API Key, Project ID, Auth Domain...). Sau khi lưu, ứng dụng sẽ tự động tải lại và kết nối với cơ sở dữ liệu mới.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Firebase Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editConfig.projectId}
                    onChange={(e) => setEditConfig({ ...editConfig, projectId: e.target.value })}
                    placeholder="webthuquylop"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editConfig.apiKey}
                    onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={editConfig.authDomain}
                    onChange={(e) => setEditConfig({ ...editConfig, authDomain: e.target.value })}
                    placeholder="webthuquylop.firebaseapp.com"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Storage Bucket
                  </label>
                  <input
                    type="text"
                    value={editConfig.storageBucket || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, storageBucket: e.target.value })}
                    placeholder="webthuquylop.firebasestorage.app"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={editConfig.appId}
                    onChange={(e) => setEditConfig({ ...editConfig, appId: e.target.value })}
                    placeholder="1:261664509449:web:0abcdefeedfbab80df32d8"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Messaging Sender ID
                  </label>
                  <input
                    type="text"
                    value={editConfig.messagingSenderId || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, messagingSenderId: e.target.value })}
                    placeholder="261664509449"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Database ID
                  </label>
                  <input
                    type="text"
                    value={editConfig.databaseId || '(default)'}
                    onChange={(e) => setEditConfig({ ...editConfig, databaseId: e.target.value })}
                    placeholder="(default)"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400">Mặc định là (default)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Measurement ID (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={editConfig.measurementId || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, measurementId: e.target.value })}
                    placeholder="G-LSJEQLNCTX"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã lưu! Đang tải lại ứng dụng với cấu hình mới...</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {isCustomActive && (
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục về mặc định</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('status')}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình & Tải Lại</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Quy Tắc Bảo Mật Firestore (Rules)</span>
                </p>
                <p className="text-[11.5px] text-amber-800 leading-relaxed">
                  Để ứng dụng đọc và ghi số dư, giao dịch thời gian thực trên Firestore, bạn cần mở tab <strong>Rules</strong> trên Firebase Console và áp dụng mã sau:
                </p>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {firestoreRulesCode}
                </pre>
                <button
                  onClick={() => handleCopy(firestoreRulesCode, 'rules')}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'rules' ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ENV */}
          {activeTab === 'env' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Sao chép các biến môi trường này nếu bạn muốn triển khai dự án lên Vercel:
              </p>
              <div className="relative">
                <pre className="bg-slate-950 text-indigo-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                  {envTemplate}
                </pre>
                <button
                  onClick={() => handleCopy(envTemplate, 'env')}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'env' ? <Check className="w-3.5 h-3.5 text-indigo-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'env' ? 'Đã chép' : 'Sao chép .env'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Dữ liệu đám mây Firebase Firestore & Auth
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

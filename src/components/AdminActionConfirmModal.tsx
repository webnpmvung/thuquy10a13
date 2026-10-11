import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types/fund';
import { formatVND } from '../utils/formatters';

interface AdminActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'edit' | 'delete';
  transaction: Transaction | null;
  adminName: string;
  onConfirm: (reason: string) => void;
}

export const AdminActionConfirmModal: React.FC<AdminActionConfirmModalProps> = ({
  isOpen,
  onClose,
  actionType,
  transaction,
  adminName,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen || !transaction) return null;

  const isDelete = actionType === 'delete';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                isDelete ? 'bg-rose-600' : 'bg-amber-500'
              }`}
            >
              {isDelete ? <Trash2 className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isDelete ? 'Xác Nhận Xóa Giao Dịch' : 'Xác Nhận Sửa Giao Dịch'}
              </h3>
              <p className="text-[11px] text-slate-500">Quyền hạn Quản trị viên (Admin)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Transaction Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">{transaction.title}</span>
            <span className="font-bold font-mono text-slate-900 text-sm">
              {formatVND(transaction.amount)}
            </span>
          </div>
          <p className="text-slate-500">
            Ngày ghi nhận: {transaction.date} {transaction.time ? `(${transaction.time})` : ''} • Người tạo: {transaction.recordedBy}
          </p>
        </div>

        {/* Notice Requirement */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2 text-xs text-purple-900">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Yêu cầu minh bạch: </span>
            Theo quy định của lớp 10A13, mọi thao tác {isDelete ? 'XÓA' : 'CHỈNH SỬA'} từ Admin đều được lưu vết vào <strong>Nhật Ký Kiểm Toán</strong> để cả lớp cùng theo dõi.
          </div>
        </div>

        {/* Form Input Reason */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Nhập Lý Do {isDelete ? 'Xóa' : 'Chỉnh Sửa'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(false);
              }}
              placeholder={
                isDelete
                  ? 'VD: Ghi nhầm trùng khoản mua chổi quét lớp; Học sinh xin rút tiền mặt...'
                  : 'VD: Sửa lại số tiền khớp theo hóa đơn gốc từ 150k thành 145k...'
              }
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
            />
            {error && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Vui lòng nhập lý do để ghi vào nhật ký kiểm toán!
              </p>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            Hành động sẽ được ghi nhận dưới tên: <strong className="text-slate-800 font-medium">{adminName}</strong>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isDelete ? 'Xác Nhận Xóa' : 'Tiếp Tục Chỉnh Sửa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

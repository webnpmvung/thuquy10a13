import React, { useState } from 'react';
import { 
  X, 
  History, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { AuditLog, Transaction, UserRole } from '../types/fund';
import { formatVND, formatDateVN } from '../utils/formatters';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
  deletedTransactions: Transaction[];
  currentRole: UserRole;
  onRestoreTransaction?: (tx: Transaction) => void;
  onViewReceipt?: (imageUrl: string, title: string, images?: {url: string; timestamp: string}[]) => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  deletedTransactions,
  currentRole,
  onRestoreTransaction,
  onViewReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'all_logs' | 'deleted_trash'>('all_logs');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>Vết Kiểm Toán & Lịch Sử Chỉnh Sửa / Xóa</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-white/20 text-white rounded-full">
                  Minh bạch 100%
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Toàn bộ thao tác sửa, xóa của Quản trị viên đều được ghi vết và lưu trữ lý do
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all_logs')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all_logs'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nhật Ký Chỉnh Sửa & Xóa ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deleted_trash')}
            className={`px-3 py-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deleted_trash'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Thùng Rác / Các Khoản Đã Bị Xóa ({deletedTransactions.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {activeTab === 'all_logs' && (
            <>
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Chưa có chỉnh sửa hoặc xóa nào</p>
                  <p className="text-xs text-slate-500 mt-0.5">Mọi giao dịch gốc vẫn được giữ nguyên vẹn 100%.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => {
                    const isDelete = log.action === 'deleted';
                    const isUpdate = log.action === 'updated';
                    const isRestore = log.action === 'restored';

                    return (
                      <div
                        key={log.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDelete
                            ? 'bg-rose-50/50 border-rose-200'
                            : isUpdate
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                                isDelete
                                  ? 'bg-rose-600 text-white'
                                  : isUpdate
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isDelete ? 'ĐÃ XÓA GIAO DỊCH' : isUpdate ? 'ĐÃ CHỈNH SỬA' : 'ĐÃ KHÔI PHỤC'}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {log.snapshotTitle || 'Giao dịch'}
                            </span>
                          </div>

                          {log.snapshotAmount && (
                            <span className="font-bold text-xs text-slate-900 font-mono">
                              {formatVND(log.snapshotAmount)}
                            </span>
                          )}
                        </div>

                        {/* Reason Box */}
                        {log.reason && (
                          <div className="bg-white/90 border border-slate-200 rounded-lg p-2 my-2 text-xs">
                            <span className="font-bold text-slate-700">Lý do điều chỉnh từ Admin: </span>
                            <span className="text-slate-800 italic">&ldquo;{log.reason}&rdquo;</span>
                          </div>
                        )}

                        {log.details && (
                          <p className="text-[11px] text-slate-600 mb-2">
                            {log.details}
                          </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {log.timestamp}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            Thực hiện bởi: <strong className="text-slate-700 font-medium">{log.performedBy}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'deleted_trash' && (
            <>
              {deletedTransactions.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl">
                  <Trash2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Thùng rác trống</p>
                  <p className="text-xs text-slate-500 mt-0.5">Không có khoản thu chi nào bị xóa</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Các giao dịch dưới đây đã bị Quản trị viên xóa khỏi sổ quỹ chính. Chỉ Admin mới có quyền khôi phục.
                    </span>
                  </div>

                  {deletedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-white border border-rose-200 rounded-xl shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold uppercase">
                              {tx.type === 'income' ? 'Khoản Thu' : 'Khoản Chi'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm line-through text-slate-500">
                              {tx.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ngày phát sinh: {formatDateVN(tx.date)} • Người ghi ban đầu: {tx.recordedBy}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-sm text-slate-500 line-through">
                            {formatVND(tx.amount)}
                          </div>
                        </div>
                      </div>

                      {/* Delete reason */}
                      <div className="bg-rose-50/80 border border-rose-100 rounded-lg p-2 text-xs">
                        <span className="font-bold text-rose-900">Lý do xóa: </span>
                        <span className="text-rose-800 italic">
                          {tx.deleteReason || 'Quản trị viên đã xóa giao dịch này'}
                        </span>
                        <div className="text-[10px] text-rose-700/80 mt-1">
                          Xóa bởi: {tx.deletedBy || 'Admin'} vào lúc {tx.deletedAt || 'N/A'}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        {(tx.receiptImage || (tx.receiptImages && tx.receiptImages.length > 0)) ? (
                          <button
                            onClick={() => {
                              if (!onViewReceipt) return;
                              if (tx.receiptImages && tx.receiptImages.length > 0) {
                                onViewReceipt(tx.receiptImages[0].url, tx.title, tx.receiptImages);
                              } else if (tx.receiptImage) {
                                onViewReceipt(tx.receiptImage, tx.title);
                              }
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Xem ảnh hóa đơn đính kèm {tx.receiptImages && tx.receiptImages.length > 1 ? `(${tx.receiptImages.length})` : ''}</span>
                          </button>
                        ) : (
                          <div></div>
                        )}

                        {currentRole === 'admin' && onRestoreTransaction && (
                          <button
                            onClick={() => onRestoreTransaction(tx)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Khôi Phục Giao Dịch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dữ liệu đối soát minh bạch - Không thể gian lận hoặc sửa xóa ngầm</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-black cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Calendar, 
  Trash2, 
  Edit3, 
  FileDown, 
  Image as ImageIcon,
  Lock,
  Printer,
  Sparkles,
  Cake,
  Trophy,
  HeartHandshake,
  Coins,
  Gift,
  CircleEllipsis,
  Banknote,
  AlertCircle,
  History,
  ShieldCheck,
  CheckCircle2,
  Info,
  X
} from 'lucide-react';
import { Transaction, TransactionCategory, UserRole } from '../types/fund';
import { CATEGORY_DETAILS } from '../data/initialData';
import { formatVND, formatDateVN } from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  currentRole: UserRole;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  onViewReceipt?: (imageUrl: string, title: string, images?: {url: string; timestamp: string}[]) => void;
  onOpenAuditModal?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currentRole,
  onEditTransaction,
  onDeleteTransaction,
  onViewReceipt,
  onOpenAuditModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hasReceiptOnly, setHasReceiptOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [selectedTxForAuditDetail, setSelectedTxForAuditDetail] = useState<Transaction | null>(null);

  // Active transactions (not deleted)
  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.isDeleted);
  }, [transactions]);

  // Filter and Sort
  const filteredTransactions = useMemo(() => {
    return activeTransactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        // Has receipt image filter
        const hasReceipt = tx.receiptImage || (tx.receiptImages && tx.receiptImages.length > 0);
        if (hasReceiptOnly && !hasReceipt) return false;
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(term);
          const matchNote = (tx.note || '').toLowerCase().includes(term);
          const matchCategory = (CATEGORY_DETAILS[tx.category]?.label || '').toLowerCase().includes(term);
          const matchRecorded = (tx.recordedBy || '').toLowerCase().includes(term);
          const matchReceiver = (tx.cashReceiver || '').toLowerCase().includes(term);
          return matchTitle || matchNote || matchCategory || matchRecorded || matchReceiver;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [activeTransactions, typeFilter, categoryFilter, hasReceiptOnly, searchTerm, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã GD', 'Ngày', 'Giờ', 'Loại', 'Nội dung', 'Danh mục', 'Số tiền (VNĐ)', 'Phương thức', 'Người ghi', 'Người nhận/giao tiền', 'Ghi chú', 'Đã sửa bởi'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.time || '',
      tx.type === 'income' ? 'Thu vào' : 'Chi ra',
      `"${tx.title.replace(/"/g, '""')}"`,
      `"${CATEGORY_DETAILS[tx.category]?.label || tx.category}"`,
      tx.amount,
      'Tiền mặt',
      `"${tx.recordedBy || ''}"`,
      `"${tx.cashReceiver || ''}"`,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      tx.isEdited ? `"${tx.lastEditedBy || 'Admin'} - ${tx.editReason || ''}"` : 'Nguyên bản',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `So_Thu_Chi_Tien_Mat_10A13_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    switch (category) {
      case 'in_an': return <Printer className="w-4 h-4" />;
      case 've_sinh': return <Sparkles className="w-4 h-4" />;
      case 'lien_hoan': return <Cake className="w-4 h-4" />;
      case 'hoat_dong': return <Trophy className="w-4 h-4" />;
      case 'tri_an': return <HeartHandshake className="w-4 h-4" />;
      case 'thu_quy': return <Coins className="w-4 h-4" />;
      case 'ung_ho': return <Gift className="w-4 h-4" />;
      default: return <CircleEllipsis className="w-4 h-4" />;
    }
  };

  const receiptCount = activeTransactions.filter((t) => t.receiptImage || (t.receiptImages && t.receiptImages.length > 0)).length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Role Reminder Banner for Treasurer */}
      {currentRole === 'treasurer' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Quyền hạn Thủ Quỹ: </span>
            Bạn có quyền ghi nhận thu chi và đính kèm hóa đơn tiền mặt. <strong>Không được tự ý sửa hoặc xóa giao dịch</strong> đã ghi. Nếu có sai sót, vui lòng báo Quản trị viên (GVCN / Lớp trưởng) để chỉnh sửa có lưu vết.
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Sổ Thu Chi Tiền Mặt</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
              {filteredTransactions.length} giao dịch
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mọi khoản thu chi bằng tiền mặt đều có người giao nhận và hóa đơn chứng từ đối chiếu
          </p>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2">
          {/* Filter by has receipt button */}
          <button
            onClick={() => setHasReceiptOnly(!hasReceiptOnly)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              hasReceiptOnly
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Chỉ hiển thị các khoản có đính kèm hóa đơn"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Có Hóa Đơn ({receiptCount})</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Xuất Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search */}
        <div className="relative sm:col-span-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung, ghi chú, người nhận tiền..."
            className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          >
            <option value="all">Tất cả (Thu & Chi)</option>
            <option value="income">🟢 Chỉ Tiền Thu Vào</option>
            <option value="expense">🔴 Chỉ Tiền Chi Ra</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          >
            <option value="all">Mọi danh mục</option>
            {Object.entries(CATEGORY_DETAILS).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="amount_desc">Số tiền cao → thấp</option>
            <option value="amount_asc">Số tiền thấp → cao</option>
          </select>
        </div>
      </div>

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
          <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Chưa có giao dịch nào phù hợp</p>
          <p className="text-xs text-slate-500 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc bỏ bộ lọc</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden">
          {filteredTransactions.map((tx) => {
            const catInfo = CATEGORY_DETAILS[tx.category] || {
              label: 'Khoản chi',
              color: 'text-slate-600',
              bgColor: 'bg-slate-50 border-slate-200',
            };

            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="py-3.5 sm:py-4 px-2 hover:bg-slate-50/80 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left Side */}
                <div className="flex items-start gap-3">
                  {/* Icon Indicator */}
                  <div
                    className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-rose-50 border-rose-200 text-rose-600'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-slate-900 text-sm sm:text-base leading-snug">
                        {tx.title}
                      </span>

                      {/* Category Chip */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${catInfo.bgColor} ${catInfo.color}`}
                      >
                        {getCategoryIcon(tx.category)}
                        <span>{catInfo.label}</span>
                      </span>

                      {/* RECEIPT ATTACHMENT BUTTON */}
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors cursor-pointer shadow-2xs"
                          title="Bấm để xem ảnh chụp hóa đơn / chứng từ gốc"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Xem Hóa Đơn {tx.receiptImages && tx.receiptImages.length > 1 ? `(${tx.receiptImages.length})` : ''}</span>
                        </button>
                      ) : null}

                      {/* EDITED BADGE / AUDIT TRAIL */}
                      {tx.isEdited && (
                        <button
                          onClick={() => setSelectedTxForAuditDetail(tx)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors cursor-pointer"
                          title={`Giao dịch này đã được Admin chỉnh sửa. Bấm để xem lý do: ${tx.editReason || ''}`}
                        >
                          <History className="w-3 h-3 text-amber-600" />
                          <span>Đã Sửa</span>
                        </button>
                      )}
                    </div>

                    {/* Note & Context */}
                    {tx.note && (
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/90 px-2 py-1 rounded-md border border-slate-100 inline-block">
                        &ldquo;{tx.note}&rdquo;
                      </p>
                    )}

                    {/* Audit Notice on Card if edited */}
                    {tx.isEdited && tx.editReason && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/70 px-2 py-0.5 rounded border border-amber-200/60 inline-flex items-center gap-1">
                        <span className="font-semibold">Lý do sửa từ Admin:</span>
                        <span>{tx.editReason} ({tx.lastEditedAt || 'Gần đây'})</span>
                      </div>
                    )}

                    {/* Date & Cash Handover Info */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateVN(tx.date)} {tx.time ? `• ${tx.time}` : ''}
                      </span>
                      <span>•</span>
                      <span>Người nhận/giao tiền mặt: <strong className="text-slate-700 font-medium">{tx.cashReceiver || tx.recordedBy}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded">Tiền mặt</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount & Role Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-13 sm:pl-0">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatVND(tx.amount)}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">
                      {isIncome ? 'Tiền thu vào' : 'Tiền chi ra'}
                    </span>
                  </div>

                  {/* Role Actions */}
                  <div className="flex items-center gap-1">
                    {/* Admin Mode: Full rights to Edit and Delete */}
                    {currentRole === 'admin' && (
                      <>
                        {onEditTransaction && (
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Quản trị viên sửa giao dịch (Yêu cầu nhập lý do)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            onClick={() => onDeleteTransaction(tx)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Quản trị viên xóa giao dịch (Yêu cầu nhập lý do)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Treasurer Mode: Explicit Lock indicating no edit/delete permission */}
                    {currentRole === 'treasurer' && (
                      <div 
                        className="p-1.5 text-slate-300 rounded-lg cursor-not-allowed group relative"
                        title="Thủ quỹ chỉ có quyền thêm, không có quyền sửa/xóa giao dịch"
                      >
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Quick View Edit History for this Transaction */}
      {selectedTxForAuditDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-sm">Lịch Sử Chỉnh Sửa Giao Dịch</h4>
              </div>
              <button
                onClick={() => setSelectedTxForAuditDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-800">{selectedTxForAuditDetail.title}</p>
                <p className="text-slate-600">Số tiền hiện tại: <strong className="text-emerald-700">{formatVND(selectedTxForAuditDetail.amount)}</strong></p>
                {selectedTxForAuditDetail.previousAmount && (
                  <p className="text-slate-500 line-through">
                    Số tiền ban đầu trước khi sửa: {formatVND(selectedTxForAuditDetail.previousAmount)}
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-900">Ghi chú & Lý do chỉnh sửa từ Admin:</span>
                <p className="text-amber-800 italic">&ldquo;{selectedTxForAuditDetail.editReason || 'Admin điều chỉnh số liệu theo hóa đơn gốc'}&rdquo;</p>
                <div className="text-[11px] text-amber-700/80 pt-1">
                  Người sửa: {selectedTxForAuditDetail.lastEditedBy || 'Admin'} • Thời gian: {selectedTxForAuditDetail.lastEditedAt || 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxForAuditDetail(null)}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

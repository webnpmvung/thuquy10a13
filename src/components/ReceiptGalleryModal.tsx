import React, { useState } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Calendar, 
  Banknote, 
  Download, 
  ExternalLink,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types/fund';
import { formatVND, formatDateVN } from '../utils/formatters';

interface ReceiptGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onViewSingleReceipt: (imageUrl: string, title: string, images?: {url: string; timestamp: string}[]) => void;
}

export const ReceiptGalleryModal: React.FC<ReceiptGalleryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onViewSingleReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const receiptTransactions = transactions.filter(
    (t) => !t.isDeleted && (t.receiptImage || (t.receiptImages && t.receiptImages.length > 0))
  );

  const filteredReceipts = receiptTransactions.filter((tx) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      tx.title.toLowerCase().includes(term) ||
      (tx.note || '').toLowerCase().includes(term) ||
      (tx.recordedBy || '').toLowerCase().includes(term)
    );
  });

  const galleryItems = filteredReceipts.flatMap(tx => {
    if (tx.receiptImages && tx.receiptImages.length > 0) {
      return tx.receiptImages.map((img, idx) => ({
        ...tx,
        displayUrl: img.url,
        displayTimestamp: img.timestamp,
        imageIndex: idx,
        totalImages: tx.receiptImages!.length
      }));
    } else {
      return [{
        ...tx,
        displayUrl: tx.receiptImage!,
        displayTimestamp: tx.date,
        imageIndex: 0,
        totalImages: 1
      }];
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Thư Viện Hóa Đơn & Chứng Từ Tiền Mặt
              </h3>
              <p className="text-[11px] text-slate-300">
                Toàn bộ ảnh chụp hóa đơn, phiếu mua hàng đối chiếu công khai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên khoản chi, người mua..."
              className="w-full pl-9 pr-3 py-1.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-slate-800"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {galleryItems.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Chưa có hóa đơn nào</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Khi thủ quỹ đính kèm ảnh hóa đơn lúc chi tiền, ảnh sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {galleryItems.map((item, i) => (
                <div
                  key={`${item.id}-${item.imageIndex}`}
                  onClick={() => onViewSingleReceipt(item.displayUrl, item.title, item.receiptImages || (item.receiptImage ? [{url: item.receiptImage, timestamp: item.date}] : []))}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  <div className="h-40 bg-slate-950 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={item.displayUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <span className="absolute bottom-2 left-2 text-[11px] font-bold text-white font-mono bg-black/60 px-2 py-0.5 rounded">
                      {formatVND(item.amount)}
                    </span>
                    {item.totalImages > 1 && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-white font-mono bg-indigo-600/90 px-1.5 py-0.5 rounded-full">
                        {item.imageIndex + 1}/{item.totalImages}
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.displayTimestamp || formatDateVN(item.date)}</span>
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Người nộp: {item.recordedBy}</span>
                      <span className="text-indigo-600 font-semibold group-hover:underline">
                        Phóng to
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong>{galleryItems.length}</strong> ảnh chứng từ minh bạch
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

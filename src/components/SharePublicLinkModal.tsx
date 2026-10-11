import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Eye,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';
import { ClassSettings } from '../types/fund';
import { formatVND } from '../utils/formatters';

interface SharePublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ClassSettings;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  paidCount: number;
  totalStudents: number;
}

export const SharePublicLinkModal: React.FC<SharePublicLinkModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentBalance,
  totalIncome,
  totalExpense,
  paidCount,
  totalStudents,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate public view URL (points to current app URL with read-only flag if desired)
  const publicViewUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?view=class_10a13`
    : '';

  useEffect(() => {
    if (isOpen && publicViewUrl) {
      QRCode.toDataURL(publicViewUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, publicViewUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicViewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyZaloPost = () => {
    const message = `📢 SỔ QUỸ LỚP ${settings.className.toUpperCase()} (CÔNG KHAI & MINH BẠCH)
Xin chào các bạn và thầy cô lớp ${settings.className}!

Dưới đây là link tra cứu và đối soát toàn bộ thu chi quỹ lớp ${settings.className}:
🔗 Link xem trực tiếp (Lưu lại để xem lâu dài):
👉 ${publicViewUrl}

📊 TỔNG QUAN QUỸ HIỆN TẠI:
- 💰 Số tiền còn lại: ${formatVND(currentBalance)}
- 🟢 Tổng đã thu vào: ${formatVND(totalIncome)}
- 🔴 Tổng đã chi ra: ${formatVND(totalExpense)}
- 👥 Tiến độ nộp quỹ: ${paidCount}/${totalStudents} bạn (${Math.round((paidCount / (totalStudents || 1)) * 100)}%)

✨ Mọi khoản thu chi, hóa đơn mua sắm, danh sách nộp quỹ đều được Thủ quỹ (${settings.treasurerName}) cập nhật liên tục tại link trên. Cả lớp chỉ cần lưu link 1 lần là theo dõi được suốt năm học! ❤️`;

    navigator.clipboard.writeText(message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Ma_QR_So_Quy_Lop_${settings.className}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gửi Link Cho Cả Lớp 10A13 Xem
              </h3>
              <p className="text-[11px] text-teal-800 font-medium">Chỉ cần gửi 1 lần duy nhất - Xem lâu dài suốt năm học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Permanent Link Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Liên kết xem sổ quỹ (Chế độ Xem Cho Cả Lớp)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
                {publicViewUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép Link'}</span>
              </button>
            </div>
          </div>

          {/* Benefits Info Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2 text-xs text-emerald-950">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tiện ích cho Thủ Quỹ & Cả Lớp:</span>
            </div>
            <ul className="space-y-1 text-emerald-900/90 list-disc list-inside">
              <li><strong>Gửi 1 lần duy nhất:</strong> Bạn ghim link này lên đầu nhóm Zalo / Messenger của lớp 10A13.</li>
              <li><strong>Tự động cập nhật:</strong> Mỗi khi thủ quỹ nhập thêm chi tiêu hoặc đánh dấu ai đã nộp tiền, số liệu trên link tự nhảy ngay lập tức.</li>
              <li><strong>An toàn tuyệt đối:</strong> Các bạn chỉ có quyền xem chi tiết và đối chiếu hóa đơn, không thể sửa hay xóa dữ liệu của thủ quỹ.</li>
            </ul>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {qrDataUrl && (
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <img src={qrDataUrl} alt="QR Code Link lớp" className="w-28 h-28" />
              </div>
            )}
            <div className="space-y-2 text-center sm:text-left">
              <div className="font-bold text-slate-800 text-sm">
                Mã QR Quét Bằng Điện Thoại
              </div>
              <p className="text-xs text-slate-500">
                In ra dán lên bảng tin lớp hoặc gửi vào nhóm để các bạn quét camera xem nhanh bất cứ lúc nào.
              </p>
              <button
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Tải ảnh mã QR này</span>
              </button>
            </div>
          </div>

          {/* Copy Message for Zalo Group */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mẫu tin nhắn ghim nhóm Zalo / Messenger Lớp 10A13
              </label>
              <button
                onClick={handleCopyZaloPost}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMessage ? 'Đã copy mẫu tin nhắn!' : 'Sao chép toàn bộ tin nhắn'}</span>
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-mono whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
              {`📢 SỔ QUỸ LỚP ${settings.className.toUpperCase()} (CÔNG KHAI & MINH BẠCH)
Xin chào các bạn và thầy cô lớp ${settings.className}!
Dưới đây là link tra cứu thu chi quỹ lớp:
👉 ${publicViewUrl}
- 💰 Số tiền còn lại: ${formatVND(currentBalance)}
- 🟢 Tổng thu vào: ${formatVND(totalIncome)}
- 🔴 Tổng chi ra: ${formatVND(totalExpense)}`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};

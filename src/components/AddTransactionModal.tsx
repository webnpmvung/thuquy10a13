import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  MinusCircle, 
  Camera, 
  Calendar, 
  Clock, 
  Tag, 
  FileText, 
  User, 
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Check,
  Upload,
  AlertCircle,
  HelpCircle,
  Loader2,
  HardDrive
} from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType, UserRole } from '../types/fund';
import { CATEGORY_DETAILS } from '../data/initialData';
import { getTodayDateString, getCurrentTimeString, formatVND } from '../utils/formatters';
import { uploadImageToGoogleDriveViaAppsScript } from '../utils/googleSheetsScript';
import heic2any from 'heic2any';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id'> | Transaction, editReason?: string) => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  treasurerName: string;
  adminName: string;
  currentRole: UserRole;
  appsScriptImageUrl?: string;
  driveFolderId?: string;
  onOpenSheetModal?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'expense',
  editingTransaction = null,
  treasurerName,
  adminName,
  currentRole,
  appsScriptImageUrl,
  driveFolderId,
  onOpenSheetModal,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<TransactionCategory>('in_an');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');
  const [cashReceiver, setCashReceiver] = useState(treasurerName);
  const [receiptImages, setReceiptImages] = useState<{ url: string; timestamp: string }[]>([]);
  const [editReason, setEditReason] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opened or editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || getCurrentTimeString());
      setNote(editingTransaction.note || '');
      setCashReceiver(editingTransaction.cashReceiver || treasurerName);
      
      let initialImages: { url: string; timestamp: string }[] = [];
      if (editingTransaction.receiptImages && editingTransaction.receiptImages.length > 0) {
        initialImages = editingTransaction.receiptImages;
      } else if (editingTransaction.receiptImage) {
        initialImages = [{ url: editingTransaction.receiptImage, timestamp: `${editingTransaction.date} ${editingTransaction.time || '00:00'}` }];
      }
      setReceiptImages(initialImages);
      setEditReason(editingTransaction.editReason || '');
    } else {
      setType(initialType);
      setTitle('');
      setAmount('');
      setCategory(initialType === 'income' ? 'thu_quy' : 'in_an');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setNote('');
      setCashReceiver(treasurerName);
      setReceiptImages([]);
      setEditReason('');
    }
    setUploadError(null);
    setIsUploadingImages(false);
  }, [editingTransaction, initialType, treasurerName, isOpen]);

  if (!isOpen) return null;

  // Nén ảnh qua Canvas thành chuỗi Base64 chuẩn JPEG (Hỗ trợ HEIC, PNG, JPG, WEBP...)
  const compressImageToBase64 = async (file: File): Promise<string> => {
    let sourceBlob: Blob = file;

    // Tự động nhận diện và chuyển đổi ảnh định dạng HEIC / HEIF (từ camera iPhone / iPad) sang JPEG
    const isHeic = 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.heif') || 
      file.type.toLowerCase().includes('heic') || 
      file.type.toLowerCase().includes('heif');

    if (isHeic) {
      try {
        const converted = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.85,
        });
        sourceBlob = Array.isArray(converted) ? converted[0] : converted;
      } catch (heicErr) {
        console.warn('Lỗi heic2any, thử đọc ảnh gốc:', heicErr);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            resolve(dataUrl);
          } else {
            reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh qua Canvas'));
          }
        };
        img.onerror = () => reject(new Error('Tệp hình ảnh không hợp lệ hoặc không thể nén'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
      reader.readAsDataURL(sourceBlob);
    });
  };

  // Tải ảnh trực tiếp lên Google Drive thông qua Apps Script Web App và nhận URL công khai
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const scriptUrl = appsScriptImageUrl?.trim();

    setIsUploadingImages(true);
    setUploadError(null);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const timestamp = `${dateStr} ${timeStr}`;

    try {
      const uploadedResults: { url: string; timestamp: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 1. Nén ảnh bằng canvas thành chuỗi Base64 chuẩn JPEG (hỗ trợ HEIC, PNG, JPG...)
        const base64DataUrl = await compressImageToBase64(file);
        
        let finalImageUrl = base64DataUrl;

        // 2. Nếu có URL Apps Script, gửi lên Google Drive
        if (scriptUrl) {
          try {
            const driveUrl = await uploadImageToGoogleDriveViaAppsScript(
              base64DataUrl,
              scriptUrl,
              driveFolderId,
              `receipt_${Date.now()}_${i + 1}.jpg`
            );
            if (driveUrl) {
              finalImageUrl = driveUrl;
            }
          } catch (driveErr: any) {
            console.warn('Google Drive Apps Script Upload Warning:', driveErr);
            // Fallback giữ Base64 để không làm mất ảnh hóa đơn của người dùng
            setUploadError(
              `Lưu ý: Không thể kết nối Google Drive (${driveErr?.message || 'Lỗi HTTP'}). Ảnh đã được nén lưu trực tiếp vào phiếu để không bị mất!`
            );
          }
        }

        uploadedResults.push({ url: finalImageUrl, timestamp });
      }
      setReceiptImages(prev => [...prev, ...uploadedResults]);
    } catch (err: any) {
      console.error('Image processing error:', err);
      setUploadError(
        err?.message || 
        'Không thể xử lý hình ảnh. Vui lòng thử chọn tệp ảnh khác!'
      );
    } finally {
      setIsUploadingImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập nội dung thu chi!');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ (> 0 đ)!');
      return;
    }

    if (editingTransaction) {
      if (currentRole !== 'admin') {
        alert('Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa giao dịch! Thủ quỹ chỉ có quyền thêm mới.');
        return;
      }
      if (!editReason.trim()) {
        alert('Vui lòng nhập lý do chỉnh sửa để ghi vào nhật ký kiểm toán!');
        return;
      }
    }

    if (isUploadingImages) {
      alert('Đang tải ảnh lên Google Drive, vui lòng đợi trong giây lát...');
      return;
    }

    // Payload chỉ chứa URL của Google Drive, tuyệt đối KHÔNG chứa chuỗi Base64
    const payload = {
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      type,
      title: title.trim(),
      amount: numAmount,
      category,
      date,
      time,
      note: note.trim(),
      recordedBy: editingTransaction?.recordedBy || treasurerName,
      paymentMethod: 'cash' as const,
      cashReceiver: cashReceiver.trim() || treasurerName,
      receiptImage: receiptImages.length > 0 ? receiptImages[0].url : undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      syncStatus: 'pending' as const,
    };

    onSave(payload as any, editReason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            {type === 'income' ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <MinusCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingTransaction ? 'Sửa Giao Dịch (Quản Trị Viên)' : type === 'income' ? 'Ghi Nhận Tiền Thu Vào' : 'Ghi Nhận Khoản Chi Ra'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Giao dịch tiền mặt 100% • Quỹ Lớp 10A13
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-base sm:text-sm">
          {/* Type Toggle (Only when creating new) */}
          {!editingTransaction && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('in_an');
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Khoản Chi Ra (Tiêu Quỹ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('thu_quy');
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Khoản Thu Vào (Nộp Quỹ)</span>
              </button>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Số Tiền Mặt (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Nhập số tiền..."
                className="w-full pl-3 pr-16 py-2.5 text-lg font-bold font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                VNĐ
              </span>
            </div>

          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Nội Dung Thu / Chi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? 'VD: Mua 2 chổi và nước lau bảng...' : 'VD: Thu đợt 1 quỹ lớp HK1...'}
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Danh Mục Phân Loại
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              {Object.entries(CATEGORY_DETAILS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Ngày Giao Dịch
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Giờ Giao Dịch
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Detailed Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              {type === 'expense' 
                ? 'Ghi Chú Chi Tiết (Nơi mua, quy cách, người ứng tiền...)' 
                : 'Ghi Chú Chi Tiết (Đợt thu, lý do, người nộp...)'}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'expense' 
                ? 'VD: Mua tại cửa hàng tạp hóa cô Hoa cổng trường, có hóa đơn bán lẻ...' 
                : 'VD: Thu tiền quỹ lớp đợt 1, phụ huynh nộp trực tiếp...'}
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 resize-none"
            />
          </div>

          {/* ATTACH RECEIPT / BILL IMAGE SECTION (Enhanced) */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Ảnh Chụp Hóa Đơn / Phiếu Thu Tiền Mặt</span>
              </label>
              {receiptImages.length > 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {receiptImages.length} ảnh
                </span>
              )}
            </div>

            {/* Hidden native inputs supporting HEIC, HEIF, PNG, JPG, WEBP */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*,.heic,.heif,.HEIC,.HEIF,.png,.jpg,.jpeg,.webp"
              capture="environment"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.heic,.heif,.HEIC,.HEIF,.png,.jpg,.jpeg,.webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              {/* Direct Mobile Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-3 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl flex flex-col items-center justify-center gap-1 text-indigo-800 transition-colors cursor-pointer"
              >
                <Camera className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">Thêm Từ Camera</span>
                <span className="text-[10px] text-indigo-600/80">Chụp ảnh hóa đơn</span>
              </button>

              {/* Upload from Gallery / Files */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-600" />
                <span className="text-xs font-bold">Chọn Từ Thư Viện</span>
                <span className="text-[10px] text-slate-500">HEIC, PNG, JPG</span>
              </button>
            </div>

            {/* Uploading indicator */}
            {isUploadingImages && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5 text-teal-900 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                <div>
                  <span className="font-bold">Đang tải ảnh lên Google Drive...</span>
                  <p className="text-[11px] text-teal-700">Tự động nén ảnh và lưu trữ trên thư mục Google Drive cá nhân qua Apps Script Web App.</p>
                </div>
              </div>
            )}

            {/* Upload error notice */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Không thể tải ảnh lên Google Drive</span>
                </div>
                <p className="text-[11px] leading-relaxed">{uploadError}</p>
                {onOpenSheetModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSheetModal();
                    }}
                    className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer text-[11px]"
                  >
                    <span>Mở Cài đặt Google Drive & Sheets để cấu hình URL Apps Script →</span>
                  </button>
                )}
              </div>
            )}

            {receiptImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {receiptImages.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl border border-indigo-200 bg-slate-900 overflow-hidden group h-32">
                    <img
                      src={img.url}
                      alt={`Hóa đơn ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 text-center font-mono">
                      {img.timestamp}
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 bg-rose-500/90 hover:bg-rose-600 text-white p-1.5 rounded-full shadow-lg transition-all cursor-pointer"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                {appsScriptImageUrl ? (
                  <span className="text-teal-700 font-semibold">Google Drive: Đã kết nối Web App</span>
                ) : (
                  <span className="text-amber-700 font-medium">Google Drive: Chưa cấu hình URL Web App</span>
                )}
              </span>
              {onOpenSheetModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSheetModal();
                  }}
                  className="text-teal-700 hover:underline font-semibold cursor-pointer"
                >
                  Cài đặt
                </button>
              )}
            </div>
          </div>

          {/* EDIT REASON FOR ADMIN */}
          {editingTransaction && currentRole === 'admin' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-amber-900 uppercase">
                Lý Do Chỉnh Sửa (Ghi vào Nhật Ký Kiểm Toán) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="VD: Cập nhật lại số tiền chính xác theo hóa đơn gốc..."
                className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:border-amber-600"
              />
              <p className="text-[10px] text-amber-700">
                Chỉnh sửa sẽ được ghi vết rõ ràng dưới tên: {adminName}
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploadingImages}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploadingImages}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isUploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Tải Ảnh...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingTransaction ? 'Lưu Thay Đổi' : 'Ghi Vào Sổ Quỹ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  images?: {url: string; timestamp: string}[];
  title: string;
  amount?: number;
  date?: string;
  recordedBy?: string;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  images = [],
  title,
  amount,
  date,
  recordedBy,
}) => {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setZoom(1);
      setCurrentIndex(0);
      setIsDownloading(false);
    }
  }, [isOpen]);

  const allImages = images.length > 0 ? images : (imageUrl ? [{url: imageUrl, timestamp: date || ''}] : []);

  if (!isOpen || allImages.length === 0) return null;

  const currentImage = allImages[currentIndex];

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
    setRotation(0);
    setZoom(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setRotation(0);
    setZoom(1);
  };

  // Safe file download without navigating the window / iframe
  const handleDownload = async () => {
    if (isDownloading || !currentImage?.url) return;
    setIsDownloading(true);

    const safeTitle = (title || 'Hoa_Don').slice(0, 30).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
    const fileName = `Hoa_Don_10A13_${safeTitle}_${currentIndex + 1}.jpg`;

    try {
      let blob: Blob | null = null;

      // Case 1: Base64 data URL
      if (currentImage.url.startsWith('data:')) {
        try {
          const parts = currentImage.url.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          blob = new Blob([ab], { type: mime });
        } catch (base64Err) {
          console.warn('Base64 parse error, fallback to fetch:', base64Err);
        }
      }

      // Case 2: Remote URL (e.g. lh3.googleusercontent.com, google drive direct link)
      if (!blob) {
        try {
          const res = await fetch(currentImage.url, { mode: 'cors' });
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (fetchErr) {
          console.warn('Direct fetch failed, trying canvas export:', fetchErr);
        }
      }

      // Case 3: Canvas drawing fallback for loaded image
      if (!blob) {
        blob = await new Promise<Blob | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth || img.width || 800;
              canvas.height = img.naturalHeight || img.height || 600;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = currentImage.url;
        });
      }

      // Trigger synthetic download via Blob URL
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      } else {
        // Fallback for strict CORS: open in a new tab if allowed or inform user
        const newTab = document.createElement('a');
        newTab.href = currentImage.url;
        newTab.target = '_blank';
        newTab.rel = 'noopener noreferrer';
        newTab.download = fileName;
        document.body.appendChild(newTab);
        newTab.click();
        document.body.removeChild(newTab);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh hóa đơn:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                {title} {allImages.length > 1 ? `(${currentIndex + 1}/${allImages.length})` : ''}
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ảnh chụp hóa đơn / biên nhận tiền mặt đối soát quỹ lớp 10A13
            </p>
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRotate}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Xoay ảnh 90 độ"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Tải ảnh về máy"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Stage */}
        <div className="flex-1 bg-black/70 p-4 flex items-center justify-center min-h-[320px] max-h-[65vh] overflow-auto select-none relative group">
          {allImages.length > 1 && (
            <>
              <button 
                onClick={handlePrev} 
                className="absolute left-2 sm:left-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-opacity opacity-80 hover:opacity-100 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={handleNext} 
                className="absolute right-2 sm:right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-opacity opacity-80 hover:opacity-100 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={currentImage.url}
            alt={title}
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              transition: 'transform 0.2s ease-in-out',
            }}
            className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
          {currentImage.timestamp && (
            <div className="absolute bottom-4 right-4 bg-black/80 text-white font-mono text-[10px] px-2 py-1 rounded shadow">
              {currentImage.timestamp}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chứng từ hợp lệ
            </span>
            {recordedBy && <span>Người tải lên: {recordedBy}</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 text-white rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-pointer shadow-xs"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Ảnh Hóa Đơn</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

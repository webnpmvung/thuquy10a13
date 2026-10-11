export type TransactionType = 'income' | 'expense';

export type UserRole = 'viewer' | 'treasurer' | 'admin';

export type TransactionCategory = 
  | 'in_an' // In ấn tài liệu
  | 've_sinh' // Dụng cụ vệ sinh, lau bảng
  | 'lien_hoan' // Liên hoan, sinh nhật
  | 'hoat_dong' // Hoạt động đoàn, thể thao, văn nghệ
  | 'tri_an' // Hoa, quà thầy cô 20/11, 8/3
  | 'thu_quy' // Thu quỹ định kỳ
  | 'ung_ho' // Quyên góp, ủng hộ
  | 'khac'; // Chi phí khác

export interface AuditLog {
  id: string;
  transactionId: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'semester_reset' | 'wipe_all_data';
  performedBy: string; // 'Admin (GVCN)', 'Admin (Lớp trưởng)', 'Thủ quỹ Nguyễn Thu Uyên'
  timestamp: string; // ISO string or formatted date
  reason?: string; // Lý do chỉnh sửa hoặc xóa
  snapshotTitle?: string;
  snapshotAmount?: number;
  snapshotCategory?: string;
  snapshotDate?: string;
  details?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  recordedBy: string; // Tên thủ quỹ ghi nhận
  note?: string;
  receiptImage?: string; // Base64 image data URL for bill/proof
  receiptImages?: { url: string; timestamp: string }[]; // Array of base64 images with timestamps
  paymentMethod: 'cash'; // 100% Tiền mặt
  cashReceiver?: string; // Người trực tiếp nhận tiền mặt
  studentId?: string; // ID học sinh nếu là đóng quỹ cá nhân
  studentName?: string; // Tên học sinh
  syncStatus?: 'synced' | 'pending' | 'error';
  
  // Edit & Delete Tracking / Audit metadata
  isEdited?: boolean;
  lastEditedAt?: string;
  lastEditedBy?: string;
  editReason?: string;
  previousAmount?: number;
  previousTitle?: string;

  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export interface StudentMember {
  id: string;
  stt: number;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  phone?: string;
  hasPaid: boolean;
  paidAmount: number;
  paidDate?: string;
  paymentMethod: 'cash'; // Tiền mặt
  cashReceiver?: string; // Tên thủ quỹ nhận tiền mặt
  note?: string;
}

export interface FundCampaign {
  id: string;
  title: string; // VD: "Quỹ Lớp Học Kỳ 1 - Năm học 2024-2025"
  targetPerStudent: number; // Mức thu mỗi bạn (VD: 200,000 đ)
  startDate: string;
  endDate?: string;
  isActive: boolean;
  collectionLocation?: string; // Địa điểm thu tiền mặt tại lớp (VD: Bàn 1 dãy 2)
}

export interface GoogleSheetConfig {
  spreadsheetUrl: string;
  appsScriptUrl: string;
  appsScriptImageUrl?: string; // Web App Google Apps Script chuyên upload ảnh lên Google Drive
  driveFolderId?: string; // ID thư mục Google Drive chứa ảnh hóa đơn (tùy chọn)
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface ClassSettings {
  className: string;
  schoolName: string;
  schoolYear: string;
  treasurerName: string;
  treasurerPhone: string;
  treasurerPin: string; // Mã PIN Thủ quỹ (chỉ được thêm, không được sửa/xóa) - Mặc định: 1013
  treasurer2Name?: string; // Tên Thủ quỹ 2
  treasurer2Pin?: string; // Mã PIN Thủ quỹ 2
  adminPin: string; // Mã PIN Admin (quyền cao nhất: được sửa/xóa có ghi chú lý do) - Mặc định: 8888
  adminName: string; // Tên Quản trị viên (GVCN / Lớp Trưởng)
  cashStorageNote: string; // Ghi chú cất giữ tiền mặt (VD: Két sắt tủ lớp / Thủ quỹ giữ)
  adminGoogleEmails?: string[]; // Email Google có quyền Quản trị viên
  treasurerGoogleEmails?: string[]; // Email Google có quyền Thủ quỹ
  sheetConfig: GoogleSheetConfig;
  fundCampaign: FundCampaign;
}

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

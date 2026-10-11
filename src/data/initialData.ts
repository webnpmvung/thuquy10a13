import { ClassSettings, StudentMember, Transaction, AuditLog } from '../types/fund';

function resolveCleanAppsScriptUrl(rawUrl?: string): string {
  const fallback = 'https://script.google.com/macros/s/AKfycbwknpHei6xEU81OAS51eNhoR78f8dF6LkGosc6Xw7xMcnrAIKHGcxnZSinfY3YrlpnO/exec';
  if (!rawUrl) return fallback;
  let clean = rawUrl.trim();
  if (clean.includes('google.com/url') && clean.includes('q=')) {
    try {
      const match = clean.match(/[?&]q=([^&]+)/);
      if (match && match[1]) {
        clean = decodeURIComponent(match[1]);
      }
    } catch {}
  }
  return clean || fallback;
}

export const DEFAULT_SETTINGS: ClassSettings = {
  className: '10A13',
  schoolName: 'Trường THPT',
  schoolYear: '2024 - 2025',
  treasurerName: 'Nguyễn Thu Uyên (Thủ Quỹ)',
  treasurerPhone: '0987654321',
  treasurerPin: '1013', // Mã PIN Thủ Quỹ (chỉ thêm, không sửa/xóa)
  treasurer2Name: 'Chưa có', // Tên Thủ quỹ 2
  treasurer2Pin: '', // Mã PIN Thủ quỹ 2
  adminPin: '8888', // Mã PIN Admin (có quyền sửa/xóa kèm ghi chú)
  adminName: 'Thầy Chủ Nhiệm / Ban Cán Sự',
  cashStorageNote: 'Tiền mặt do Thủ quỹ Thu Uyên trực tiếp giữ và quản lý tại lớp',
  adminGoogleEmails: ['webnpmvung1@gmail.com'], // Email Google Quản trị viên mặc định
  treasurerGoogleEmails: [], // Danh sách email Google Thủ quỹ được Admin cấp quyền
  sheetConfig: {
    spreadsheetUrl: '',
    appsScriptUrl: '',
    appsScriptImageUrl: resolveCleanAppsScriptUrl(import.meta.env.VITE_APPS_SCRIPT_IMAGE_URL),
    driveFolderId: import.meta.env.VITE_DRIVE_FOLDER_ID || '1d1YTxkOFluqzRzq9gBLMT1_yCBBdrld4',
    autoSync: false,
    lastSyncedAt: undefined,
  },
  fundCampaign: {
    id: 'hk1-2024',
    title: 'Quỹ Lớp Học Kỳ 1 (2024 - 2025)',
    targetPerStudent: 200000, // 200k/bạn
    startDate: '2024-09-05',
    isActive: true,
    collectionLocation: 'Trực tiếp tại lớp 10A13 (Bàn 1 Dãy 2 - Đầu giờ hoặc ra chơi)',
  },
};

export const DEFAULT_STUDENTS: StudentMember[] = [
  { id: 's-01', stt: 1, fullName: 'Nguyễn Tuấn Anh', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-08', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nhận tiền mặt tờ 200k' },
  { id: 's-02', stt: 2, fullName: 'Trần Thị Ngọc Ánh', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-08', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt giờ ra chơi' },
  { id: 's-03', stt: 3, fullName: 'Lê Hoàng Bách', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-09', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng tiền mặt' },
  { id: 's-04', stt: 4, fullName: 'Phạm Gia Bảo', gender: 'Nam', hasPaid: false, paidAmount: 0, paymentMethod: 'cash', note: 'Hẹn thứ 2 đóng tiền mặt' },
  { id: 's-05', stt: 5, fullName: 'Đỗ Thùy Chi', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-10', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nhận đủ' },
  { id: 's-06', stt: 6, fullName: 'Vũ Đức Cường', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-10', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt' },
  { id: 's-07', stt: 7, fullName: 'Bùi Phương Dung', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-11', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nhận' },
  { id: 's-08', stt: 8, fullName: 'Hoàng Hải Đăng', gender: 'Nam', hasPaid: false, paidAmount: 0, paymentMethod: 'cash', note: 'Chưa mang tiền mặt' },
  { id: 's-09', stt: 9, fullName: 'Dương Khánh Hà', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-12', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt' },
  { id: 's-10', stt: 10, fullName: 'Nguyễn Quốc Huy', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-12', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng' },
  { id: 's-11', stt: 11, fullName: 'Đinh Mai Hương', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-13', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt' },
  { id: 's-12', stt: 12, fullName: 'Phan Minh Khang', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-13', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nhận' },
  { id: 's-13', stt: 13, fullName: 'Lý Diệu Linh', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-14', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng' },
  { id: 's-14', stt: 14, fullName: 'Trịnh Nhật Minh', gender: 'Nam', hasPaid: false, paidAmount: 0, paymentMethod: 'cash', note: '' },
  { id: 's-15', stt: 15, fullName: 'Vũ Thảo My', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-15', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng' },
  { id: 's-16', stt: 16, fullName: 'Ngô Trọng Nam', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-15', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt' },
  { id: 's-17', stt: 17, fullName: 'Đào Yến Nhi', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-16', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng' },
  { id: 's-18', stt: 18, fullName: 'Lê Hồng Phúc', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-16', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Nộp tiền mặt' },
  { id: 's-19', stt: 19, fullName: 'Nguyễn Như Quỳnh', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-17', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nộp' },
  { id: 's-20', stt: 20, fullName: 'Tạ Minh Sang', gender: 'Nam', hasPaid: false, paidAmount: 0, paymentMethod: 'cash', note: '' },
  { id: 's-21', stt: 21, fullName: 'Bùi Kim Thái', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-18', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã đóng' },
  { id: 's-22', stt: 22, fullName: 'Vũ Phương Thảo', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-18', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nộp tiền mặt' },
  { id: 's-23', stt: 23, fullName: 'Trần Đức Thắng', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-19', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nhận' },
  { id: 's-24', stt: 24, fullName: 'Nguyễn Thu Uyên', gender: 'Nữ', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-08', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Thủ quỹ tự nộp' },
  { id: 's-25', stt: 25, fullName: 'Hoàng Quốc Việt', gender: 'Nam', hasPaid: true, paidAmount: 200000, paidDate: '2024-09-20', paymentMethod: 'cash', cashReceiver: 'Nguyễn Thu Uyên', note: 'Đã nộp tiền mặt' },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    type: 'income',
    title: 'Thu đợt 1 Quỹ lớp HK1 (21 bạn nộp tiền mặt)',
    amount: 4200000,
    category: 'thu_quy',
    date: '2024-09-20',
    time: '11:30',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Tổng thu tiền mặt đợt 1 theo danh sách nộp trực tiếp tại lớp 10A13',
    paymentMethod: 'cash',
    cashReceiver: 'Nguyễn Thu Uyên',
    syncStatus: 'synced',
  },
  {
    id: 'tx-002',
    type: 'expense',
    title: 'Mua dụng cụ trực nhật, 2 chổi & nước lau bảng',
    amount: 145000,
    category: 've_sinh',
    date: '2024-09-10',
    time: '14:15',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Chi tiền mặt mua tại tiệm tạp hóa cổng trường: 2 chổi quét lớp, 1 hót rác, khăn lau bảng Microfiber',
    paymentMethod: 'cash',
    syncStatus: 'synced',
    isEdited: true,
    lastEditedAt: '2024-09-11 09:00',
    lastEditedBy: 'Thầy Chủ Nhiệm (Admin)',
    editReason: 'Chỉnh sửa lại số tiền chính xác theo hóa đơn gốc từ 150.000đ thành 145.000đ',
    previousAmount: 150000,
    previousTitle: 'Mua dụng cụ trực nhật và chổi',
  },
  {
    id: 'tx-003',
    type: 'expense',
    title: 'In đề cương ôn tập môn Toán & Lý đầu năm',
    amount: 320000,
    category: 'in_an',
    date: '2024-09-15',
    time: '08:45',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Thanh toán tiền mặt cho quán Photocopy cổng phụ, in 42 bộ tài liệu cho cả lớp',
    paymentMethod: 'cash',
    syncStatus: 'synced',
  },
  {
    id: 'tx-004',
    type: 'expense',
    title: 'Mua bánh kẹo & trái cây liên hoan Trung Thu 10A13',
    amount: 650000,
    category: 'lien_hoan',
    date: '2024-09-17',
    time: '16:00',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Chi tiền mặt mua bánh nướng, hoa quả và trà sữa phá cỗ Trung thu tại lớp',
    paymentMethod: 'cash',
    syncStatus: 'synced',
  },
  {
    id: 'tx-005',
    type: 'income',
    title: 'Thầy Chủ Nhiệm ủng hộ tiền mặt phong trào thể thao',
    amount: 500000,
    category: 'ung_ho',
    date: '2024-09-22',
    time: '10:00',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Thầy trao tiền mặt trực tiếp cho thủ quỹ để hỗ trợ đội bóng đá nam 10A13',
    paymentMethod: 'cash',
    cashReceiver: 'Nguyễn Thu Uyên',
    syncStatus: 'synced',
  },
  {
    id: 'tx-006',
    type: 'expense',
    title: 'Mua 2 thùng nước suối giải bóng đá khối 10',
    amount: 160000,
    category: 'hoat_dong',
    date: '2024-09-25',
    time: '15:30',
    recordedBy: 'Nguyễn Thu Uyên (Thủ Quỹ)',
    note: 'Chi tiền mặt mua 2 thùng Aquafina tiếp sức giải thể thao',
    paymentMethod: 'cash',
    syncStatus: 'synced',
  },
];

export const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    transactionId: 'tx-002',
    action: 'updated',
    performedBy: 'Thầy Chủ Nhiệm (Admin)',
    timestamp: '2024-09-11 09:00',
    reason: 'Chỉnh sửa lại số tiền chính xác theo hóa đơn gốc từ 150.000đ thành 145.000đ',
    snapshotTitle: 'Mua dụng cụ trực nhật, 2 chổi & nước lau bảng',
    snapshotAmount: 145000,
    snapshotCategory: 've_sinh',
    snapshotDate: '2024-09-10',
    details: 'Đã cập nhật số tiền từ 150.000 đ sang 145.000 đ sau khi đối soát hóa đơn giấy.',
  },
  {
    id: 'audit-002',
    transactionId: 'tx-deleted-sample',
    action: 'deleted',
    performedBy: 'Thầy Chủ Nhiệm (Admin)',
    timestamp: '2024-09-18 14:20',
    reason: 'Xóa giao dịch ghi trùng khoản mua phấn viết bảng trắng (đã có trong khoản vệ sinh)',
    snapshotTitle: 'Mua 1 hộp phấn không bụi',
    snapshotAmount: 35000,
    snapshotCategory: 've_sinh',
    snapshotDate: '2024-09-18',
    details: 'Giao dịch bị trùng lặp do bạn lớp phó đã ứng tiền chi trước.',
  },
];

export const CATEGORY_DETAILS: Record<string, { label: string; iconName: string; color: string; bgColor: string }> = {
  in_an: { label: 'In ấn tài liệu', iconName: 'Printer', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  ve_sinh: { label: 'Dụng cụ vệ sinh & bảng', iconName: 'Sparkles', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  lien_hoan: { label: 'Liên hoan, sinh nhật', iconName: 'Cake', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200' },
  hoat_dong: { label: 'Hoạt động đoàn & thể thao', iconName: 'Trophy', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  thu_quy: { label: 'Thu quỹ định kỳ (Tiền mặt)', iconName: 'Coins', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
  ung_ho: { label: 'Quyên góp, ủng hộ', iconName: 'Gift', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  khac: { label: 'Chi phí khác', iconName: 'CircleEllipsis', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200' },
};

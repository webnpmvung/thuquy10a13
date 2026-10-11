import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Send, 
  FileDown, 
  Plus, 
  Printer, 
  Banknote,
  Sparkles,
  Info,
  Calendar,
  Lock
} from 'lucide-react';
import { StudentMember, UserRole, ClassSettings } from '../types/fund';
import { formatVND, formatDateVN, getTodayDateString } from '../utils/formatters';

interface MemberListTabProps {
  students: StudentMember[];
  targetAmount: number;
  currentRole: UserRole;
  settings: ClassSettings;
  onUpdateStudent: (updated: StudentMember) => void;
  onAddStudent: (newStudent: Omit<StudentMember, 'id' | 'stt'>) => void;
}

export const MemberListTab: React.FC<MemberListTabProps> = ({
  students,
  targetAmount,
  currentRole,
  settings,
  onUpdateStudent,
  onAddStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<StudentMember | null>(null);

  // Filter list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter === 'paid' && !s.hasPaid) return false;
      if (statusFilter === 'unpaid' && s.hasPaid) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return s.fullName.toLowerCase().includes(term) || (s.note || '').toLowerCase().includes(term);
      }
      return true;
    });
  }, [students, statusFilter, searchTerm]);

  const paidCount = students.filter((s) => s.hasPaid).length;
  const unpaidCount = students.length - paidCount;
  const totalCollected = students.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);

  // Toggle paid status
  const handleTogglePaid = (student: StudentMember) => {
    if (currentRole === 'viewer') return;
    const newPaidStatus = !student.hasPaid;
    onUpdateStudent({
      ...student,
      hasPaid: newPaidStatus,
      paidAmount: newPaidStatus ? targetAmount : 0,
      paidDate: newPaidStatus ? getTodayDateString() : undefined,
      paymentMethod: 'cash',
      cashReceiver: newPaidStatus ? settings.treasurerName : undefined,
      note: newPaidStatus ? 'Đã thu tiền mặt trực tiếp' : student.note,
    });
  };

  // Generate Cash Reminder Text for Zalo
  const generateZaloCashReminder = () => {
    const unpaidList = students.filter((s) => !s.hasPaid);
    const names = unpaidList.map((s, idx) => `${idx + 1}. ${s.fullName}`).join('\n');

    return `📢 THÔNG BÁO THU TIỀN MẶT QUỸ LỚP ${settings.className} (${settings.schoolYear})
━━━━━━━━━━━━━━━━━━━━
Chào cả lớp! Thủ quỹ xin thông báo cập nhật tình hình đóng quỹ lớp đợt này:
💰 Mức thu: ${formatVND(targetAmount)} / bạn (Thu 100% bằng TIỀN MẶT).
📍 Địa điểm nộp: Gặp trực tiếp Thủ quỹ ${settings.treasurerName} tại lớp (${settings.fundCampaign.collectionLocation || 'Bàn 1 dãy 2 - Đầu giờ hoặc giờ ra chơi'}).

⚠️ Danh sách các bạn chưa nộp tiền mặt (${unpaidList.length} bạn):
${names}

Các bạn vui lòng mang tiền mặt nộp sớm cho thủ quỹ để lớp có kinh phí chuẩn bị hoạt động nhé!
🔗 Link sổ quỹ công khai để cả lớp đối chiếu: ${window.location.origin}`;
  };

  const handleCopyZalo = () => {
    const text = generateZaloCashReminder();
    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Export Member List CSV
  const handleExportCSV = () => {
    const headers = ['STT', 'Họ và tên', 'Giới tính', 'Trạng thái', 'Số tiền đã nộp', 'Ngày nộp', 'Hình thức', 'Thủ quỹ nhận tiền', 'Ghi chú'];
    const rows = students.map((s) => [
      s.stt,
      `"${s.fullName}"`,
      s.gender,
      s.hasPaid ? 'ĐÃ NỘP' : 'CHƯA NỘP',
      s.paidAmount,
      s.paidDate || '',
      'Tiền mặt',
      `"${s.cashReceiver || ''}"`,
      `"${(s.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Danh_Sach_Nop_Tien_Mat_Lop_${settings.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Cash Summary & Reminder */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Danh Sách Đóng Quỹ Tiền Mặt Lớp {settings.className}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mức thu: <strong className="text-slate-800 font-mono">{formatVND(targetAmount)}</strong> / học sinh • Thu 100% tiền mặt tại lớp
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Zalo Cash Reminder */}
            <button
              onClick={handleCopyZalo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Sao chép mẫu thông báo nhắc nộp tiền mặt vào nhóm Zalo lớp"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5 text-white" /> : <Send className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã Chép Thông Báo!' : 'Nhắc Nộp Tiền (Zalo)'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Xuất File</span>
            </button>
          </div>
        </div>

        {/* 3 Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-500 font-medium">Sĩ số lớp</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {students.length} bạn
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-center">
            <span className="text-[11px] text-emerald-700 font-medium">Đã nộp tiền mặt</span>
            <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
              {paidCount} bạn
            </div>
          </div>

          <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-center">
            <span className="text-[11px] text-rose-700 font-medium">Chưa nộp</span>
            <div className="text-lg font-bold text-rose-700 font-mono mt-0.5">
              {unpaidCount} bạn
            </div>
          </div>
        </div>

        {/* Cash Handover Location Reminder */}
        <div className="p-2.5 bg-indigo-50/60 border border-indigo-200/70 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Địa điểm nộp tiền mặt: </strong>
            {settings.fundCampaign.collectionLocation || 'Nộp trực tiếp cho Thủ quỹ tại lớp học'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="relative sm:col-span-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên học sinh, ghi chú..."
              className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            >
              <option value="all">Tất cả ({students.length})</option>
              <option value="paid">✅ Đã nộp tiền mặt ({paidCount})</option>
              <option value="unpaid">⏳ Chưa nộp tiền ({unpaidCount})</option>
            </select>
          </div>
        </div>

        {/* Member Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3 font-bold w-12 text-center">STT</th>
                <th className="py-2.5 px-3 font-bold">Họ và Tên</th>
                <th className="py-2.5 px-3 font-bold text-center">Trạng Thái</th>
                <th className="py-2.5 px-3 font-bold text-right">Số Tiền (VNĐ)</th>
                <th className="py-2.5 px-3 font-bold hidden sm:table-cell">Ngày Nộp / Ghi Chú</th>
                <th className="py-2.5 px-3 font-bold text-center w-28">Phiếu Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    student.hasPaid ? 'bg-white' : 'bg-rose-50/20'
                  }`}
                >
                  {/* STT */}
                  <td className="py-3 px-3 font-bold font-mono text-slate-400 text-center">
                    {student.stt}
                  </td>

                  {/* Name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-sm">
                      {student.fullName}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {student.gender}
                    </span>
                  </td>

                  {/* Status & Toggle Checkbox */}
                  <td className="py-3 px-3 text-center">
                    {currentRole !== 'viewer' ? (
                      <button
                        onClick={() => handleTogglePaid(student)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          student.hasPaid
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                        }`}
                        title="Bấm để chuyển trạng thái nộp tiền mặt"
                      >
                        {student.hasPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã Nhận</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Chưa Nộp</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          student.hasPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {student.hasPaid ? '✅ Đã Nộp' : '⏳ Chưa nộp'}
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 text-right font-bold font-mono text-sm">
                    {student.hasPaid ? (
                      <span className="text-emerald-700">
                        {formatVND(student.paidAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0 đ</span>
                    )}
                  </td>

                  {/* Date & Note */}
                  <td className="py-3 px-3 hidden sm:table-cell">
                    {student.hasPaid ? (
                      <div className="space-y-0.5">
                        <div className="text-slate-700 font-medium flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateVN(student.paidDate || '')}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Thủ quỹ: {student.cashReceiver || settings.treasurerName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {student.note || 'Chưa đóng tiền mặt'}
                      </span>
                    )}
                  </td>

                  {/* Print / View Cash Receipt Voucher */}
                  <td className="py-3 px-3 text-center">
                    {student.hasPaid ? (
                      <button
                        onClick={() => setSelectedStudentForReceipt(student)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Xem biên lai / phiếu thu tiền mặt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Phiếu Thu</span>
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP PHIẾU THU TIỀN MẶT (Cash Receipt Voucher) */}
      {selectedStudentForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 my-auto animate-in fade-in zoom-in-95">
            {/* Header Voucher */}
            <div className="border-b-2 border-dashed border-slate-200 pb-3 text-center space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                {settings.schoolName} • Lớp {settings.className}
              </div>
              <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                Phiếu Thu Tiền Mặt Quỹ Lớp
              </h3>
              <p className="text-xs text-slate-500">
                Học kỳ 1 - Năm học {settings.schoolYear}
              </p>
            </div>

            {/* Voucher Details */}
            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên học sinh:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedStudentForReceipt.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">STT danh sách:</span>
                <span className="font-mono font-bold text-slate-800">Số {selectedStudentForReceipt.stt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền đã nộp:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">
                  {formatVND(selectedStudentForReceipt.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-slate-800">Tiền mặt trực tiếp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày thu tiền:</span>
                <span className="text-slate-800 font-medium">{formatDateVN(selectedStudentForReceipt.paidDate || '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Người thu tiền (Thủ quỹ):</span>
                <span className="font-bold text-slate-900">{selectedStudentForReceipt.cashReceiver || settings.treasurerName}</span>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 text-center text-xs pt-2">
              <div>
                <span className="font-semibold text-slate-500">Người Nộp Tiền</span>
                <p className="text-[11px] text-slate-400 italic mt-0.5">(Học sinh / Phụ huynh)</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-800">{selectedStudentForReceipt.fullName}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-500">Thủ Quỹ Xác Nhận</span>
                <p className="text-[11px] text-slate-400 italic mt-0.5">(Đã nhận đủ tiền mặt)</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-800">{selectedStudentForReceipt.cashReceiver || settings.treasurerName}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudentForReceipt(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng Phiếu Thu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  PlusCircle, 
  MinusCircle, 
  Sparkles,
  Banknote,
  Image as ImageIcon,
  History,
  ShieldCheck,
  UserCheck,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { UserRole } from '../types/fund';
import { formatVND } from '../utils/formatters';

interface OverviewCardsProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  paidStudentsCount: number;
  totalStudentsCount: number;
  targetPerStudent: number;
  receiptsCount: number;
  currentRole: UserRole;
  treasurerName: string;
  treasurer2Name?: string;
  adminName: string;
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onOpenReceiptGallery?: () => void;
  onOpenAuditModal?: () => void;
  onOpenRoleAuthModal: () => void;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  balance,
  totalIncome,
  totalExpense,
  paidStudentsCount,
  totalStudentsCount,
  targetPerStudent,
  receiptsCount,
  currentRole,
  treasurerName,
  treasurer2Name,
  adminName,
  onOpenAddModal,
  onOpenReceiptGallery,
  onOpenAuditModal,
  onOpenRoleAuthModal,
}) => {
  const collectionPercentage = totalStudentsCount > 0 
    ? Math.round((paidStudentsCount / totalStudentsCount) * 100) 
    : 0;

  const totalFundTarget = totalStudentsCount * targetPerStudent;
  
  const displayTreasurerName = treasurer2Name ? `${treasurerName} / ${treasurer2Name}` : treasurerName;

  return (
    <div className="space-y-3.5">
      {/* Top Banner: Current Role & Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1 max-w-[200px] sm:max-w-md truncate ${
                currentRole === 'admin'
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                  : currentRole === 'treasurer'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
              }`}>
                {currentRole === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span className="truncate">Admin - {adminName}</span>
                  </>
                ) : currentRole === 'treasurer' ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">Thủ Quỹ ({displayTreasurerName})</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">Chế Độ Xem Cả Lớp</span>
                  </>
                )}
              </span>

              <button
                onClick={onOpenRoleAuthModal}
                className="text-[11px] text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer ml-1"
              >
                {currentRole === 'viewer' ? 'Đăng nhập Thủ quỹ / Admin' : 'Đổi vai trò'}
              </button>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                Số Dư Khả Dụng
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-sm">
                {formatVND(balance)}
              </span>
            </div>
          </div>

          {/* Action buttons (Only for Treasurer or Admin) */}
          {currentRole !== 'viewer' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-add-expense-quick"
                onClick={() => onOpenAddModal('expense')}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                <span>- Ghi Khoản Chi</span>
              </button>

              <button
                id="btn-add-income-quick"
                onClick={() => onOpenAddModal('income')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Ghi Khoản Thu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Total Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Tiền Thu Vào
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-600">
              {formatVND(totalIncome)}
            </div>
          </div>
        </div>

        {/* Card 2: Total Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Tiền Đã Chi
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-rose-600">
              {formatVND(totalExpense)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Đã đính kèm <strong>{receiptsCount}</strong> ảnh hóa đơn chứng từ
            </p>
          </div>
          {/* Ratio bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalIncome > 0 ? Math.min(Math.round((totalExpense / totalIncome) * 100), 100) : 0}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

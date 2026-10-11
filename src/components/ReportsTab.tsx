import React, { useMemo } from 'react';
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Coins, 
  FileText,
  Percent,
  CheckCircle
} from 'lucide-react';
import { Transaction, StudentMember, ClassSettings, TransactionCategory } from '../types/fund';
import { CATEGORY_DETAILS } from '../data/initialData';
import { formatVND, formatShortVND } from '../utils/formatters';

interface ReportsTabProps {
  transactions: Transaction[];
  students: StudentMember[];
  settings: ClassSettings;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  students,
  settings,
}) => {
  // Income & Expense totals
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const expenseMap: Record<string, { total: number; count: number }> = {};

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!expenseMap[t.category]) {
          expenseMap[t.category] = { total: 0, count: 0 };
        }
        expenseMap[t.category].total += Number(t.amount || 0);
        expenseMap[t.category].count += 1;
      });

    return Object.entries(expenseMap)
      .map(([cat, data]) => {
        const percentage = totalExpense > 0 ? Math.round((data.total / totalExpense) * 100) : 0;
        const details = CATEGORY_DETAILS[cat] || {
          label: cat,
          color: 'text-slate-600',
          bgColor: 'bg-slate-100',
        };
        return {
          category: cat as TransactionCategory,
          label: details.label,
          total: data.total,
          count: data.count,
          percentage,
          color: details.color,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [transactions, totalExpense]);

  // Top 5 largest expenses
  const topExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  const paidStudentsCount = students.filter((s) => s.hasPaid).length;

  return (
    <div className="space-y-4">
      {/* Overview Statistics Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span>Báo Cáo Tài Chính Tổng Hợp {settings.className}</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Thu</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">
              {formatVND(totalIncome)}
            </div>
            <span className="text-[10px] text-slate-400">Từ đầu năm học</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tổng Chi</span>
            <div className="text-lg sm:text-xl font-bold text-rose-600 mt-1">
              {formatVND(totalExpense)}
            </div>
            <span className="text-[10px] text-slate-400">Các hoạt động lớp</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Số Dư Quỹ</span>
            <div className={`text-lg sm:text-xl font-bold mt-1 ${balance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatVND(balance)}
            </div>
            <span className="text-[10px] text-slate-400">Tiền còn trong quỹ</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Tỷ lệ đóng</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {paidStudentsCount}/{students.length}
            </div>
            <span className="text-[10px] text-slate-400">
              {Math.round((paidStudentsCount / (students.length || 1)) * 100)}% sĩ số lớp
            </span>
          </div>
        </div>
      </div>

      {/* 2 Columns: Category Breakdown & Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-pink-600" />
              <span>Phân Bổ Chi Tiêu Theo Danh Mục</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Tổng: {formatShortVND(totalExpense)}
            </span>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có khoản chi nào để thống kê</p>
          ) : (
            <div className="space-y-3 pt-1">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {item.label} <span className="text-slate-400 font-normal">({item.count} khoản)</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {formatVND(item.total)} ({item.percentage}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Expenses */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>5 Khoản Chi Lớn Nhất</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">Đối chiếu chi tiết</span>
          </div>

          {topExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có khoản chi nào</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{tx.title}</p>
                      <p className="text-[10px] text-slate-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 shrink-0">
                    {formatVND(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

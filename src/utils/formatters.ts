export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortVND(amount: number): string {
  if (isNaN(amount)) return '0đ';
  if (Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)} tr`;
  }
  if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}k`;
  }
  return `${amount}đ`;
}

export function formatDateVN(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (day && month && year) {
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Generate VietQR QuickLink image URL
 * https://api.vietqr.io/
 */
export function buildVietQRUrl(bankId: string, accountNumber: string, accountName: string, amount: number, memo: string): string {
  const cleanAccount = accountNumber.replace(/\s+/g, '');
  const cleanMemo = encodeURIComponent(memo.trim());
  const cleanName = encodeURIComponent(accountName.trim().toUpperCase());
  
  return `https://img.vietqr.io/image/${bankId}-${cleanAccount}-compact2.png?amount=${amount}&addInfo=${cleanMemo}&accountName=${cleanName}`;
}

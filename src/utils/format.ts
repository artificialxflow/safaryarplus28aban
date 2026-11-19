const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function formatToman(amount: number, withUnit = true): string {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(Math.round(amount)).toLocaleString('en-US');
  const persian = toPersianDigits(absFormatted);
  const signed = isNegative ? `${persian}-` : persian;
  return withUnit ? `${signed} تومان` : signed;
}

export function formatMillionToman(amount: number): string {
  const millions = amount / 1_000_000;
  const formatted = millions.toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: millions % 1 === 0 ? 0 : 1,
  });
  return `${toPersianDigits(formatted)} میلیون تومان`;
}

export function generatePNR(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateTicketNumber(): string {
  const prefix = '815';
  const rand = Math.floor(1000000000 + Math.random() * 8999999999);
  return `${prefix}-${rand}`;
}

export function generateTrackingCode(): string {
  const num = Math.floor(4100 + Math.random() * 5800);
  return `SY-${num}`;
}

export function computePartnerBalance(
  transactions: { debit: number; credit: number }[]
): { totalDebit: number; totalCredit: number; netBalance: number } {
  const totalDebit = transactions.reduce((acc, t) => acc + t.debit, 0);
  const totalCredit = transactions.reduce((acc, t) => acc + t.credit, 0);
  // netBalance > 0 => طلب ما از طرف حساب (Receivable / Green)
  // netBalance < 0 => بدهی ما به طرف حساب (Payable / Red)
  return {
    totalDebit,
    totalCredit,
    netBalance: totalDebit - totalCredit,
  };
}

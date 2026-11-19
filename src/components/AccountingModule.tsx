import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  TrendingUp,
  TrendingDown,
  Building2,
  Plus,
  Edit3,
  Check,
  X,
  Search,
} from 'lucide-react';
import { Caravan, PartnerAccount, PartnerTransaction, Passenger } from '../types';
import {
  computePartnerBalance,
  formatToman,
  toPersianDigits,
} from '../utils/format';

interface AccountingModuleProps {
  caravans: Caravan[];
  passengers: Passenger[];
  partners: PartnerAccount[];
  onUpdateCaravanFinance: (
    caravanId: string,
    updates: { hotelCost: number; buyCost: number; sellRevenue: number }
  ) => void;
  onAddPartnerTransaction: (
    partnerId: string,
    tx: Omit<PartnerTransaction, 'id'>
  ) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  caravans,
  passengers,
  partners,
  onUpdateCaravanFinance,
  onAddPartnerTransaction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pnl' | 'partners'>('pnl');
  const [monthFilter, setMonthFilter] = useState<string>('همه ماه‌ها');
  const [editingCaravanId, setEditingCaravanId] = useState<string | null>(null);
  const [editHotelCost, setEditHotelCost] = useState(0);
  const [editBuyCost, setEditBuyCost] = useState(0);
  const [editSellRevenue, setEditSellRevenue] = useState(0);

  // Partners filter & modals
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerBalanceFilter, setPartnerBalanceFilter] = useState<
    'all' | 'receivable' | 'payable'
  >('all');
  const [statementPartner, setStatementPartner] = useState<PartnerAccount | null>(null);
  const [txModalPartner, setTxModalPartner] = useState<PartnerAccount | null>(null);
  const [txDesc, setTxDesc] = useState('');
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');
  const [txAmount, setTxAmount] = useState(25000000);
  const [txDate, setTxDate] = useState('۱۴۰۵/۰۸/۲۸');

  const months = useMemo(() => {
    const unique = Array.from(new Set(caravans.map((c) => c.monthLabel)));
    return ['همه ماه‌ها', ...unique];
  }, [caravans]);

  const filteredCaravans = useMemo(() => {
    if (monthFilter === 'همه ماه‌ها') return caravans;
    return caravans.filter((c) => c.monthLabel === monthFilter);
  }, [caravans, monthFilter]);

  const pnlTotals = useMemo(() => {
    return filteredCaravans.reduce(
      (acc, c) => {
        const profit = c.sellRevenue - (c.hotelCost + c.buyCost);
        acc.hotel += c.hotelCost;
        acc.buy += c.buyCost;
        acc.sell += c.sellRevenue;
        acc.profit += profit;
        return acc;
      },
      { hotel: 0, buy: 0, sell: 0, profit: 0 }
    );
  }, [filteredCaravans]);

  const partnerSummaries = useMemo(() => {
    let totalReceivable = 0; // طلب ما (سبز)
    let totalPayable = 0; // بدهی ما (قرمز)

    const enriched = partners.map((p) => {
      const { totalDebit, totalCredit, netBalance } = computePartnerBalance(p.transactions);
      if (netBalance >= 0) totalReceivable += netBalance;
      else totalPayable += Math.abs(netBalance);
      return { partner: p, totalDebit, totalCredit, netBalance };
    });

    const filtered = enriched.filter(({ partner, netBalance }) => {
      if (partnerBalanceFilter === 'receivable' && netBalance < 0) return false;
      if (partnerBalanceFilter === 'payable' && netBalance >= 0) return false;
      if (partnerSearch.trim()) {
        const q = partnerSearch.trim().toLowerCase();
        return (
          partner.name.toLowerCase().includes(q) ||
          partner.code.toLowerCase().includes(q) ||
          partner.type.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return {
      rows: filtered,
      totalReceivable,
      totalPayable,
      netPosition: totalReceivable - totalPayable,
    };
  }, [partners, partnerSearch, partnerBalanceFilter]);

  const startEdit = (c: Caravan) => {
    setEditingCaravanId(c.id);
    setEditHotelCost(c.hotelCost);
    setEditBuyCost(c.buyCost);
    setEditSellRevenue(c.sellRevenue);
  };

  const saveEdit = (caravanId: string) => {
    onUpdateCaravanFinance(caravanId, {
      hotelCost: Number(editHotelCost) || 0,
      buyCost: Number(editBuyCost) || 0,
      sellRevenue: Number(editSellRevenue) || 0,
    });
    setEditingCaravanId(null);
  };

  const handlePrintStatement = () => {
    document.body.classList.add('printing-statement');
    const cleanup = () => {
      document.body.classList.remove('printing-statement');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1200);
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txModalPartner || !txDesc.trim() || txAmount <= 0) return;
    onAddPartnerTransaction(txModalPartner.id, {
      date: txDate,
      reference: `DOC-${Math.floor(5000 + Math.random() * 4500)}`,
      description: txDesc.trim(),
      debit: txType === 'debit' ? Number(txAmount) : 0,
      credit: txType === 'credit' ? Number(txAmount) : 0,
    });
    setTxModalPartner(null);
    setTxDesc('');
    setTxAmount(25000000);
  };

  const activeStatementLivePartner = useMemo(() => {
    if (!statementPartner) return null;
    return partners.find((p) => p.id === statementPartner.id) || statementPartner;
  }, [statementPartner, partners]);

  return (
    <div className="space-y-6">
      {/* Sub-Module Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('pnl')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'pnl'
                ? 'bg-white text-[#0F4C81] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سود و زیان اختصاصی کاروان‌ها
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('partners')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'partners'
                ? 'bg-white text-[#0F4C81] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حساب طرف‌حساب‌ها (همکاران و کارگزاران)
          </button>
        </div>

        {activeSubTab === 'pnl' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">بازه زمانی:</span>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Caravan Profit & Loss */}
      {activeSubTab === 'pnl' && (
        <div className="space-y-6 no-print">
          {/* Financial Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">مجموع فروش کاروان‌ها</div>
              <div className="text-lg font-bold text-[#0F4C81] mt-1.5 tabular-nums">
                {formatToman(pnlTotals.sell)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">مجموع هزینه هتل‌ها</div>
              <div className="text-lg font-bold text-slate-900 mt-1.5 tabular-nums">
                {formatToman(pnlTotals.hotel)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">مجموع خرید پرواز و خدمات</div>
              <div className="text-lg font-bold text-slate-900 mt-1.5 tabular-nums">
                {formatToman(pnlTotals.buy)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">سود / زیان خالص دوره</div>
              <div
                className={`text-lg font-bold mt-1.5 tabular-nums flex items-center gap-1.5 ${
                  pnlTotals.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {pnlTotals.profit >= 0 ? (
                  <TrendingUp className="w-4 h-4 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 shrink-0" />
                )}
                {formatToman(pnlTotals.profit)}
              </div>
            </div>
          </div>

          {/* Detailed Caravan P&L Table */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  جدول محاسبه سود و زیان هر کاروان
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  با ویرایش هزینه هتل، قیمت خرید یا فروش، سود خالص و تراز داشبورد به‌صورت خودکار به‌روزرسانی می‌شود.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[880px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 border-l border-slate-200/70">نام کاروان</th>
                    <th className="py-3 px-3 border-l border-slate-200/70">ماه</th>
                    <th className="py-3 px-3 border-l border-slate-200/70">تعداد مسافر</th>
                    <th className="py-3 px-4 border-l border-slate-200/70">هزینه هتل</th>
                    <th className="py-3 px-4 border-l border-slate-200/70">قیمت خرید پرواز و خدمات</th>
                    <th className="py-3 px-4 border-l border-slate-200/70">قیمت فروش کل</th>
                    <th className="py-3 px-4 border-l border-slate-200/70">سود / زیان خالص</th>
                    <th className="py-3 px-4 text-left">ویرایش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredCaravans.map((c) => {
                    const isEditing = editingCaravanId === c.id;
                    const liveHotel = isEditing ? editHotelCost : c.hotelCost;
                    const liveBuy = isEditing ? editBuyCost : c.buyCost;
                    const liveSell = isEditing ? editSellRevenue : c.sellRevenue;
                    const netProfit = liveSell - (liveHotel + liveBuy);
                    const margin =
                      liveSell > 0 ? Math.round((netProfit / liveSell) * 100) : 0;
                    const paxCount =
                      passengers.filter((p) => p.caravanId === c.id).length + 12;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 border-l border-slate-200/60">
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="font-mono-tabular text-[11px] text-slate-500 mt-0.5">
                            {c.code} · {c.hotelName}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 border-l border-slate-200/60 whitespace-nowrap text-slate-700">
                          {c.monthLabel}
                        </td>
                        <td className="py-3.5 px-3 border-l border-slate-200/60 whitespace-nowrap font-semibold tabular-nums text-slate-800">
                          {toPersianDigits(paxCount)} نفر
                        </td>
                        <td className="py-3.5 px-4 border-l border-slate-200/60 whitespace-nowrap tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              dir="ltr"
                              value={editHotelCost}
                              onChange={(e) => setEditHotelCost(Number(e.target.value))}
                              className="w-32 px-2 py-1 text-xs font-mono-tabular border border-[#0F4C81] rounded bg-white text-left"
                            />
                          ) : (
                            formatToman(c.hotelCost)
                          )}
                        </td>
                        <td className="py-3.5 px-4 border-l border-slate-200/60 whitespace-nowrap tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              dir="ltr"
                              value={editBuyCost}
                              onChange={(e) => setEditBuyCost(Number(e.target.value))}
                              className="w-32 px-2 py-1 text-xs font-mono-tabular border border-[#0F4C81] rounded bg-white text-left"
                            />
                          ) : (
                            formatToman(c.buyCost)
                          )}
                        </td>
                        <td className="py-3.5 px-4 border-l border-slate-200/60 whitespace-nowrap font-semibold text-[#0F4C81] tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              dir="ltr"
                              value={editSellRevenue}
                              onChange={(e) => setEditSellRevenue(Number(e.target.value))}
                              className="w-32 px-2 py-1 text-xs font-mono-tabular border border-[#0F4C81] rounded bg-white text-left"
                            />
                          ) : (
                            formatToman(c.sellRevenue)
                          )}
                        </td>
                        <td className="py-3.5 px-4 border-l border-slate-200/60 whitespace-nowrap tabular-nums">
                          <div
                            className={`font-bold ${
                              netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {netProfit >= 0 ? 'سود: ' : 'زیان: '}
                            {formatToman(Math.abs(netProfit))}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            حاشیه سود: {toPersianDigits(margin)}٪
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => saveEdit(c.id)}
                                className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                                title="ذخیره تغییرات"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCaravanId(null)}
                                className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                                title="انصراف"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              ویرایش
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-300 text-xs font-bold text-slate-900">
                    <td colSpan={3} className="py-3.5 px-4 border-l border-slate-200">
                      جمع کل ({toPersianDigits(filteredCaravans.length)} کاروان)
                    </td>
                    <td className="py-3.5 px-4 border-l border-slate-200 tabular-nums whitespace-nowrap">
                      {formatToman(pnlTotals.hotel)}
                    </td>
                    <td className="py-3.5 px-4 border-l border-slate-200 tabular-nums whitespace-nowrap">
                      {formatToman(pnlTotals.buy)}
                    </td>
                    <td className="py-3.5 px-4 border-l border-slate-200 text-[#0F4C81] tabular-nums whitespace-nowrap">
                      {formatToman(pnlTotals.sell)}
                    </td>
                    <td
                      colSpan={2}
                      className={`py-3.5 px-4 tabular-nums whitespace-nowrap ${
                        pnlTotals.profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {formatToman(pnlTotals.profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Partner Accounts Ledger */}
      {activeSubTab === 'partners' && (
        <div className="space-y-6 no-print">
          {/* Partner Receivables vs Payables Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">مجموع طلب ما از همکاران (بدهکار به ما)</div>
              <div className="text-lg font-bold text-emerald-700 mt-1.5 tabular-nums">
                {formatToman(partnerSummaries.totalReceivable)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">مجموع بدهی ما به کارگزاران و چارترها</div>
              <div className="text-lg font-bold text-red-700 mt-1.5 tabular-nums">
                {formatToman(partnerSummaries.totalPayable)}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-xs text-slate-500">تراز خالص طرف‌حساب‌ها</div>
              <div
                className={`text-lg font-bold mt-1.5 tabular-nums ${
                  partnerSummaries.netPosition >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {partnerSummaries.netPosition >= 0 ? 'طلب خالص: ' : 'بدهی خالص: '}
                {formatToman(Math.abs(partnerSummaries.netPosition))}
              </div>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F4C81]" />
                <h2 className="text-sm font-bold text-slate-900">
                  دفتر معین طرف‌حساب‌ها (همکاران آژانسی، کارگزاران و هتل‌ها)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="جستجوی طرف حساب..."
                    className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { id: 'all', label: 'همه' },
                      { id: 'receivable', label: 'طلب ما (سبز)' },
                      { id: 'payable', label: 'بدهی ما (قرمز)' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPartnerBalanceFilter(f.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
                        partnerBalanceFilter === f.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">کد / طرف حساب</th>
                    <th className="py-3 px-4">نوع همکاری</th>
                    <th className="py-3 px-4">جمع بدهکار</th>
                    <th className="py-3 px-4">جمع بستانکار</th>
                    <th className="py-3 px-4">وضعیت مانده (طلب / بدهی)</th>
                    <th className="py-3 px-4 text-left">عملیات مالی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {partnerSummaries.rows.map(
                    ({ partner, totalDebit, totalCredit, netBalance }) => {
                      const isReceivable = netBalance >= 0;
                      return (
                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{partner.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className="font-mono-tabular">{partner.code}</span>
                              <span>·</span>
                              <span>{partner.city}</span>
                              <span>·</span>
                              <span>{partner.phone}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                            {partner.type}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                            {formatToman(totalDebit)}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums text-slate-700 whitespace-nowrap">
                            {formatToman(totalCredit)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                            {isReceivable ? (
                              <div className="inline-flex flex-col">
                                <span className="font-bold text-emerald-700">
                                  طلب ما: {formatToman(netBalance)}
                                </span>
                                <span className="text-[11px] text-emerald-600">
                                  طرف حساب بدهکار است
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex flex-col">
                                <span className="font-bold text-red-700">
                                  بدهی ما: {formatToman(Math.abs(netBalance))}
                                </span>
                                <span className="text-[11px] text-red-600">
                                  طرف حساب بستانکار است
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-left whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setTxModalPartner(partner)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                ثبت سند
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatementPartner(partner)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                خروجی صورت‌حساب PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Printable Official Partner Financial Statement Modal */}
      {activeStatementLivePartner && (
        <div className="print-modal-backdrop fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="print-modal-card bg-white border border-slate-300 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Action Bar (hidden when printing) */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="text-sm font-bold text-slate-900">
                پیش‌نمایش صورت‌حساب رسمی — {activeStatementLivePartner.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintStatement}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  چاپ / ذخیره PDF صورت‌حساب
                </button>
                <button
                  type="button"
                  onClick={() => setStatementPartner(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg cursor-pointer"
                  aria-label="بستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Body */}
            <div
              id="print-statement-area"
              className="print-only-surface p-6 sm:p-8 overflow-y-auto space-y-6 bg-white"
            >
              {/* Agency Letterhead */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-[#0F4C81]">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F4C81]">
                    شرکت خدمات مسافرت هوایی و گردشگری سفریار پلاس
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    صورت‌حساب رسمی گردش مالی و تطبیق مانده طرف‌حساب · مجوز بند الف و ب و سازمان حج و زیارت
                  </p>
                </div>
                <div className="text-xs text-slate-700 space-y-1 tabular-nums">
                  <div>
                    شماره صورت‌حساب:{' '}
                    <span className="font-mono-tabular font-bold text-slate-900">
                      STM-{activeStatementLivePartner.code}
                    </span>
                  </div>
                  <div>تاریخ صدور: ۱۴۰۵/۰۸/۲۸</div>
                  <div>واحد پول: تومان ایران</div>
                </div>
              </div>

              {/* Partner Info Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                <div>
                  <span className="text-slate-500 block">نام طرف حساب:</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {activeStatementLivePartner.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">نوع همکاری و کد معین:</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {activeStatementLivePartner.type} · {activeStatementLivePartner.code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">شهر و تلفن تماس:</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {activeStatementLivePartner.city} · {activeStatementLivePartner.phone}
                  </span>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                      <th className="py-2.5 px-3 border-l border-slate-200">ردیف</th>
                      <th className="py-2.5 px-3 border-l border-slate-200">تاریخ</th>
                      <th className="py-2.5 px-3 border-l border-slate-200">شماره سند</th>
                      <th className="py-2.5 px-3 border-l border-slate-200">شرح تراکنش</th>
                      <th className="py-2.5 px-3 border-l border-slate-200">بدهکار (طلب ما)</th>
                      <th className="py-2.5 px-3 border-l border-slate-200">بستانکار (بدهی ما)</th>
                      <th className="py-2.5 px-3">مانده لحظه‌ای</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      let running = 0;
                      return activeStatementLivePartner.transactions.map((tx, idx) => {
                        running += tx.debit - tx.credit;
                        return (
                          <tr key={tx.id}>
                            <td className="py-2.5 px-3 border-l border-slate-200 tabular-nums">
                              {toPersianDigits(idx + 1)}
                            </td>
                            <td className="py-2.5 px-3 border-l border-slate-200 tabular-nums whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-2.5 px-3 border-l border-slate-200 font-mono-tabular whitespace-nowrap">
                              {tx.reference}
                            </td>
                            <td className="py-2.5 px-3 border-l border-slate-200 text-slate-800">
                              {tx.description}
                            </td>
                            <td className="py-2.5 px-3 border-l border-slate-200 tabular-nums whitespace-nowrap text-emerald-700 font-medium">
                              {tx.debit > 0 ? formatToman(tx.debit, false) : '—'}
                            </td>
                            <td className="py-2.5 px-3 border-l border-slate-200 tabular-nums whitespace-nowrap text-red-700 font-medium">
                              {tx.credit > 0 ? formatToman(tx.credit, false) : '—'}
                            </td>
                            <td
                              className={`py-2.5 px-3 tabular-nums whitespace-nowrap font-bold ${
                                running >= 0 ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {formatToman(Math.abs(running), false)}{' '}
                              {running >= 0 ? '(بد)' : '(بس)'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Final Balance Summary */}
              {(() => {
                const { totalDebit, totalCredit, netBalance } = computePartnerBalance(
                  activeStatementLivePartner.transactions
                );
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-5">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="text-slate-500">جمع کل بدهکار (تومان)</div>
                      <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                        {formatToman(totalDebit)}
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="text-slate-500">جمع کل بستانکار (تومان)</div>
                      <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                        {formatToman(totalCredit)}
                      </div>
                    </div>
                    <div
                      className={`p-3.5 border rounded-lg text-xs ${
                        netBalance >= 0
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="text-slate-700 font-semibold">
                        مانده نهایی قابل تسویه
                      </div>
                      <div
                        className={`text-base font-extrabold mt-1 tabular-nums ${
                          netBalance >= 0 ? 'text-emerald-800' : 'text-red-800'
                        }`}
                      >
                        {netBalance >= 0 ? 'طلب سفریار پلاس: ' : 'بدهی سفریار پلاس: '}
                        {formatToman(Math.abs(netBalance))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-6 text-xs text-slate-600">
                <div className="border-t border-dashed border-slate-300 pt-3">
                  مهر و امضای واحد مالی آژانس سفریار پلاس
                </div>
                <div className="border-t border-dashed border-slate-300 pt-3">
                  تأیید و امضای طرف حساب ({activeStatementLivePartner.name})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Partner Transaction Modal */}
      {txModalPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                ثبت سند مالی جدید — {txModalPartner.name}
              </h3>
              <button
                type="button"
                onClick={() => setTxModalPartner(null)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTransaction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ماهیت سند
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('debit')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      txType === 'debit'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    بدهکار (افزایش طلب ما)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('credit')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                      txType === 'credit'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    بستانکار (واریز / بدهی ما)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  شرح سند مالی
                </label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="مثال: واریز تسویه کاروان مشهد یا صدور بلیت گروهی"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    مبلغ (تومان)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    required
                    min={100000}
                    value={txAmount}
                    onChange={(e) => setTxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاریخ سند
                  </label>
                  <input
                    type="text"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTxModalPartner(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg cursor-pointer"
                >
                  ثبت در دفتر معین
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

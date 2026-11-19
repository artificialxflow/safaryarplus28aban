import React, { useState, useMemo } from 'react';
import {
  Users,
  Plane,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Building2,
  Calendar,
  Eye,
  X,
} from 'lucide-react';
import { Caravan, Passenger } from '../types';
import { toPersianDigits } from '../utils/format';

interface CaravansModuleProps {
  caravans: Caravan[];
  passengers: Passenger[];
  onAddPassenger: (passenger: Omit<Passenger, 'id' | 'ticketStatus' | 'registeredAt'>) => void;
  onAddCaravan: (caravan: Omit<Caravan, 'id'>) => void;
  onTransferToTicketing: (passenger: Passenger) => void;
  onViewIssuedTicket: (passenger: Passenger) => void;
}

export const CaravansModule: React.FC<CaravansModuleProps> = ({
  caravans,
  passengers,
  onAddPassenger,
  onAddCaravan,
  onTransferToTicketing,
  onViewIssuedTicket,
}) => {
  const [selectedCaravanFilter, setSelectedCaravanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'issued'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCaravanModal, setShowNewCaravanModal] = useState(false);

  // Single-entry Passenger Registration Form state
  const [fullName, setFullName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [caravanId, setCaravanId] = useState(caravans[0]?.id || '');
  const [formError, setFormError] = useState('');

  // New Caravan Form state
  const [newCrvName, setNewCrvName] = useState('');
  const [newCrvDest, setNewCrvDest] = useState('');
  const [newCrvDestCode, setNewCrvDestCode] = useState('MHD');
  const [newCrvHotel, setNewCrvHotel] = useState('');
  const [newCrvDeparture, setNewCrvDeparture] = useState('۱۴۰۵/۱۰/۱۲');
  const [newCrvReturn, setNewCrvReturn] = useState('۱۴۰۵/۱۰/۱۷');
  const [newCrvMonth, setNewCrvMonth] = useState('دی ۱۴۰۵');
  const [newCrvCapacity, setNewCrvCapacity] = useState(32);
  const [newCrvIsHajj, setNewCrvIsHajj] = useState(false);

  const passengerCountByCaravan = useMemo(() => {
    const map: Record<string, { total: number; issued: number }> = {};
    for (const c of caravans) {
      map[c.id] = { total: 0, issued: 0 };
    }
    for (const p of passengers) {
      if (!map[p.caravanId]) {
        map[p.caravanId] = { total: 0, issued: 0 };
      }
      map[p.caravanId].total += 1;
      if (p.ticketStatus === 'issued') {
        map[p.caravanId].issued += 1;
      }
    }
    return map;
  }, [caravans, passengers]);

  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      if (selectedCaravanFilter !== 'all' && p.caravanId !== selectedCaravanFilter) {
        return false;
      }
      if (statusFilter !== 'all' && p.ticketStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          p.fullName.toLowerCase().includes(q) ||
          p.latinName.toLowerCase().includes(q) ||
          p.nationalId.includes(q) ||
          p.passportNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [passengers, selectedCaravanFilter, statusFilter, searchQuery]);

  const handlePassengerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !nationalId.trim() || !caravanId) {
      setFormError('لطفاً نام مسافر، کد ملی و کاروان مربوطه را تکمیل نمایید.');
      return;
    }
    if (nationalId.trim().length < 8) {
      setFormError('کد ملی باید حداقل ۸ رقم معتبر باشد.');
      return;
    }
    setFormError('');
    onAddPassenger({
      fullName: fullName.trim(),
      latinName: (latinName.trim() || 'PASSENGER SAFARYAR').toUpperCase(),
      nationalId: nationalId.trim(),
      passportNumber: (passportNumber.trim() || 'N00000000').toUpperCase(),
      phone: phone.trim() || '09120000000',
      caravanId,
    });
    setFullName('');
    setLatinName('');
    setNationalId('');
    setPassportNumber('');
    setPhone('');
  };

  const handleCaravanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrvName.trim() || !newCrvDest.trim()) return;
    const nextNum = caravans.length + 1;
    onAddCaravan({
      code: `CRV-1405-0${nextNum}`,
      name: newCrvName.trim(),
      destination: newCrvDest.trim(),
      destinationCode: newCrvDestCode.trim().toUpperCase() || 'MHD',
      origin: 'تهران',
      originCode: 'IKA',
      departureDate: newCrvDeparture,
      returnDate: newCrvReturn,
      monthLabel: newCrvMonth,
      hotelName: newCrvHotel.trim() || 'هتل منتخب ۴ ستاره',
      capacity: Number(newCrvCapacity) || 30,
      isHajjOfficial: newCrvIsHajj,
      hotelCost: 180000000,
      buyCost: 220000000,
      sellRevenue: 510000000,
      status: 'active',
    });
    setShowNewCaravanModal(false);
    setNewCrvName('');
    setNewCrvDest('');
    setNewCrvHotel('');
  };

  const getCaravanById = (id: string) => caravans.find((c) => c.id === id);

  return (
    <div className="space-y-8">
      {/* Section 1: Active Caravans Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              لیست کاروان‌های فعال و برنامه‌ریزی‌شده
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ظرفیت، هتل محل اقامت و وضعیت صدور بلیت کاروان‌ها به‌صورت یکپارچه مدیریت می‌شود.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewCaravanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تعریف کاروان جدید
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">کد کاروان</th>
                <th className="py-3 px-4">عنوان کاروان</th>
                <th className="py-3 px-4">تاریخ رفت و برگشت</th>
                <th className="py-3 px-4">هتل اقامت</th>
                <th className="py-3 px-4">ظرفیت و مسافران ثبت‌شده</th>
                <th className="py-3 px-4">بلیت صادرشده</th>
                <th className="py-3 px-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {caravans.map((caravan) => {
                const stats = passengerCountByCaravan[caravan.id] || { total: 0, issued: 0 };
                // Baseline booked + live registered passengers for realistic occupancy visualization
                const occupied = Math.min(caravan.capacity, stats.total + 12);
                const percent = Math.round((occupied / caravan.capacity) * 100);
                const isSelected = selectedCaravanFilter === caravan.id;
                return (
                  <tr
                    key={caravan.id}
                    onClick={() =>
                      setSelectedCaravanFilter(isSelected ? 'all' : caravan.id)
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#0F4C81]/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono-tabular text-xs font-semibold text-[#0F4C81] whitespace-nowrap">
                      {caravan.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{caravan.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{caravan.destination}</span>
                        <span>·</span>
                        <span>
                          {caravan.isHajjOfficial ? '🕋 رسمی حج و زیارت' : 'کاروان اختصاصی آژانس'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {caravan.departureDate} تا {caravan.returnDate}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{caravan.hotelName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[170px]">
                      <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                        <span className="font-medium text-slate-800">
                          {toPersianDigits(occupied)} از {toPersianDigits(caravan.capacity)} نفر
                        </span>
                        <span className="text-slate-500">{toPersianDigits(percent)}٪</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 85
                              ? 'bg-amber-500'
                              : caravan.isHajjOfficial
                              ? 'bg-emerald-600'
                              : 'bg-[#0F4C81]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold tabular-nums whitespace-nowrap text-slate-800">
                      {toPersianDigits(stats.issued)} از {toPersianDigits(stats.total)} مسافر پنل
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                      {caravan.status === 'active' && (
                        <span className="text-emerald-700">در حال ثبت‌نام</span>
                      )}
                      {caravan.status === 'completing' && (
                        <span className="text-amber-700">در آستانه تکمیل</span>
                      )}
                      {caravan.status === 'departed' && (
                        <span className="text-slate-500">اعزام‌شده</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Single-Entry Passenger Registration + Passengers Directory */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Quick Single-Entry Registration Form */}
        <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
            <div className="w-9 h-9 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ثبت یک‌باره مشخصات مسافر
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                داده‌ها بدون نیاز به ورود مجدد به صدور بلیت منتقل می‌شوند.
              </p>
            </div>
          </div>

          <form onSubmit={handlePassengerSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                انتخاب کاروان مربوطه *
              </label>
              <select
                value={caravanId}
                onChange={(e) => setCaravanId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15"
              >
                {caravans.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                نام و نام خانوادگی (فارسی) *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سید علی محمدی"
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                نام لاتین مطابق گذرنامه (برای بلیت)
              </label>
              <input
                type="text"
                dir="ltr"
                value={latinName}
                onChange={(e) => setLatinName(e.target.value)}
                placeholder="SEYED ALI MOHAMMADI"
                className="w-full px-3 py-2.5 text-sm font-mono-tabular uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15 text-left"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  کد ملی *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="0081234567"
                  className="w-full px-3 py-2.5 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15 text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  شماره پاسپورت
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="N92837465"
                  className="w-full px-3 py-2.5 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15 text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                شماره موبایل مسافر
              </label>
              <input
                type="text"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
                placeholder="09123456789"
                className="w-full px-3 py-2.5 text-sm font-mono-tabular bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15 text-left"
              />
            </div>

            {formError && (
              <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              ثبت مسافر در کاروان
            </button>
          </form>
        </section>

        {/* Passengers Directory & Transfer to Ticketing */}
        <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F4C81]" />
                <h3 className="text-sm font-bold text-slate-900">
                  فهرست مسافران ثبت‌شده ({toPersianDigits(filteredPassengers.length)} نفر)
                </h3>
              </div>

              {/* Status Filter Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'all', label: 'همه' },
                    { id: 'pending', label: 'در انتظار صدور' },
                    { id: 'issued', label: 'صادر شده' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس نام، کد ملی یا شماره پاسپورت..."
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                />
              </div>

              <select
                value={selectedCaravanFilter}
                onChange={(e) => setSelectedCaravanFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F4C81]"
              >
                <option value="all">همه کاروان‌ها</option>
                {caravans.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.destination}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[740px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">مسافر</th>
                  <th className="py-3 px-4">کد ملی / پاسپورت</th>
                  <th className="py-3 px-4">کاروان</th>
                  <th className="py-3 px-4">وضعیت بلیت</th>
                  <th className="py-3 px-4 text-left">عملیات صدور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPassengers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      هیچ مسافری با فیلتر انتخاب‌شده یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredPassengers.map((pax) => {
                    const caravan = getCaravanById(pax.caravanId);
                    return (
                      <tr key={pax.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{pax.fullName}</div>
                          <div className="text-[11px] font-mono-tabular text-slate-500 mt-0.5">
                            {pax.latinName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-xs text-slate-700 whitespace-nowrap">
                          <div>ملی: {toPersianDigits(pax.nationalId)}</div>
                          <div className="text-slate-500 mt-0.5">پاسپورت: {pax.passportNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-slate-800">
                            {caravan?.destination || '—'}
                          </div>
                          <div className="text-slate-500 font-mono-tabular mt-0.5">
                            {caravan?.code} · {caravan?.departureDate}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {pax.ticketStatus === 'issued' ? (
                            <div className="inline-flex flex-col">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                صادر شده ✅
                              </span>
                              {pax.pnr && (
                                <span className="text-[11px] font-mono-tabular text-slate-500 mt-0.5">
                                  PNR: {pax.pnr}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                              <Clock className="w-4 h-4 text-amber-500" />
                              در انتظار صدور ⏳
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-left whitespace-nowrap">
                          {pax.ticketStatus === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => onTransferToTicketing(pax)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Plane className="w-3.5 h-3.5" />
                              انتقال به صدور بلیت
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewIssuedTicket(pax)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0F4C81] bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              مشاهده و چاپ بلیت
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* New Caravan Modal */}
      {showNewCaravanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">تعریف کاروان جدید</h3>
              <button
                type="button"
                onClick={() => setShowNewCaravanModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCaravanSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  نام کاروان
                </label>
                <input
                  type="text"
                  required
                  value={newCrvName}
                  onChange={(e) => setNewCrvName(e.target.value)}
                  placeholder="مثال: کاروان ویژه نیمه شعبان کربلا"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    مقصد
                  </label>
                  <input
                    type="text"
                    required
                    value={newCrvDest}
                    onChange={(e) => setNewCrvDest(e.target.value)}
                    placeholder="نجف / مشهد / استانبول"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    کد فرودگاه مقصد (IATA)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newCrvDestCode}
                    onChange={(e) => setNewCrvDestCode(e.target.value.toUpperCase().slice(0, 3))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاریخ رفت
                  </label>
                  <input
                    type="text"
                    value={newCrvDeparture}
                    onChange={(e) => setNewCrvDeparture(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاریخ برگشت
                  </label>
                  <input
                    type="text"
                    value={newCrvReturn}
                    onChange={(e) => setNewCrvReturn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    نام هتل اقامت
                  </label>
                  <input
                    type="text"
                    value={newCrvHotel}
                    onChange={(e) => setNewCrvHotel(e.target.value)}
                    placeholder="هتل قصر طلایی"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ظرفیت کل
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={newCrvCapacity}
                    onChange={(e) => setNewCrvCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    دوره مالی (ماه)
                  </label>
                  <select
                    value={newCrvMonth}
                    onChange={(e) => setNewCrvMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                  >
                    <option value="آبان ۱۴۰۵">آبان ۱۴۰۵</option>
                    <option value="آذر ۱۴۰۵">آذر ۱۴۰۵</option>
                    <option value="دی ۱۴۰۵">دی ۱۴۰۵</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCrvIsHajj}
                    onChange={(e) => setNewCrvIsHajj(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  کاروان رسمی سازمان حج و زیارت 🕋
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewCaravanModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg cursor-pointer"
                >
                  ثبت کاروان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

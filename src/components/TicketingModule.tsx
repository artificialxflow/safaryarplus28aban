import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane,
  Printer,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Luggage,
  FileText,
} from 'lucide-react';
import { Caravan, IssuedTicket, Passenger } from '../types';
import {
  formatToman,
  generatePNR,
  generateTicketNumber,
  toPersianDigits,
} from '../utils/format';

interface TicketingModuleProps {
  caravans: Caravan[];
  passengers: Passenger[];
  issuedTickets: IssuedTicket[];
  selectedPassengerForIssue: Passenger | null;
  selectedTicketToPreview: IssuedTicket | null;
  onClearPreselected: () => void;
  onIssueTicket: (ticket: Omit<IssuedTicket, 'id' | 'issuedAt'>) => void;
}

const AIRLINES = [
  { name: 'هواپیمایی معراج (Meraj Airlines)', prefix: 'JI' },
  { name: 'هواپیمایی ماهان (Mahan Air)', prefix: 'W5' },
  { name: 'ایران‌ایر — هما (Iran Air)', prefix: 'IR' },
  { name: 'قشم‌ایر (Qeshm Air)', prefix: 'QB' },
  { name: 'ترکیش ایرلاینز (Turkish Airlines)', prefix: 'TK' },
  { name: 'فلای‌دبی (flydubai)', prefix: 'FZ' },
];

const AIRPORTS = [
  { city: 'تهران (امام خمینی)', code: 'IKA' },
  { city: 'تهران (مهرآباد)', code: 'THR' },
  { city: 'نجف اشرف', code: 'NJF' },
  { city: 'مشهد مقدس', code: 'MHD' },
  { city: 'استانبول', code: 'IST' },
  { city: 'دبی', code: 'DXB' },
  { city: 'جزیره کیش', code: 'KIH' },
  { city: 'اصفهان', code: 'IFN' },
];

// Deterministic vector QR code SVG generated from ticket seed
const VectorQRCode: React.FC<{ seed: string }> = ({ seed }) => {
  const cells = useMemo(() => {
    const size = 15;
    const grid: boolean[][] = [];
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns in 3 corners
        const inTopLeft = r < 5 && c < 5;
        const inTopRight = r < 5 && c >= size - 5;
        const inBottomLeft = r >= size - 5 && c < 5;
        if (inTopLeft || inTopRight || inBottomLeft) {
          const lr = inBottomLeft ? r - (size - 5) : r;
          const lc = inTopRight ? c - (size - 5) : c;
          const isBorder = lr === 0 || lr === 4 || lc === 0 || lc === 4;
          const isCenter = lr === 2 && lc === 2;
          row.push(isBorder || isCenter);
        } else {
          hash = Math.imul(hash ^ (r * 31 + c * 17), 16777619);
          row.push((hash & 3) === 0 || (hash & 5) === 5);
        }
      }
      grid.push(row);
    }
    return grid;
  }, [seed]);

  return (
    <svg
      viewBox="0 0 15 15"
      className="w-20 h-20 bg-white p-1 border border-slate-200 rounded"
      aria-label="کد QR بلیت الکترونیکی"
    >
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F172A" />
          ) : null
        )
      )}
    </svg>
  );
};

// Deterministic vector Code-128 style Barcode
const VectorBarcode: React.FC<{ code: string }> = ({ code }) => {
  const bars = useMemo(() => {
    const result: { x: number; w: number }[] = [];
    let x = 2;
    for (let i = 0; i < 42; i++) {
      const charCode = code.charCodeAt(i % code.length) || 65;
      const w = ((charCode + i * 7) % 3) + 1;
      const gap = ((charCode + i * 3) % 2) + 1;
      result.push({ x, w });
      x += w + gap;
    }
    return { items: result, totalWidth: x + 2 };
  }, [code]);

  return (
    <svg
      viewBox={`0 0 ${bars.totalWidth} 38`}
      className="w-full h-11"
      preserveAspectRatio="none"
      aria-label="بارکد بلیت هواپیما"
    >
      {bars.items.map((bar, idx) => (
        <rect key={idx} x={bar.x} y={0} width={bar.w} height={38} fill="#0F172A" />
      ))}
    </svg>
  );
};

export const TicketingModule: React.FC<TicketingModuleProps> = ({
  caravans,
  passengers,
  issuedTickets,
  selectedPassengerForIssue,
  selectedTicketToPreview,
  onClearPreselected,
  onIssueTicket,
}) => {
  const [linkedPassengerId, setLinkedPassengerId] = useState<string>('');
  const [passengerName, setPassengerName] = useState('فاطمه سادات موسوی');
  const [latinName, setLatinName] = useState('FATEMEH SADAT MOUSAVI');
  const [nationalId, setNationalId] = useState('0061938472');
  const [passportNumber, setPassportNumber] = useState('N51903824');
  const [airline, setAirline] = useState(AIRLINES[0].name);
  const [flightNumber, setFlightNumber] = useState('JI-4812');
  const [originCode, setOriginCode] = useState('IKA');
  const [destinationCode, setDestinationCode] = useState('NJF');
  const [flightDate, setFlightDate] = useState('۱۴۰۵/۰۹/۰۵');
  const [departureTime, setDepartureTime] = useState('۰۸:۳۰');
  const [arrivalTime, setArrivalTime] = useState('۱۰:۱۵');
  const [boardingTime, setBoardingTime] = useState('۰۷:۴۵');
  const [gate, setGate] = useState('B14');
  const [seat, setSeat] = useState('14C');
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Business'>('Economy');
  const [baggage, setBaggage] = useState('۳۰ کیلوگرم + ۷ کیلوگرم کابین');
  const [fareAmount, setFareAmount] = useState(11400000);
  const [pnr, setPnr] = useState('SY9M4K');
  const [ticketNumber, setTicketNumber] = useState('815-6193847204');
  const [caravanCode, setCaravanCode] = useState('CRV-1405-01');
  const [justIssuedBanner, setJustIssuedBanner] = useState<string>('');

  const applyPassengerAutoFill = (pax: Passenger) => {
    const caravan = caravans.find((c) => c.id === pax.caravanId);
    setLinkedPassengerId(pax.id);
    setPassengerName(pax.fullName);
    setLatinName(pax.latinName);
    setNationalId(pax.nationalId);
    setPassportNumber(pax.passportNumber);
    if (caravan) {
      setOriginCode(caravan.originCode);
      setDestinationCode(caravan.destinationCode);
      setFlightDate(caravan.departureDate);
      setCaravanCode(caravan.code);
      if (caravan.destinationCode === 'MHD') {
        setAirline(AIRLINES[1].name);
        setFlightNumber('W5-1064');
        setFareAmount(4950000);
      } else if (caravan.destinationCode === 'IST') {
        setAirline(AIRLINES[4].name);
        setFlightNumber('TK-875');
        setFareAmount(19800000);
      } else if (caravan.destinationCode === 'DXB') {
        setAirline(AIRLINES[5].name);
        setFlightNumber('FZ-1930');
        setFareAmount(22400000);
      } else {
        setAirline(AIRLINES[0].name);
        setFlightNumber('JI-4812');
        setFareAmount(11400000);
      }
    }
    setPnr(pax.pnr || generatePNR());
    setTicketNumber(pax.ticketNumber || generateTicketNumber());
    setJustIssuedBanner('');
  };

  const applyExistingTicket = (tkt: IssuedTicket) => {
    setLinkedPassengerId(tkt.passengerId || '');
    setPassengerName(tkt.passengerName);
    setLatinName(tkt.latinName);
    setNationalId(tkt.nationalId);
    setPassportNumber(tkt.passportNumber);
    setAirline(tkt.airline);
    setFlightNumber(tkt.flightNumber);
    setOriginCode(tkt.originCode);
    setDestinationCode(tkt.destinationCode);
    setFlightDate(tkt.flightDate);
    setDepartureTime(tkt.departureTime);
    setArrivalTime(tkt.arrivalTime);
    setBoardingTime(tkt.boardingTime);
    setGate(tkt.gate);
    setSeat(tkt.seat);
    setCabinClass(tkt.cabinClass);
    setBaggage(tkt.baggage);
    setFareAmount(tkt.fareAmount);
    setPnr(tkt.pnr);
    setTicketNumber(tkt.ticketNumber);
    setCaravanCode(tkt.caravanCode || '');
    setJustIssuedBanner('');
  };

  useEffect(() => {
    if (selectedPassengerForIssue) {
      applyPassengerAutoFill(selectedPassengerForIssue);
      onClearPreselected();
    }
  }, [selectedPassengerForIssue]);

  useEffect(() => {
    if (selectedTicketToPreview) {
      applyExistingTicket(selectedTicketToPreview);
      onClearPreselected();
    }
  }, [selectedTicketToPreview]);

  const originCity =
    AIRPORTS.find((a) => a.code === originCode)?.city || 'تهران (امام خمینی)';
  const destinationCity =
    AIRPORTS.find((a) => a.code === destinationCode)?.city || 'نجف اشرف';

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim()) return;
    onIssueTicket({
      ticketNumber,
      pnr,
      passengerId: linkedPassengerId || undefined,
      passengerName: passengerName.trim(),
      latinName: (latinName.trim() || 'PASSENGER').toUpperCase(),
      nationalId: nationalId.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      airline,
      flightNumber: flightNumber.trim().toUpperCase(),
      originCity,
      originCode,
      destinationCity,
      destinationCode,
      flightDate,
      departureTime,
      arrivalTime,
      boardingTime,
      gate: gate.trim().toUpperCase(),
      seat: seat.trim().toUpperCase(),
      cabinClass,
      baggage,
      fareAmount: Number(fareAmount) || 0,
      caravanCode: caravanCode || undefined,
    });
    setJustIssuedBanner(
      `بلیت الکترونیکی به شماره ${ticketNumber} و کد مرجع ${pnr} با موفقیت صادر و در کاروان ثبت شد.`
    );
  };

  const handlePrintTicket = () => {
    document.body.classList.add('printing-ticket');
    const cleanup = () => {
      document.body.classList.remove('printing-ticket');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Main Split: Issuance Form + Live Printable E-Ticket Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Fast Flight Issuance Form */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 no-print">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center shrink-0">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  فرم صدور آنی بلیت هواپیما
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  انتخاب مستقیم از کاروان‌ها (Auto-Fill) یا صدور تکی
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPnr(generatePNR());
                setTicketNumber(generateTicketNumber());
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg cursor-pointer whitespace-nowrap"
              title="تولید کد PNR و شماره بلیت جدید"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              کد جدید
            </button>
          </div>

          {/* Direct Caravan Passenger Auto-Fill */}
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#0F4C81] mb-2">
              <UserCheck className="w-4 h-4" />
              فراخوانی خودکار مسافر از لیست کاروان‌ها
            </label>
            <select
              value={linkedPassengerId}
              onChange={(e) => {
                const pax = passengers.find((p) => p.id === e.target.value);
                if (pax) {
                  applyPassengerAutoFill(pax);
                } else {
                  setLinkedPassengerId('');
                }
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
            >
              <option value="">— ورود دستی یا انتخاب مسافر از کاروان —</option>
              {passengers.map((p) => {
                const crv = caravans.find((c) => c.id === p.caravanId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({crv?.destination || 'کاروان'}) —{' '}
                    {p.ticketStatus === 'pending' ? 'در انتظار صدور ⏳' : 'صادر شده ✅'}
                  </option>
                );
              })}
            </select>
          </div>

          <form onSubmit={handleIssueSubmit} className="mt-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام مسافر (فارسی)
                </label>
                <input
                  type="text"
                  required
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام لاتین (روی بلیت)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={latinName}
                  onChange={(e) => setLatinName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">کد ملی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره پاسپورت
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ایرلاین</label>
                <select
                  value={airline}
                  onChange={(e) => {
                    const selected = AIRLINES.find((a) => a.name === e.target.value);
                    setAirline(e.target.value);
                    if (selected) {
                      setFlightNumber(`${selected.prefix}-${Math.floor(1000 + Math.random() * 8000)}`);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                >
                  {AIRLINES.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره پرواز
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">فرودگاه مبدا</label>
                <select
                  value={originCode}
                  onChange={(e) => setOriginCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                >
                  {AIRPORTS.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">فرودگاه مقصد</label>
                <select
                  value={destinationCode}
                  onChange={(e) => setDestinationCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                >
                  {AIRPORTS.map((ap) => (
                    <option key={ap.code} value={ap.code}>
                      {ap.city} ({ap.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">تاریخ پرواز</label>
                <input
                  type="text"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ساعت پرواز</label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ساعت فرود</label>
                <input
                  type="text"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">گیت</label>
                <input
                  type="text"
                  dir="ltr"
                  value={gate}
                  onChange={(e) => setGate(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">صندلی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={seat}
                  onChange={(e) => setSeat(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-center"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">کلاس پروازی</label>
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as 'Economy' | 'Business')}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Economy">اکونومی (Economy)</option>
                  <option value="Business">بیزینس (Business)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  مبلغ بلیت (تومان)
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">بار مجاز</label>
                <input
                  type="text"
                  value={baggage}
                  onChange={(e) => setBaggage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {justIssuedBanner && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{justIssuedBanner}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                صدور نهایی و ثبت در کاروان
              </button>
              <button
                type="button"
                onClick={handlePrintTicket}
                className="py-2.5 px-4 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                چاپ / دانلود PDF
              </button>
            </div>
          </form>
        </section>

        {/* Live Printable Boarding Pass / E-Ticket Preview */}
        <section className="xl:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 no-print">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                پیش‌نمایش زنده بلیت الکترونیکی (E-Ticket / Boarding Pass)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تغییرات فرم به‌صورت آنی در نسخه چاپی استاندارد بلیت اعمال می‌شود.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintTicket}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              دانلود / چاپ نسخه PDF بلیت
            </button>
          </div>

          {/* Printable E-Ticket Card */}
          <div
            id="print-ticket-area"
            className="print-only-surface bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Ticket Top Header Bar */}
            <div className="bg-[#0F4C81] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-base font-extrabold tracking-tight">
                    سفریار پلاس | SafarYar Plus
                  </div>
                  <div className="text-[11px] text-sky-100/90">
                    بلیت الکترونیکی پرواز · ELECTRONIC TICKET & BOARDING PASS
                  </div>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <div className="text-[11px] text-sky-200">BOOKING REF (PNR)</div>
                <div className="text-lg font-mono-tabular font-bold tracking-wider text-amber-300">
                  {pnr}
                </div>
              </div>
            </div>

            {/* Ticket Body Split (Main Stub + Perforated Boarding Stub) */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Primary Flight & Passenger Info */}
              <div className="md:col-span-8 p-6 space-y-5 md:border-l md:border-dashed md:border-slate-300">
                {/* Airline + Route Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500">شرکت هواپیمایی</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{airline}</div>
                  </div>
                  <div className="text-left" dir="ltr">
                    <div className="text-[11px] text-slate-500">FLIGHT NO / CLASS</div>
                    <div className="text-sm font-mono-tabular font-bold text-[#0F4C81]">
                      {flightNumber} · {cabinClass.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Big Airport Codes Strip */}
                <div
                  dir="ltr"
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="text-left">
                    <div className="text-2xl sm:text-3xl font-mono-tabular font-bold text-slate-900">
                      {originCode}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5" dir="rtl">
                      {originCity}
                    </div>
                    <div className="text-xs font-semibold text-[#0F4C81] mt-1 tabular-nums">
                      پرواز: {departureTime}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center px-2">
                    <div className="text-[11px] font-medium text-slate-500 mb-1 tabular-nums">
                      {flightDate}
                    </div>
                    <div className="w-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0F4C81]" />
                      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                      <Plane className="w-4 h-4 text-[#0F4C81] shrink-0" />
                      <div className="flex-1 border-t-2 border-dashed border-slate-300" />
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      پرواز مستقیم · DIRECT
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-mono-tabular font-bold text-slate-900">
                      {destinationCode}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5" dir="rtl">
                      {destinationCity}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 mt-1 tabular-nums">
                      فرود: {arrivalTime}
                    </div>
                  </div>
                </div>

                {/* Passenger Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="col-span-2 sm:col-span-2">
                    <div className="text-slate-500">نام مسافر / PASSENGER NAME</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {passengerName}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-slate-600 mt-0.5">
                      {latinName}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">شماره بلیت / E-TICKET</div>
                    <div className="font-mono-tabular font-semibold text-slate-900 mt-1">
                      {ticketNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">کد ملی</div>
                    <div className="font-mono-tabular font-semibold text-slate-800 mt-0.5">
                      {toPersianDigits(nationalId)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">شماره گذرنامه</div>
                    <div className="font-mono-tabular font-semibold text-slate-800 mt-0.5">
                      {passportNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">مبلغ کل بلیت</div>
                    <div className="font-bold text-[#0F4C81] mt-0.5 tabular-nums">
                      {formatToman(fareAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Boarding Stub + QR & Barcode */}
              <div className="md:col-span-4 p-5 bg-slate-50/70 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-3 gap-2 text-center bg-white border border-slate-200 rounded-lg p-3">
                  <div>
                    <div className="text-[10px] text-slate-500">گیت</div>
                    <div className="text-base font-mono-tabular font-bold text-[#0F4C81]">
                      {gate}
                    </div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[10px] text-slate-500">صندلی</div>
                    <div className="text-base font-mono-tabular font-bold text-slate-900">
                      {seat}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">بوردینگ</div>
                    <div className="text-sm font-mono-tabular font-bold text-amber-600">
                      {boardingTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <div className="space-y-1 text-[11px]">
                    <div className="font-bold text-slate-800">تأییدیه الکترونیکی</div>
                    <div className="text-slate-500">وضعیت: قطعی (OK)</div>
                    {caravanCode && (
                      <div className="font-mono-tabular text-[#0F4C81] font-medium">
                        کاروان: {caravanCode}
                      </div>
                    )}
                  </div>
                  <VectorQRCode seed={`${pnr}-${ticketNumber}-${passportNumber}`} />
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <VectorBarcode code={`${pnr}${ticketNumber}${flightNumber}`} />
                  <div
                    dir="ltr"
                    className="text-[10px] font-mono-tabular text-center text-slate-500 tracking-widest mt-1"
                  >
                    {ticketNumber} · {pnr}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Rules & Agency Stamp Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                قوانین و مقررات پرواز و بار مجاز
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-[#0F4C81] shrink-0 mt-0.5" />
                  <span>میزان بار مجاز: {baggage}</span>
                </div>
                <div>
                  حضور در فرودگاه برای پروازهای خارجی ۳ ساعت و پروازهای داخلی ۲ ساعت پیش از پرواز الزامی است.
                </div>
                <div>
                  پشتیبانی ۲۴ ساعته سفریار پلاس: <span className="font-semibold text-slate-900">۰۲۱-۸۸۹۰۴۵۰۰</span> · مجوز بند الف سازمان هواپیمایی کشوری
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Recently Issued Tickets Archive */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden no-print">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F4C81]" />
            <h3 className="text-sm font-bold text-slate-900">
              آرشیو بلیت‌های صادرشده ({toPersianDigits(issuedTickets.length)} فقره)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            برای بازبینی یا چاپ مجدد روی هر بلیت کلیک کنید
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[740px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">شماره بلیت / PNR</th>
                <th className="py-3 px-4">مسافر</th>
                <th className="py-3 px-4">مسیر و پرواز</th>
                <th className="py-3 px-4">تاریخ و ساعت</th>
                <th className="py-3 px-4">مبلغ</th>
                <th className="py-3 px-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {issuedTickets.map((tkt) => (
                <tr key={tkt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono-tabular whitespace-nowrap">
                    <div className="font-bold text-[#0F4C81]">{tkt.pnr}</div>
                    <div className="text-slate-500">{tkt.ticketNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{tkt.passengerName}</div>
                    <div className="text-slate-500 font-mono-tabular">{tkt.passportNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      {tkt.originCity} ← {tkt.destinationCity}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {tkt.airline} · {tkt.flightNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums whitespace-nowrap text-slate-700">
                    {tkt.flightDate} · ساعت {tkt.departureTime}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                    {formatToman(tkt.fareAmount)}
                  </td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => applyExistingTicket(tkt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F4C81] bg-[#0F4C81]/10 hover:bg-[#0F4C81]/15 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      بارگذاری و چاپ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

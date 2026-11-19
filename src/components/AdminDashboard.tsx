import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Globe,
  Users,
  Plane,
  Calculator,
  Menu,
  X,
  TrendingUp,
  Ticket,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import {
  AdminTab,
  Caravan,
  CmsSettings,
  Hotel,
  IssuedTicket,
  PartnerAccount,
  PartnerTransaction,
  Passenger,
  Tour,
  TourCategory,
} from '../types';
import { formatMillionToman, formatToman, toPersianDigits } from '../utils/format';
import { IMAGES } from '../data/mockData';
import { CaravansModule } from './CaravansModule';
import { TicketingModule } from './TicketingModule';
import { AccountingModule } from './AccountingModule';

interface AdminDashboardProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  tours: Tour[];
  hotels: Hotel[];
  caravans: Caravan[];
  passengers: Passenger[];
  issuedTickets: IssuedTicket[];
  partners: PartnerAccount[];
  cmsSettings: CmsSettings;
  onUpdateCmsSettings: (updates: Partial<CmsSettings>) => void;
  onAddTour: (tour: Tour) => void;
  onDeleteTour: (tourId: string) => void;
  onUpdateTourPrice: (tourId: string, price: number) => void;
  onAddHotel: (hotel: Hotel) => void;
  onDeleteHotel: (hotelId: string) => void;
  onAddPassenger: (passenger: Omit<Passenger, 'id' | 'ticketStatus' | 'registeredAt'>) => void;
  onAddCaravan: (caravan: Omit<Caravan, 'id'>) => void;
  onIssueTicket: (ticket: Omit<IssuedTicket, 'id' | 'issuedAt'>) => void;
  onUpdateCaravanFinance: (
    caravanId: string,
    updates: { hotelCost: number; buyCost: number; sellRevenue: number }
  ) => void;
  onAddPartnerTransaction: (
    partnerId: string,
    tx: Omit<PartnerTransaction, 'id'>
  ) => void;
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
  { id: 'cms', label: 'مدیریت محتوای سایت', icon: Globe },
  { id: 'caravans', label: 'کاروان‌ها و مسافران', icon: Users },
  { id: 'ticketing', label: 'صدور بلیت هواپیما', icon: Plane },
  { id: 'accounting', label: 'حسابداری و طرف‌حساب‌ها', icon: Calculator },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onTabChange,
  tours,
  hotels,
  caravans,
  passengers,
  issuedTickets,
  partners,
  cmsSettings,
  onUpdateCmsSettings,
  onAddTour,
  onDeleteTour,
  onUpdateTourPrice,
  onAddHotel,
  onDeleteHotel,
  onAddPassenger,
  onAddCaravan,
  onIssueTicket,
  onUpdateCaravanFinance,
  onAddPartnerTransaction,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedPassengerForIssue, setSelectedPassengerForIssue] = useState<Passenger | null>(null);
  const [selectedTicketToPreview, setSelectedTicketToPreview] = useState<IssuedTicket | null>(null);

  // CMS Modals & Sync feedback
  const [cmsSubTab, setCmsSubTab] = useState<'tours' | 'hotels' | 'hajj'>('tours');
  const [showAddTourModal, setShowAddTourModal] = useState(false);
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [syncingHajj, setSyncingHajj] = useState(false);

  // New Tour CMS form
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourDest, setNewTourDest] = useState('');
  const [newTourCategory, setNewTourCategory] = useState<TourCategory>('pilgrimage');
  const [newTourIsHajj, setNewTourIsHajj] = useState(false);
  const [newTourNights, setNewTourNights] = useState(4);
  const [newTourPrice, setNewTourPrice] = useState(18500000);
  const [newTourAirline, setNewTourAirline] = useState('هواپیمایی ماهان');
  const [newTourHotel, setNewTourHotel] = useState('هتل ۴ ستاره منتخب');

  // New Hotel CMS form
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelCity, setNewHotelCity] = useState('مشهد');
  const [newHotelStars, setNewHotelStars] = useState(5);
  const [newHotelPrice, setNewHotelPrice] = useState(5400000);
  const [newHotelAddress, setNewHotelAddress] = useState('');

  // Live Dashboard Metrics
  const dashboardStats = useMemo(() => {
    const activeCaravansCount = caravans.filter((c) => c.status !== 'departed').length;
    const totalPassengers = passengers.length;
    const issuedCount = passengers.filter((p) => p.ticketStatus === 'issued').length;
    const pendingCount = passengers.filter((p) => p.ticketStatus === 'pending').length;
    const totalNetProfit = caravans.reduce(
      (sum, c) => sum + (c.sellRevenue - (c.hotelCost + c.buyCost)),
      0
    );
    const maxCaravanProfit = Math.max(
      1,
      ...caravans.map((c) => Math.max(0, c.sellRevenue - (c.hotelCost + c.buyCost)))
    );

    return {
      activeCaravansCount,
      totalPassengers,
      issuedCount,
      pendingCount,
      totalTicketsIssued: issuedTickets.length,
      totalNetProfit,
      maxCaravanProfit,
    };
  }, [caravans, passengers, issuedTickets]);

  const handleTransferToTicketing = (passenger: Passenger) => {
    setSelectedTicketToPreview(null);
    setSelectedPassengerForIssue(passenger);
    onTabChange('ticketing');
  };

  const handleViewIssuedTicket = (passenger: Passenger) => {
    const found = issuedTickets.find(
      (t) =>
        t.passengerId === passenger.id ||
        (passenger.ticketNumber && t.ticketNumber === passenger.ticketNumber)
    );
    if (found) {
      setSelectedPassengerForIssue(null);
      setSelectedTicketToPreview(found);
      onTabChange('ticketing');
    } else {
      handleTransferToTicketing(passenger);
    }
  };

  const handleAddTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourTitle.trim() || !newTourDest.trim()) return;
    const imgByDest =
      newTourDest.includes('کربلا') || newTourDest.includes('نجف')
        ? IMAGES.karbala
        : newTourDest.includes('استانبول') || newTourDest.includes('ترکیه')
        ? IMAGES.istanbul
        : newTourDest.includes('دبی')
        ? IMAGES.dubai
        : IMAGES.mashhad;

    onAddTour({
      id: `tour-${Date.now()}`,
      code: newTourIsHajj
        ? `HAJ-${Math.floor(920 + Math.random() * 70)}`
        : `SY-${Math.floor(700 + Math.random() * 200)}`,
      title: newTourTitle.trim(),
      destination: newTourDest.trim(),
      origin: 'تهران',
      category: newTourCategory,
      isHajjOfficial: newTourIsHajj,
      hajjGroupCode: newTourIsHajj ? `${Math.floor(40000 + Math.random() * 9000)}-الف` : undefined,
      durationNights: Number(newTourNights) || 4,
      durationDays: (Number(newTourNights) || 4) + 1,
      price: Number(newTourPrice) || 15000000,
      airline: newTourAirline,
      hotelName: newTourHotel,
      hotelStars: 4,
      image: imgByDest,
      gallery: [imgByDest, IMAGES.hotelSuite],
      featured: true,
      summary: `تور برنامه‌ریزی‌شده به مقصد ${newTourDest.trim()} با اقامت در ${newTourHotel} و پرواز رفت و برگشت ${newTourAirline}.`,
      services: [
        `بلیت رفت و برگشت ${newTourAirline}`,
        `${toPersianDigits(newTourNights)} شب اقامت در ${newTourHotel}`,
        'ترانسفر فرودگاهی و بیمه مسافرتی کامل',
        'پشتیبانی ۲۴ ساعته سفریار پلاس',
      ],
      itinerary: [
        {
          day: 1,
          title: `پرواز به ${newTourDest.trim()} و استقرار در هتل`,
          description: 'استقبال فرودگاهی، تحویل اتاق و شروع برنامه سفر.',
        },
        {
          day: (Number(newTourNights) || 4) + 1,
          title: 'تحویل اتاق و بازگشت به تهران',
          description: 'انتقال به فرودگاه و پرواز بازگشت.',
        },
      ],
      departures: [
        {
          id: `dep-${Date.now()}`,
          date: '۱۴۰۵/۰۹/۲۵',
          airline: newTourAirline,
          doublePrice: Number(newTourPrice) || 15000000,
          singlePrice: Math.round((Number(newTourPrice) || 15000000) * 1.35),
          childPrice: Math.round((Number(newTourPrice) || 15000000) * 0.72),
          remainingSeats: 12,
        },
      ],
    });
    setShowAddTourModal(false);
    setNewTourTitle('');
    setNewTourDest('');
  };

  const handleAddHotelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim()) return;
    onAddHotel({
      id: `hotel-${Date.now()}`,
      name: newHotelName.trim(),
      city: newHotelCity.trim() || 'مشهد',
      country: newHotelCity === 'استانبول' ? 'ترکیه' : newHotelCity === 'دبی' ? 'امارات' : newHotelCity === 'کربلا' ? 'عراق' : 'ایران',
      stars: Number(newHotelStars) || 5,
      rating: 4.8,
      reviewCount: 94,
      pricePerNight: Number(newHotelPrice) || 5000000,
      address: newHotelAddress.trim() || `${newHotelCity}، بلوار مرکزی`,
      distanceNote: 'دسترسی سریع به مراکز اصلی شهر و حمل‌ونقل',
      image: IMAGES.hotelSuite,
      gallery: [IMAGES.hotelSuite, IMAGES.mashhad],
      amenities: [
        'صبحانه بوفه کامل',
        'اینترنت پرسرعت رایگان',
        'ترانسفر فرودگاهی',
        'پذیرش ۲۴ ساعته',
      ],
      description: `${newHotelName.trim()} از هتل‌های منتخب طرف قرارداد سفریار پلاس با استانداردهای ممتاز میزبانی.`,
      rooms: [
        {
          id: `rm-${Date.now()}-1`,
          name: 'اتاق دوتخته استاندارد',
          capacity: 2,
          mealPlan: 'همراه با صبحانه بوفه',
          pricePerNight: Number(newHotelPrice) || 5000000,
          available: 8,
        },
        {
          id: `rm-${Date.now()}-2`,
          name: 'سوئیت خانوادگی VIP',
          capacity: 4,
          mealPlan: 'صبحانه + ناهار',
          pricePerNight: Math.round((Number(newHotelPrice) || 5000000) * 1.65),
          available: 3,
        },
      ],
    });
    setShowAddHotelModal(false);
    setNewHotelName('');
    setNewHotelAddress('');
  };

  const handleSyncHajjApi = () => {
    setSyncingHajj(true);
    setTimeout(() => {
      setSyncingHajj(false);
      onUpdateCmsSettings({
        hajjApiConnected: true,
        hajjLastSync: '۱۴۰۵/۰۸/۲۸ — همین الان (همگام‌سازی موفق)',
      });
    }, 650);
  };

  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeTab);

  return (
    <div className="min-h-[calc(100vh-44px)] bg-[#F8FAFC] flex">
      {/* Desktop Right Sidebar (RTL) */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-l border-slate-200 no-print">
        <div className="px-5 py-5 border-b border-slate-200">
          <div className="text-base font-extrabold text-[#0F4C81]">پنل مدیریت سفریار پلاس</div>
          <div className="text-xs text-slate-500 mt-1">سامانه یکپارچه کاروان، پرواز و مالی</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0F4C81] text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="text-xs font-semibold text-slate-800">دفتر مرکزی تهران</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            مجوز بند الف · بند ب · کارگزار حج و زیارت
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-68 max-w-[82vw] bg-white h-full border-l border-slate-200 flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#0F4C81]">
                پنل مدیریت سفریار پلاس
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#0F4C81] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Admin Top Header / Breadcrumbs */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="باز کردن منوی پنل"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>سفریار پلاس</span>
                <span>/</span>
                <span className="text-[#0F4C81] font-semibold truncate">
                  {activeNavMeta?.label}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate mt-0.5">
                {activeNavMeta?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange('ticketing')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plane className="w-3.5 h-3.5" />
              صدور سریع بلیت
            </button>
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {/* TAB 1: Executive Overview Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 4 High-Contrast KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">کاروان‌های فعال</span>
                    <span className="w-9 h-9 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-3 tabular-nums">
                    {toPersianDigits(dashboardStats.activeCaravansCount)} کاروان
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5">
                    از مجموع {toPersianDigits(caravans.length)} کاروان ثبت‌شده در فصل
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      مسافران ثبت‌شده در سامانه
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-3 tabular-nums">
                    {toPersianDigits(dashboardStats.totalPassengers)} نفر
                  </div>
                  <div className="text-xs text-amber-700 font-medium mt-1.5">
                    {toPersianDigits(dashboardStats.pendingCount)} نفر در انتظار صدور بلیت
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      بلیت‌های صادرشده
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-3 tabular-nums">
                    {toPersianDigits(dashboardStats.totalTicketsIssued)} قطعه
                  </div>
                  <div className="text-xs text-emerald-700 font-medium mt-1.5">
                    همگام با آرشیو بلیت الکترونیکی PDF
                  </div>
                </div>

                <div className="bg-[#0F4C81] text-white border border-[#0F4C81] rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-100">
                      تراز سود خالص کاروان‌ها
                    </span>
                    <span className="w-9 h-9 rounded-lg bg-white/15 text-amber-300 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold mt-3 tabular-nums">
                    {formatMillionToman(dashboardStats.totalNetProfit)}
                  </div>
                  <div className="text-xs text-sky-200 mt-1.5 tabular-nums">
                    معادل دقیق: {formatToman(dashboardStats.totalNetProfit)}
                  </div>
                </div>
              </div>

              {/* Analytical Charts Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bar Chart: Net Profit per Caravan */}
                <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        نمودار سود خالص به تفکیک هر کاروان
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        محاسبه زنده بر اساس داده‌های ماژول حسابداری کاروان‌ها
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTabChange('accounting')}
                      className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      جزئیات مالی
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {caravans.map((c) => {
                      const profit = c.sellRevenue - (c.hotelCost + c.buyCost);
                      const widthPct = Math.max(
                        8,
                        Math.round((Math.max(0, profit) / dashboardStats.maxCaravanProfit) * 100)
                      );
                      return (
                        <div key={c.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-800 truncate">
                              {c.name}
                            </span>
                            <span
                              className={`font-bold tabular-nums whitespace-nowrap ${
                                profit >= 0 ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {formatMillionToman(profit)}
                            </span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden border border-slate-200/70">
                            <div
                              className={`h-full rounded-md transition-all duration-300 ${
                                c.isHajjOfficial ? 'bg-emerald-600' : 'bg-[#0F4C81]'
                              }`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Ticket Issuance Status Breakdown */}
                <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      وضعیت صدور بلیت مسافران کاروان‌ها
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      نسبت بلیت‌های نهایی‌شده به مسافران در صف صدور
                    </p>

                    {(() => {
                      const total = Math.max(1, dashboardStats.totalPassengers);
                      const issuedPct = Math.round((dashboardStats.issuedCount / total) * 100);
                      const pendingPct = 100 - issuedPct;
                      const circumference = 2 * Math.PI * 52;
                      const strokeDashoffset =
                        circumference - (issuedPct / 100) * circumference;

                      return (
                        <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                              <circle
                                cx="60"
                                cy="60"
                                r="52"
                                fill="none"
                                stroke="#FEF3C7"
                                strokeWidth="12"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="52"
                                fill="none"
                                stroke="#059669"
                                strokeWidth="12"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                                {toPersianDigits(issuedPct)}٪
                              </div>
                              <div className="text-[11px] text-slate-500">صادر شده</div>
                            </div>
                          </div>

                          <div className="space-y-3 text-xs w-full sm:w-auto">
                            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                              <span className="font-semibold text-emerald-700">
                                بلیت صادر شده ✅
                              </span>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {toPersianDigits(dashboardStats.issuedCount)} نفر (
                                {toPersianDigits(issuedPct)}٪)
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                              <span className="font-semibold text-amber-700">
                                در انتظار صدور ⏳
                              </span>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {toPersianDigits(dashboardStats.pendingCount)} نفر (
                                {toPersianDigits(pendingPct)}٪)
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-600">اتصال حج و زیارت</span>
                              <span
                                className={`font-bold ${
                                  cmsSettings.hajjApiConnected
                                    ? 'text-emerald-700'
                                    : 'text-red-700'
                                }`}
                              >
                                {cmsSettings.hajjApiConnected ? 'متصل و فعال' : 'قطع'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => onTabChange('caravans')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-[#0F4C81] bg-[#0F4C81]/10 hover:bg-[#0F4C81]/15 rounded-lg transition-colors cursor-pointer"
                  >
                    مدیریت صف صدور بلیت کاروان‌ها
                  </button>
                </section>
              </div>

              {/* Actionable Queue: Passengers Pending Ticket Issuance */}
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      مسافران در انتظار صدور بلیت (اقدام سریع)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      با کلیک روی دکمه انتقال، اطلاعات مسافر مستقیماً در فرم صدور بلیت بارگذاری می‌شود.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse min-w-[660px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">نام مسافر</th>
                        <th className="py-3 px-4">کد ملی / پاسپورت</th>
                        <th className="py-3 px-4">کاروان و مقصد</th>
                        <th className="py-3 px-4 text-left">اقدام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {passengers.filter((p) => p.ticketStatus === 'pending').length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-emerald-700 font-semibold">
                            بلیت تمام مسافران ثبت‌شده صادر شده است.
                          </td>
                        </tr>
                      ) : (
                        passengers
                          .filter((p) => p.ticketStatus === 'pending')
                          .map((pax) => {
                            const crv = caravans.find((c) => c.id === pax.caravanId);
                            return (
                              <tr key={pax.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {pax.fullName}
                                </td>
                                <td className="py-3 px-4 font-mono-tabular text-slate-600">
                                  {toPersianDigits(pax.nationalId)} · {pax.passportNumber}
                                </td>
                                <td className="py-3 px-4 text-slate-700">
                                  {crv?.name} ({crv?.departureDate})
                                </td>
                                <td className="py-3 px-4 text-left">
                                  <button
                                    type="button"
                                    onClick={() => handleTransferToTicketing(pax)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg cursor-pointer whitespace-nowrap"
                                  >
                                    <Plane className="w-3.5 h-3.5" />
                                    انتقال به صدور بلیت
                                  </button>
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
          )}

          {/* TAB 2: Dynamic Website CMS & Hajj API Integration */}
          {activeTab === 'cms' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                  {(
                    [
                      { id: 'tours', label: `مدیریت تورها (${toPersianDigits(tours.length)})` },
                      { id: 'hotels', label: `مدیریت هتل‌ها (${toPersianDigits(hotels.length)})` },
                      { id: 'hajj', label: 'تنظیمات سایت و API حج و زیارت' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCmsSubTab(t.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        cmsSubTab === t.id
                          ? 'bg-white text-[#0F4C81] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {cmsSubTab === 'tours' && (
                  <button
                    type="button"
                    onClick={() => setShowAddTourModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن تور جدید به سایت
                  </button>
                )}
                {cmsSubTab === 'hotels' && (
                  <button
                    type="button"
                    onClick={() => setShowAddHotelModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن هتل جدید به سایت
                  </button>
                )}
              </div>

              {/* CMS Tours List */}
              {cmsSubTab === 'tours' && (
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">
                      فهرست تورهای فعال در وب‌سایت مشتریان
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      هرگونه افزودن، تغییر قیمت یا حذف در این بخش بلافاصله در نمای مشتریان اعمال می‌شود.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[740px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">کد / عنوان تور</th>
                          <th className="py-3 px-4">بخش نمایش</th>
                          <th className="py-3 px-4">مدت و ایرلاین</th>
                          <th className="py-3 px-4">قیمت پایه (تومان)</th>
                          <th className="py-3 px-4 text-left">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {tours.map((tour) => (
                          <tr key={tour.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{tour.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-mono-tabular">
                                {tour.code} · {tour.destination}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                              {tour.isHajjOfficial ? (
                                <span className="text-emerald-700">🕋 رسمی حج و زیارت</span>
                              ) : (
                                <span className="text-[#0F4C81]">تور ویژه آژانس</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {toPersianDigits(tour.durationNights)} شب · {tour.airline}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <input
                                type="number"
                                dir="ltr"
                                value={tour.price}
                                onChange={(e) =>
                                  onUpdateTourPrice(tour.id, Number(e.target.value) || 0)
                                }
                                className="w-32 px-2.5 py-1.5 text-xs font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81] text-left"
                              />
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <button
                                type="button"
                                onClick={() => onDeleteTour(tour.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="حذف تور از سایت"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* CMS Hotels List */}
              {cmsSubTab === 'hotels' && (
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">
                      هتل‌های معرفی‌شده در وب‌سایت مشتریان
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[680px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">نام هتل</th>
                          <th className="py-3 px-4">شهر و کشور</th>
                          <th className="py-3 px-4">درجه ستاره</th>
                          <th className="py-3 px-4">شروع قیمت هر شب</th>
                          <th className="py-3 px-4 text-left">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs">
                        {hotels.map((hotel) => (
                          <tr key={hotel.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#0F4C81] shrink-0" />
                              <span>{hotel.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {hotel.city} · {hotel.country}
                            </td>
                            <td className="py-3.5 px-4 text-amber-600 font-semibold">
                              {toPersianDigits(hotel.stars)} ستاره
                            </td>
                            <td className="py-3.5 px-4 font-semibold tabular-nums text-slate-900">
                              {formatToman(hotel.pricePerNight)}
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <button
                                type="button"
                                onClick={() => onDeleteHotel(hotel.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="حذف هتل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* CMS Site Texts + Hajj & Pilgrimage API Configuration */}
              {cmsSubTab === 'hajj' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
                      ویرایش متون اصلی صفحه نخست وب‌سایت
                    </h2>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        تیتر اصلی هیرو (صفحه اول)
                      </label>
                      <input
                        type="text"
                        value={cmsSettings.heroTitle}
                        onChange={(e) => onUpdateCmsSettings({ heroTitle: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        توضیح زیرتیتر هیرو
                      </label>
                      <textarea
                        rows={3}
                        value={cmsSettings.heroSubtitle}
                        onChange={(e) => onUpdateCmsSettings({ heroSubtitle: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        متن اطلاعیه کاروان‌ها (نمایش در صفحه تورها)
                      </label>
                      <input
                        type="text"
                        value={cmsSettings.announcementText}
                        onChange={(e) =>
                          onUpdateCmsSettings({ announcementText: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                      />
                    </div>
                  </section>

                  <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h2 className="text-sm font-bold text-slate-900">
                        تنظیمات وب‌سرویس (API) سازمان حج و زیارت 🕋
                      </h2>
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${
                          cmsSettings.hajjApiConnected
                            ? 'text-emerald-700'
                            : 'text-red-700'
                        }`}
                      >
                        {cmsSettings.hajjApiConnected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            متصل
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            قطع
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        کد دفتر کارگزاری رسمی حج و زیارت
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={cmsSettings.hajjOfficeCode}
                        onChange={(e) =>
                          onUpdateCmsSettings({ hajjOfficeCode: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        آدرس نقطه پایانی وب‌سرویس (API Endpoint)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={cmsSettings.hajjApiEndpoint}
                        onChange={(e) =>
                          onUpdateCmsSettings({ hajjApiEndpoint: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                      />
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                      <span>آخرین همگام‌سازی ظرفیت کاروان‌ها:</span>
                      <span className="font-semibold text-slate-900">
                        {cmsSettings.hajjLastSync}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleSyncHajjApi}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${syncingHajj ? 'animate-spin' : ''}`}
                        />
                        {syncingHajj ? 'در حال استعلام...' : 'همگام‌سازی فوری ظرفیت‌ها'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCmsSettings({
                            hajjApiConnected: !cmsSettings.hajjApiConnected,
                          })
                        }
                        className={`px-4 py-2.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                          cmsSettings.hajjApiConnected
                            ? 'text-red-700 border-red-200 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {cmsSettings.hajjApiConnected ? 'قطع موقت اتصال' : 'برقراری اتصال'}
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Caravans & Passengers */}
          {activeTab === 'caravans' && (
            <CaravansModule
              caravans={caravans}
              passengers={passengers}
              onAddPassenger={onAddPassenger}
              onAddCaravan={onAddCaravan}
              onTransferToTicketing={handleTransferToTicketing}
              onViewIssuedTicket={handleViewIssuedTicket}
            />
          )}

          {/* TAB 4: Flight E-Ticket Issuance */}
          {activeTab === 'ticketing' && (
            <TicketingModule
              caravans={caravans}
              passengers={passengers}
              issuedTickets={issuedTickets}
              selectedPassengerForIssue={selectedPassengerForIssue}
              selectedTicketToPreview={selectedTicketToPreview}
              onClearPreselected={() => {
                setSelectedPassengerForIssue(null);
                setSelectedTicketToPreview(null);
              }}
              onIssueTicket={onIssueTicket}
            />
          )}

          {/* TAB 5: Caravan Accounting & Partners */}
          {activeTab === 'accounting' && (
            <AccountingModule
              caravans={caravans}
              passengers={passengers}
              partners={partners}
              onUpdateCaravanFinance={onUpdateCaravanFinance}
              onAddPartnerTransaction={onAddPartnerTransaction}
            />
          )}
        </main>
      </div>

      {/* Add Tour CMS Modal */}
      {showAddTourModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">افزودن تور جدید به وب‌سایت</h3>
              <button
                type="button"
                onClick={() => setShowAddTourModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTourSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">عنوان تور</label>
                <input
                  type="text"
                  required
                  value={newTourTitle}
                  onChange={(e) => setNewTourTitle(e.target.value)}
                  placeholder="مثال: تور هوایی ویژه نجف و کربلا (۵ شب)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">مقصد</label>
                  <input
                    type="text"
                    required
                    value={newTourDest}
                    onChange={(e) => setNewTourDest(e.target.value)}
                    placeholder="کربلا / مشهد / استانبول"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی</label>
                  <select
                    value={newTourCategory}
                    onChange={(e) => setNewTourCategory(e.target.value as TourCategory)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="pilgrimage">زیارتی</option>
                    <option value="domestic">داخلی</option>
                    <option value="international">خارجی</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تعداد شب اقامت
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={newTourNights}
                    onChange={(e) => setNewTourNights(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    قیمت پایه (تومان)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={newTourPrice}
                    onChange={(e) => setNewTourPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ایرلاین</label>
                  <input
                    type="text"
                    value={newTourAirline}
                    onChange={(e) => setNewTourAirline(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نام هتل</label>
                  <input
                    type="text"
                    value={newTourHotel}
                    onChange={(e) => setNewTourHotel(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTourIsHajj}
                  onChange={(e) => setNewTourIsHajj(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
                انتشار در بخش «تورهای رسمی سازمان حج و زیارت 🕋»
              </label>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddTourModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  انتشار در سایت مشتریان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Hotel CMS Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">افزودن هتل جدید به وب‌سایت</h3>
              <button
                type="button"
                onClick={() => setShowAddHotelModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHotelSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نام هتل</label>
                <input
                  type="text"
                  required
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  placeholder="مثال: هتل ۵ ستاره قصر طلایی مشهد"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">شهر</label>
                  <input
                    type="text"
                    required
                    value={newHotelCity}
                    onChange={(e) => setNewHotelCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">تعداد ستاره</label>
                  <select
                    value={newHotelStars}
                    onChange={(e) => setNewHotelStars(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value={5}>۵ ستاره</option>
                    <option value={4}>۴ ستاره</option>
                    <option value={3}>۳ ستاره</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شروع قیمت هر شب (تومان)
                </label>
                <input
                  type="number"
                  dir="ltr"
                  value={newHotelPrice}
                  onChange={(e) => setNewHotelPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس هتل</label>
                <input
                  type="text"
                  value={newHotelAddress}
                  onChange={(e) => setNewHotelAddress(e.target.value)}
                  placeholder="خیابان امام رضا (ع)..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddHotelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  افزودن به سایت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

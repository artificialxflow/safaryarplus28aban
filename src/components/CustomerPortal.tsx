import React, { useState, useMemo } from 'react';
import {
  Search,
  Menu,
  X,
  Star,
  MapPin,
  Plane,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Clock,
  ArrowRight,
  Building2,
  Users,
  Send,
  FileSearch,
} from 'lucide-react';
import {
  CmsSettings,
  CustomerBooking,
  CustomerPage,
  Hotel,
  HotelRoom,
  Tour,
} from '../types';
import { IMAGES, TEAM_MEMBERS, TESTIMONIALS } from '../data/mockData';
import { formatToman, toPersianDigits } from '../utils/format';
import { SafeImage } from './SafeImage';

interface CustomerPortalProps {
  tours: Tour[];
  hotels: Hotel[];
  cmsSettings: CmsSettings;
  bookings: CustomerBooking[];
  onCreateTourBooking: (payload: {
    tour: Tour;
    departureDate: string;
    customerName: string;
    latinName: string;
    nationalId: string;
    passportNumber: string;
    phone: string;
    guests: number;
    totalPrice: number;
  }) => CustomerBooking;
  onCreateHotelBooking: (payload: {
    hotel: Hotel;
    room: HotelRoom;
    checkInDate: string;
    nights: number;
    customerName: string;
    nationalId: string;
    phone: string;
  }) => CustomerBooking;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  tours,
  hotels,
  cmsSettings,
  bookings,
  onCreateTourBooking,
  onCreateHotelBooking,
}) => {
  const [page, setPage] = useState<CustomerPage>('home');
  const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id || '');
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero Smart Search state
  const [heroOrigin, setHeroOrigin] = useState('تهران');
  const [heroDest, setHeroDest] = useState('');
  const [heroDate, setHeroDate] = useState('۱۴۰۵/۰۹/۰۵');
  const [heroGuests, setHeroGuests] = useState(2);

  // Tours page filters
  const [tourTab, setTourTab] = useState<'all' | 'agency' | 'hajj' | 'domestic' | 'international'>('all');
  const [tourSearch, setTourSearch] = useState('');
  const [tourMaxPrice, setTourMaxPrice] = useState<number>(60000000);

  // Hotels page filters
  const [hotelCityFilter, setHotelCityFilter] = useState<string>('همه شهرها');
  const [hotelStarFilter, setHotelStarFilter] = useState<number>(0);
  const [hotelMaxPrice, setHotelMaxPrice] = useState<number>(15000000);

  // Tour Detail interactive booking state
  const [activeTourImage, setActiveTourImage] = useState<string>('');
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
  const [bookName, setBookName] = useState('');
  const [bookLatinName, setBookLatinName] = useState('');
  const [bookNationalId, setBookNationalId] = useState('');
  const [bookPassport, setBookPassport] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookGuests, setBookGuests] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState<CustomerBooking | null>(null);

  // Hotel Detail room booking modal
  const [activeHotelImage, setActiveHotelImage] = useState<string>('');
  const [bookingRoom, setBookingRoom] = useState<HotelRoom | null>(null);
  const [hotelCheckIn, setHotelCheckIn] = useState('۱۴۰۵/۰۹/۱۰');
  const [hotelNights, setHotelNights] = useState(3);
  const [hotelGuestName, setHotelGuestName] = useState('');
  const [hotelGuestNationalId, setHotelGuestNationalId] = useState('');
  const [hotelGuestPhone, setHotelGuestPhone] = useState('');
  const [hotelBookingSuccess, setHotelBookingSuccess] = useState<CustomerBooking | null>(null);

  // Reservation Tracking Modal
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<CustomerBooking | null | 'not-found'>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('مشاوره رزرو تور و کاروان');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const navigate = (nextPage: CustomerPage) => {
    setPage(nextPage);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTourDetail = (tour: Tour) => {
    setSelectedTourId(tour.id);
    setActiveTourImage(tour.image);
    setSelectedDepartureId(tour.departures[0]?.id || '');
    setBookingSuccess(null);
    navigate('tour-detail');
  };

  const openHotelDetail = (hotel: Hotel) => {
    setSelectedHotelId(hotel.id);
    setActiveHotelImage(hotel.image);
    setBookingRoom(null);
    setHotelBookingSuccess(null);
    navigate('hotel-detail');
  };

  const currentTour = useMemo(
    () => tours.find((t) => t.id === selectedTourId) || tours[0],
    [tours, selectedTourId]
  );

  const currentHotel = useMemo(
    () => hotels.find((h) => h.id === selectedHotelId) || hotels[0],
    [hotels, selectedHotelId]
  );

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (tourTab === 'agency' && t.isHajjOfficial) return false;
      if (tourTab === 'hajj' && !t.isHajjOfficial) return false;
      if (tourTab === 'domestic' && t.category !== 'domestic') return false;
      if (tourTab === 'international' && t.category !== 'international') return false;
      if (t.price > tourMaxPrice) return false;
      if (tourSearch.trim()) {
        const q = tourSearch.trim().toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.hotelName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tours, tourTab, tourMaxPrice, tourSearch]);

  const agencyTours = useMemo(
    () => filteredTours.filter((t) => !t.isHajjOfficial),
    [filteredTours]
  );
  const hajjTours = useMemo(
    () => filteredTours.filter((t) => t.isHajjOfficial),
    [filteredTours]
  );

  const hotelCities = useMemo(
    () => ['همه شهرها', ...Array.from(new Set(hotels.map((h) => h.city)))],
    [hotels]
  );

  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (hotelCityFilter !== 'همه شهرها' && h.city !== hotelCityFilter) return false;
      if (hotelStarFilter > 0 && h.stars !== hotelStarFilter) return false;
      if (h.pricePerNight > hotelMaxPrice) return false;
      return true;
    });
  }, [hotels, hotelCityFilter, hotelStarFilter, hotelMaxPrice]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTourSearch(heroDest);
    setTourTab('all');
    navigate('tours');
  };

  const handleTourBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTour || !bookName.trim() || !bookNationalId.trim() || !bookPhone.trim()) return;
    const departure =
      currentTour.departures.find((d) => d.id === selectedDepartureId) ||
      currentTour.departures[0];
    const unitPrice = departure ? departure.doublePrice : currentTour.price;
    const created = onCreateTourBooking({
      tour: currentTour,
      departureDate: departure?.date || '۱۴۰۵/۰۹/۰۵',
      customerName: bookName.trim(),
      latinName: (bookLatinName.trim() || 'TRAVELER SAFARYAR').toUpperCase(),
      nationalId: bookNationalId.trim(),
      passportNumber: (bookPassport.trim() || 'N84920112').toUpperCase(),
      phone: bookPhone.trim(),
      guests: bookGuests,
      totalPrice: unitPrice * bookGuests,
    });
    setBookingSuccess(created);
    setBookName('');
    setBookLatinName('');
    setBookNationalId('');
    setBookPassport('');
    setBookPhone('');
  };

  const handleHotelBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotel || !bookingRoom || !hotelGuestName.trim() || !hotelGuestPhone.trim()) return;
    const created = onCreateHotelBooking({
      hotel: currentHotel,
      room: bookingRoom,
      checkInDate: hotelCheckIn,
      nights: hotelNights,
      customerName: hotelGuestName.trim(),
      nationalId: hotelGuestNationalId.trim() || '0012345678',
      phone: hotelGuestPhone.trim(),
    });
    setHotelBookingSuccess(created);
    setBookingRoom(null);
    setHotelGuestName('');
    setHotelGuestNationalId('');
    setHotelGuestPhone('');
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = trackingInput.trim().toUpperCase();
    if (!q) return;
    const found = bookings.find(
      (b) => b.trackingCode.toUpperCase() === q || b.nationalId === trackingInput.trim()
    );
    setTrackingResult(found || 'not-found');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactMessage.trim()) return;
    setContactSubmitted(true);
    setContactName('');
    setContactPhone('');
    setContactMessage('');
  };

  const navLinks: { id: CustomerPage; label: string }[] = [
    { id: 'home', label: 'صفحه اصلی' },
    { id: 'tours', label: 'تورها' },
    { id: 'hotels', label: 'هتل‌ها' },
    { id: 'about', label: 'درباره ما' },
    { id: 'contact', label: 'تماس با ما' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Strict 3-Zone Top Bar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-10 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="text-xl font-extrabold tracking-tight text-[#0F4C81] whitespace-nowrap shrink-0 cursor-pointer"
          >
            سفریار پلاس
          </button>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navLinks.map((link) => {
              const isActive =
                page === link.id ||
                (link.id === 'tours' && page === 'tour-detail') ||
                (link.id === 'hotels' && page === 'hotel-detail');
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-[#0F4C81] font-bold border-[#0F4C81]'
                      : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA + Mobile Drawer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTrackingResult(null);
                setShowTrackingModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              پیگیری رزرو
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="منوی سایت"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Slide-Out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[82vw] bg-white h-full border-l border-slate-200 flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-base font-extrabold text-[#0F4C81]">سفریار پلاس</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1 flex-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.id)}
                  className={`w-full text-right px-4 py-3 text-sm font-medium rounded-lg cursor-pointer ${
                    page === link.id
                      ? 'bg-[#0F4C81] text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              پشتیبانی ۲۴ ساعته: ۰۲۱-۸۸۹۰۴۵۰۰
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pages */}
      <main className="flex-1">
        {/* ==================== PAGE 1: HOME ==================== */}
        {page === 'home' && (
          <div>
            {/* Cinematic Hero Section + Smart Search Box */}
            <section className="relative bg-[#0B2942] text-white overflow-hidden">
              <div className="absolute inset-0">
                <SafeImage
                  src={IMAGES.hero}
                  alt="پرواز هوایی سفریار پلاس بر فراز ابرها در غروب آفتاب"
                  className="w-full h-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-[#081F36]/95 via-[#0B2942]/80 to-[#0B2942]/55" />
              </div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
                <div className="max-w-3xl space-y-5">
                  <div className="text-xs sm:text-sm font-medium text-amber-300 flex flex-wrap items-center gap-2">
                    <span>مجوز رسمی بند الف و ب</span>
                    <span aria-hidden="true">·</span>
                    <span>کارگزار رسمی سازمان حج و زیارت 🕋</span>
                    <span aria-hidden="true">·</span>
                    <span>صدور آنی بلیت</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[2.9rem] font-extrabold leading-[1.3] text-balance">
                    {cmsSettings.heroTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                    {cmsSettings.heroSubtitle}
                  </p>
                </div>

                {/* Smart Tour & Flight Search Bar */}
                <form
                  onSubmit={handleHeroSearch}
                  className="mt-10 bg-white text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-lg"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                    <div className="lg:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        شهر مبدا
                      </label>
                      <select
                        value={heroOrigin}
                        onChange={(e) => setHeroOrigin(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                      >
                        <option value="تهران">تهران (IKA / THR)</option>
                        <option value="مشهد">مشهد مقدس (MHD)</option>
                        <option value="اصفهان">اصفهان (IFN)</option>
                        <option value="شیراز">شیراز (SYZ)</option>
                      </select>
                    </div>
                    <div className="lg:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        مقصد سفر (تور یا پرواز)
                      </label>
                      <input
                        type="text"
                        value={heroDest}
                        onChange={(e) => setHeroDest(e.target.value)}
                        placeholder="کربلا، مشهد، استانبول، دبی..."
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        تاریخ حرکت
                      </label>
                      <input
                        type="text"
                        value={heroDate}
                        onChange={(e) => setHeroDate(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        تعداد مسافر
                      </label>
                      <select
                        value={heroGuests}
                        onChange={(e) => setHeroGuests(Number(e.target.value))}
                        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {toPersianDigits(n)} مسافر
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        جستجوی تور
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            {/* Category Quick Strip */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTourTab('hajj');
                    navigate('tours');
                  }}
                  className="text-right p-5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="text-lg font-extrabold text-emerald-700">
                    🕋 تورهای رسمی حج و زیارت
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    کاروان‌های عتبات عالیات و مشهد متصل به وب‌سرویس رسمی سازمان حج و زیارت
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTourTab('domestic');
                    navigate('tours');
                  }}
                  className="text-right p-5 bg-white border border-slate-200 hover:border-[#0F4C81] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="text-lg font-extrabold text-[#0F4C81]">تورهای داخلی و کیش</div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    اقامت در هتل‌های ۵ ستاره مشهد و جزیره کیش با پروازهای مستقیم ماهان و کیش‌ایر
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTourTab('international');
                    navigate('tours');
                  }}
                  className="text-right p-5 bg-white border border-slate-200 hover:border-[#0F4C81] rounded-xl transition-colors cursor-pointer"
                >
                  <div className="text-lg font-extrabold text-slate-900">
                    تورهای خارجی و ویزا
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    پکیج‌های استانبول، دبی و مقاصد محبوب با اخذ ویزای فوری و بیمه سامان
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('hotels')}
                  className="text-right p-5 bg-white border border-slate-200 hover:border-amber-500 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="text-lg font-extrabold text-amber-700">
                    رزرو مستقیم هتل‌های برتر
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    تضمین نرخ مستقیم هتل درویشی، رویال کربلا، سی‌وی‌کی تکسیم و جمیرا دبی
                  </p>
                </button>
              </div>
            </section>

            {/* Featured & Special Offers Tours */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    پیشنهادهای ویژه و تورهای برگزیده فصل
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    به‌روزرسانی مستقیم از سامانه مدیریت محتوای سفریار پلاس با ظرفیت لحظه‌ای
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTourTab('all');
                    navigate('tours');
                  }}
                  className="text-sm font-bold text-[#0F4C81] hover:underline cursor-pointer whitespace-nowrap"
                >
                  مشاهده همه تورها ({toPersianDigits(tours.length)}) ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {tours.slice(0, 4).map((tour) => (
                  <article
                    key={tour.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <SafeImage
                        src={tour.image}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={
                              tour.isHajjOfficial
                                ? 'text-emerald-700 font-bold'
                                : 'text-[#0F4C81] font-semibold'
                            }
                          >
                            {tour.isHajjOfficial ? '🕋 رسمی حج و زیارت' : 'تور ویژه آژانس'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{toPersianDigits(tour.durationNights)} شب</span>
                          <span aria-hidden="true">·</span>
                          <span>{tour.airline}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                          {tour.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {tour.hotelName}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                        <div>
                          {tour.originalPrice && (
                            <div className="text-[11px] text-slate-400 line-through tabular-nums">
                              {formatToman(tour.originalPrice)}
                            </div>
                          )}
                          <div className="text-sm font-extrabold text-[#0F4C81] tabular-nums">
                            {formatToman(tour.price)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openTourDetail(tour)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          جزئیات و رزرو
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Top Hotels Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">هتل‌های برتر طرف قرارداد</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    گارانتی مستقیم اتاق با بهترین موقعیت مکانی در مشهد، کربلا، استانبول و دبی
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('hotels')}
                  className="text-sm font-bold text-[#0F4C81] hover:underline cursor-pointer whitespace-nowrap"
                >
                  مشاهده تمام هتل‌ها ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {hotels.slice(0, 4).map((hotel) => (
                  <article
                    key={hotel.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                      <SafeImage
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span>{hotel.city}</span>
                          <span>·</span>
                          <span className="text-amber-600 font-semibold">
                            {toPersianDigits(hotel.stars)} ستاره
                          </span>
                          <span>·</span>
                          <span className="tabular-nums">
                            امتیاز {toPersianDigits(hotel.rating)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">{hotel.name}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {hotel.distanceNote}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-500">شروع قیمت هر شب</div>
                          <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                            {formatToman(hotel.pricePerNight)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openHotelDetail(hotel)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#0F4C81] bg-[#0F4C81]/10 hover:bg-[#0F4C81]/15 rounded-lg whitespace-nowrap cursor-pointer"
                        >
                          مشاهده اتاق‌ها
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Traveler Testimonials (Claim-to-Proof Adjacency) */}
            <section className="bg-white border-y border-slate-200 py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="max-w-2xl mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    تجربه مستند مسافران و زائران سفریار پلاس
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    بر اساس ۴۸٬۵۰۰ مسافر اعزام‌شده در ۱۸ سال فعالیت رسمی با نرخ رضایت ۹۸.۴ درصد
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {TESTIMONIALS.map((rev) => (
                    <blockquote
                      key={rev.id}
                      className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-xl flex flex-col justify-between gap-5"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">«{rev.quote}»</p>
                      <footer className="pt-4 border-t border-slate-200">
                        <div className="text-sm font-bold text-slate-900">{rev.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {rev.role} · {rev.destination}
                        </div>
                      </footer>
                    </blockquote>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== PAGE 2: TOURS LISTING ==================== */}
        {page === 'tours' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            {/* Announcement strip from CMS */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="font-semibold">🕋 {cmsSettings.announcementText}</div>
              <div className="text-emerald-700 font-medium">
                وضعیت وب‌سرویس حج و زیارت:{' '}
                {cmsSettings.hajjApiConnected ? 'متصل و برخط' : 'در حال به‌روزرسانی'}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-xl font-extrabold text-slate-900">
                  فهرست تورهای زیارتی، داخلی و خارجی
                </h1>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(
                    [
                      { id: 'all', label: 'همه تورها' },
                      { id: 'agency', label: 'تورهای ویژه آژانس' },
                      { id: 'hajj', label: '🕋 رسمی حج و زیارت' },
                      { id: 'domestic', label: 'داخلی' },
                      { id: 'international', label: 'خارجی' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTourTab(tab.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        tourTab === tab.id
                          ? 'bg-white text-[#0F4C81] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tourSearch}
                    onChange={(e) => setTourSearch(e.target.value)}
                    placeholder="جستجوی مقصد، نام تور یا هتل..."
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0F4C81]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    سقف بودجه:
                  </label>
                  <select
                    value={tourMaxPrice}
                    onChange={(e) => setTourMaxPrice(Number(e.target.value))}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value={60000000}>همه قیمت‌ها</option>
                    <option value={18000000}>تا ۱۸ میلیون تومان</option>
                    <option value={30000000}>تا ۳۰ میلیون تومان</option>
                    <option value={45000000}>تا ۴۵ میلیون تومان</option>
                  </select>
                </div>
                <div className="flex items-center justify-end text-xs text-slate-500 tabular-nums">
                  تعداد نتایج یافت‌شده: {toPersianDigits(filteredTours.length)} تور
                </div>
              </div>
            </div>

            {/* Section A: Official Hajj & Pilgrimage Organization Tours */}
            {hajjTours.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200">
                  <div>
                    <h2 className="text-lg font-extrabold text-emerald-800">
                      🕋 تورهای رسمی سازمان حج و زیارت (متصل به وب‌سرویس)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      دارای کد کارگزاری رسمی {cmsSettings.hajjOfficeCode} و پوشش بیمه و نرخ مصوب
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {hajjTours.map((tour) => (
                    <article
                      key={tour.id}
                      className="bg-white border border-emerald-200 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-slate-100">
                        <SafeImage
                          src={tour.image}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
                        <div>
                          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 flex-wrap">
                            <span>کد گروه حج: {tour.hajjGroupCode || tour.code}</span>
                            <span>·</span>
                            <span>{toPersianDigits(tour.durationNights)} شب</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1.5">
                            {tour.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {tour.summary}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] text-slate-500">نرخ مصوب هر نفر</div>
                            <div className="text-base font-extrabold text-emerald-700 tabular-nums">
                              {formatToman(tour.price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openTourDetail(tour)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap cursor-pointer"
                          >
                            رزرو آنلاین
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Section B: Agency Special Tours */}
            {agencyTours.length > 0 && (
              <section className="space-y-4">
                <div className="pb-2 border-b border-slate-200">
                  <h2 className="text-lg font-extrabold text-[#0F4C81]">
                    تورهای ویژه آژانس سفریار پلاس (داخلی و خارجی)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    پروازهای سیستمی و چارتری معتبر به همراه هتل‌های گارانتی‌شده
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {agencyTours.map((tour) => (
                    <article
                      key={tour.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-slate-100">
                        <SafeImage
                          src={tour.image}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>{tour.destination}</span>
                            <span>·</span>
                            <span>{toPersianDigits(tour.durationNights)} شب</span>
                            <span>·</span>
                            <span>{tour.airline}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                            {tour.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {tour.summary}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
                          <div>
                            {tour.originalPrice && (
                              <div className="text-[11px] text-slate-400 line-through tabular-nums">
                                {formatToman(tour.originalPrice)}
                              </div>
                            )}
                            <div className="text-sm font-extrabold text-[#0F4C81] tabular-nums">
                              {formatToman(tour.price)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openTourDetail(tour)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg whitespace-nowrap cursor-pointer"
                          >
                            مشاهده و رزرو
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {filteredTours.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                <p className="text-sm text-slate-600">توری با فیلترهای انتخاب‌شده یافت نشد.</p>
                <button
                  type="button"
                  onClick={() => {
                    setTourTab('all');
                    setTourSearch('');
                    setTourMaxPrice(60000000);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] rounded-lg cursor-pointer"
                >
                  بازنشانی فیلترها
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== PAGE 3: TOUR DETAIL ==================== */}
        {page === 'tour-detail' && currentTour && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <button
              type="button"
              onClick={() => navigate('tours')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به لیست تورها
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left/Main Column: Gallery, Services, Itinerary, Departures */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="aspect-[16/9] bg-slate-100">
                    <SafeImage
                      src={activeTourImage || currentTour.image}
                      alt={currentTour.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {currentTour.gallery.length > 1 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5 overflow-x-auto">
                      {currentTour.gallery.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveTourImage(img)}
                          className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                            (activeTourImage || currentTour.image) === img
                              ? 'border-[#0F4C81]'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <SafeImage src={img} alt={`تصویر ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title & Unboxed Metadata */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular font-semibold text-[#0F4C81]">
                      کد تور: {currentTour.code}
                    </span>
                    <span>·</span>
                    <span>
                      {currentTour.isHajjOfficial
                        ? '🕋 کاروان رسمی سازمان حج و زیارت'
                        : 'تور اختصاصی سفریار پلاس'}
                    </span>
                    <span>·</span>
                    <span>
                      {toPersianDigits(currentTour.durationNights)} شب و{' '}
                      {toPersianDigits(currentTour.durationDays)} روز
                    </span>
                    <span>·</span>
                    <span>{currentTour.airline}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{currentTour.title}</h1>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentTour.summary}</p>
                </div>

                {/* Services */}
                <section className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-base font-bold text-slate-900 mb-4">خدمات کامل این تور</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                    {currentTour.services.map((srv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Day-by-Day Itinerary Timeline */}
                <section className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-base font-bold text-slate-900 mb-5">
                    برنامه سفر روزبه‌روز
                  </h2>
                  <div className="space-y-5">
                    {currentTour.itinerary.map((step) => (
                      <div
                        key={step.day}
                        className="flex items-start gap-4 pb-5 border-b border-slate-100 last:border-b-0 last:pb-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] font-extrabold text-xs flex items-center justify-center shrink-0 tabular-nums">
                          روز {toPersianDigits(step.day)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Departure Dates & Pricing Table */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">
                      جدول تاریخ‌های حرکت و قیمت اتاق‌ها
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[600px] text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <th className="py-3 px-4">انتخاب</th>
                          <th className="py-3 px-4">تاریخ حرکت</th>
                          <th className="py-3 px-4">ایرلاین</th>
                          <th className="py-3 px-4">اتاق دوتخته (هر نفر)</th>
                          <th className="py-3 px-4">اتاق یک‌تخته</th>
                          <th className="py-3 px-4">ظرفیت باقی‌مانده</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {currentTour.departures.map((dep) => {
                          const selected =
                            (selectedDepartureId || currentTour.departures[0]?.id) === dep.id;
                          return (
                            <tr
                              key={dep.id}
                              onClick={() => setSelectedDepartureId(dep.id)}
                              className={`cursor-pointer ${
                                selected ? 'bg-[#0F4C81]/5' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <input
                                  type="radio"
                                  checked={selected}
                                  onChange={() => setSelectedDepartureId(dep.id)}
                                  className="accent-[#0F4C81]"
                                />
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                                {dep.date}
                              </td>
                              <td className="py-3 px-4 text-slate-700">{dep.airline}</td>
                              <td className="py-3 px-4 font-bold text-[#0F4C81] tabular-nums">
                                {formatToman(dep.doublePrice)}
                              </td>
                              <td className="py-3 px-4 text-slate-700 tabular-nums">
                                {formatToman(dep.singlePrice)}
                              </td>
                              <td className="py-3 px-4 font-semibold text-emerald-700 tabular-nums">
                                {toPersianDigits(dep.remainingSeats)} صندلی
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Sticky Quick Online Booking Form */}
              <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 lg:sticky lg:top-28 space-y-4">
                <div className="pb-4 border-b border-slate-200">
                  <div className="text-xs text-slate-500">شروع قیمت هر نفر در اتاق دوتخته</div>
                  <div className="text-2xl font-extrabold text-[#0F4C81] mt-1 tabular-nums">
                    {formatToman(
                      currentTour.departures.find((d) => d.id === selectedDepartureId)
                        ?.doublePrice || currentTour.price
                    )}
                  </div>
                </div>

                {bookingSuccess ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      رزرو شما با موفقیت ثبت شد!
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      مشخصات شما به‌صورت خودکار در لیست کاروان پنل مدیریت ثبت و در صف صدور بلیت قرار گرفت.
                    </p>
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
                      <div>
                        کد رهگیری:{' '}
                        <span className="font-mono-tabular font-bold text-[#0F4C81]">
                          {bookingSuccess.trackingCode}
                        </span>
                      </div>
                      <div>مبلغ کل: {formatToman(bookingSuccess.totalPrice)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingSuccess(null)}
                      className="w-full py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg cursor-pointer"
                    >
                      ثبت رزرو جدید
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTourBookingSubmit} className="space-y-3.5">
                    <h3 className="text-sm font-bold text-slate-900">فرم رزرو آنلاین تور</h3>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        نام و نام خانوادگی مسافر *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookName}
                        onChange={(e) => setBookName(e.target.value)}
                        placeholder="نام کامل مطابق شناسنامه"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        نام لاتین (مطابق گذرنامه)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={bookLatinName}
                        onChange={(e) => setBookLatinName(e.target.value.toUpperCase())}
                        placeholder="ALI REZAEI"
                        className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          کد ملی *
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          required
                          value={bookNationalId}
                          onChange={(e) =>
                            setBookNationalId(e.target.value.replace(/[^\d]/g, '').slice(0, 10))
                          }
                          placeholder="0071234567"
                          className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          شماره پاسپورت
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={bookPassport}
                          onChange={(e) =>
                            setBookPassport(e.target.value.toUpperCase().slice(0, 10))
                          }
                          placeholder="N58291042"
                          className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          شماره تماس *
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          required
                          value={bookPhone}
                          onChange={(e) =>
                            setBookPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))
                          }
                          placeholder="09123456789"
                          className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          تعداد نفرات
                        </label>
                        <select
                          value={bookGuests}
                          onChange={(e) => setBookGuests(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {toPersianDigits(n)} نفر
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-slate-600">مبلغ قابل پرداخت:</span>
                      <span className="font-extrabold text-[#0F4C81] tabular-nums">
                        {formatToman(
                          (currentTour.departures.find((d) => d.id === selectedDepartureId)
                            ?.doublePrice || currentTour.price) * bookGuests
                        )}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
                    >
                      ثبت نهایی رزرو آنلاین
                    </button>
                  </form>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* ==================== PAGE 4: HOTELS LISTING ==================== */}
        {page === 'hotels' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h1 className="text-xl font-extrabold text-slate-900">
                رزرو آنلاین هتل‌های منتخب داخلی و خارجی
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">شهر</label>
                  <select
                    value={hotelCityFilter}
                    onChange={(e) => setHotelCityFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {hotelCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    درجه هتل
                  </label>
                  <select
                    value={hotelStarFilter}
                    onChange={(e) => setHotelStarFilter(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value={0}>همه ستاره‌ها</option>
                    <option value={5}>۵ ستاره لوکس</option>
                    <option value={4}>۴ ستاره ممتاز</option>
                    <option value={3}>۳ ستاره</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    سقف قیمت هر شب
                  </label>
                  <select
                    value={hotelMaxPrice}
                    onChange={(e) => setHotelMaxPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value={15000000}>همه قیمت‌ها</option>
                    <option value={5000000}>تا ۵ میلیون تومان</option>
                    <option value={9000000}>تا ۹ میلیون تومان</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredHotels.map((hotel) => (
                <article
                  key={hotel.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-slate-100">
                    <SafeImage
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>
                          {hotel.city}، {hotel.country}
                        </span>
                        <span>·</span>
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {toPersianDigits(hotel.stars)} ستاره
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 mt-2">{hotel.name}</h2>
                      <p className="text-xs text-slate-600 mt-1.5">{hotel.distanceNote}</p>
                      <div className="mt-3 text-[11px] text-slate-500">
                        {hotel.amenities.slice(0, 3).join(' · ')}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] text-slate-500">شروع قیمت هر شب</div>
                        <div className="text-base font-extrabold text-[#0F4C81] tabular-nums">
                          {formatToman(hotel.pricePerNight)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openHotelDetail(hotel)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        مشاهده و رزرو اتاق
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ==================== PAGE 5: HOTEL DETAIL ==================== */}
        {page === 'hotel-detail' && currentHotel && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            <button
              type="button"
              onClick={() => navigate('hotels')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81] hover:underline cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به فهرست هتل‌ها
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="aspect-[16/9] bg-slate-100">
                    <SafeImage
                      src={activeHotelImage || currentHotel.image}
                      alt={currentHotel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                    {currentHotel.gallery.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveHotelImage(img)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 cursor-pointer ${
                          (activeHotelImage || currentHotel.image) === img
                            ? 'border-[#0F4C81]'
                            : 'border-transparent opacity-75'
                        }`}
                      >
                        <SafeImage src={img} alt="اتاق هتل" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="text-amber-600 font-bold">
                      {toPersianDigits(currentHotel.stars)} ستاره
                    </span>
                    <span>·</span>
                    <span>
                      امتیاز مسافران: {toPersianDigits(currentHotel.rating)} از ۵ (
                      {toPersianDigits(currentHotel.reviewCount)} نظر)
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{currentHotel.name}</h1>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {currentHotel.description}
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 mb-3">امکانات رفاهی هتل</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                      {currentHotel.amenities.map((am, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{am}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rooms Reservation Table */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900">جدول انتخاب و رزرو اتاق</h2>
                  </div>

                  {hotelBookingSuccess && (
                    <div className="m-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong>رزرو اتاق شما با موفقیت تأیید شد.</strong> کد رهگیری:{' '}
                        <span className="font-mono-tabular font-bold text-[#0F4C81]">
                          {hotelBookingSuccess.trackingCode}
                        </span>{' '}
                        · مبلغ کل: {formatToman(hotelBookingSuccess.totalPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setHotelBookingSuccess(null)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        بستن
                      </button>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[600px] text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                          <th className="py-3 px-4">نوع اتاق</th>
                          <th className="py-3 px-4">ظرفیت</th>
                          <th className="py-3 px-4">وعده غذایی</th>
                          <th className="py-3 px-4">قیمت هر شب</th>
                          <th className="py-3 px-4 text-left">رزرو</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {currentHotel.rooms.map((room) => (
                          <tr key={room.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{room.name}</td>
                            <td className="py-3.5 px-4 text-slate-700 tabular-nums">
                              {toPersianDigits(room.capacity)} نفر
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">{room.mealPlan}</td>
                            <td className="py-3.5 px-4 font-bold text-[#0F4C81] tabular-nums">
                              {formatToman(room.pricePerNight)}
                            </td>
                            <td className="py-3.5 px-4 text-left">
                              <button
                                type="button"
                                onClick={() => setBookingRoom(room)}
                                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer whitespace-nowrap"
                              >
                                انتخاب اتاق
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Location & Proximity Card */}
              <aside className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">موقعیت مکانی روی نقشه</h3>
                  <div className="aspect-[4/3] rounded-lg bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          'linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                      }}
                    />
                    <div className="relative z-10 bg-white border border-slate-300 shadow-sm rounded-xl px-4 py-3 text-center max-w-[85%]">
                      <MapPin className="w-6 h-6 text-[#0F4C81] mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-900">{currentHotel.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{currentHotel.city}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2">
                    <div className="font-semibold text-slate-900">{currentHotel.address}</div>
                    <div className="text-emerald-700 font-medium">{currentHotel.distanceNote}</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* ==================== PAGE 6: ABOUT US ==================== */}
        {page === 'about' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
            <section className="max-w-3xl space-y-4">
              <div className="text-xs font-semibold text-[#0F4C81]">
                درباره شرکت خدمات مسافرت هوایی و گردشگری سفریار پلاس
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 text-balance">
                هجده سال تجربه تخصصی در اعزام کاروان‌های زیارتی، تورهای لوکس و فروش بلیت هواپیما
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                شرکت سفریار پلاس از سال ۱۳۸۷ با هدف شفاف‌سازی فرآیند رزرواسیون و یکپارچه‌سازی خدمات
                پروازی، هتلداری و اعزام زائران فعالیت خود را آغاز کرد. امروز تمامی عملیات صدور بلیت،
                کاروان‌ها و حسابداری ما بر بستر یک سامانه واحد و برخط انجام می‌شود.
              </p>
            </section>

            {/* Quantitative Proof Metrics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { value: '۱۸ سال', label: 'سابقه فعالیت رسمی در صنعت گردشگری' },
                { value: '۴۸٬۵۰۰+', label: 'مسافر و زائر اعزام‌شده در کاروان‌ها' },
                { value: '۹۸.۴٪', label: 'نرخ رضایت ثبت‌شده در نظرسنجی پس از سفر' },
                { value: '۱۴۵ کاروان', label: 'اعزام سالانه به عتبات، مشهد و مقاصد خارجی' },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="text-2xl font-extrabold text-[#0F4C81] tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 mt-1.5 leading-relaxed">{stat.label}</div>
                </div>
              ))}
            </section>

            {/* Official Licenses */}
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">مجوزها و اعتبارنامه‌های رسمی</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
                  <ShieldCheck className="w-7 h-7 text-[#0F4C81]" />
                  <h3 className="text-base font-bold text-slate-900">
                    مجوز بند «الف» سازمان هواپیمایی کشوری
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    دارای مجوز رسمی صدور بلیت کلیه ایرلاین‌های داخلی و خارجی و عضویت معتبر یاتا (IATA).
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
                  <Building2 className="w-7 h-7 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    مجوز بند «ب» وزارت میراث فرهنگی و گردشگری
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    اجرای تخصصی تورهای ورودی، داخلی و خارجی، رزرواسیون هتل‌های ۵ ستاره و خدمات ویزا.
                  </p>
                </div>
                <div className="bg-white border border-emerald-200 rounded-xl p-6 space-y-2.5">
                  <div className="text-2xl">🕋</div>
                  <h3 className="text-base font-bold text-emerald-800">
                    کارگزار رسمی سازمان حج و زیارت
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    متصل به سامانه جامع عتبات عالیات و حج با کد دفتر {cmsSettings.hajjOfficeCode}.
                  </p>
                </div>
              </div>
            </section>

            {/* Executive Team */}
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">تیم مدیریت و راهبری</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {TEAM_MEMBERS.map((member, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                    <div className="w-11 h-11 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] font-extrabold flex items-center justify-center">
                      {member.name.slice(0, 1)}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 pt-1">{member.name}</h3>
                    <div className="text-xs font-semibold text-[#0F4C81]">{member.role}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{member.experience}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== PAGE 7: CONTACT US ==================== */}
        {page === 'contact' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ارتباط با شعب و پشتیبانی ۲۴ ساعته سفریار پلاس
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                کارشناسان فروش تور، صدور بلیت و امور کاروان‌ها در تمام روزهای هفته پاسخگوی شما هستند.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Branches Info */}
              <div className="lg:col-span-5 space-y-4">
                {[
                  {
                    title: 'دفتر مرکزی تهران (میدان آرژانتین)',
                    address: 'تهران، خیابان بخارست (احمد قصیر)، کوچه دوازدهم، پلاک ۱۸، طبقه ۳',
                    phone: '۰۲۱-۸۸۹۰۴۵۰۰ (۱۰ خط ویژه)',
                    hours: 'شنبه تا چهارشنبه ۸:۳۰ تا ۱۸:۰۰ · پنج‌شنبه تا ۱۴:۰۰',
                  },
                  {
                    title: 'شعبه تخصصی زیارتی مشهد مقدس',
                    address: 'مشهد، خیابان امام رضا (ع)، نبش امام رضا ۱۴، مجتمع تجاری اطلس',
                    phone: '۰۵۱-۳۸۵۴۲۲۱۰',
                    hours: 'همه‌روزه ۹:۰۰ تا ۲۰:۰۰ (پاسخگویی حضوری زائران)',
                  },
                  {
                    title: 'نمایندگی رسمی اصفهان',
                    address: 'اصفهان، خیابان چهارباغ بالا، مجتمع اداری کوثر، واحد ۴۰۲',
                    phone: '۰۳۱-۳۶۲۸۹۱۰۰',
                    hours: 'شنبه تا پنج‌شنبه ۹:۰۰ تا ۱۷:۳۰',
                  },
                ].map((branch, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
                    <h2 className="text-sm font-bold text-[#0F4C81]">{branch.title}</h2>
                    <div className="text-xs text-slate-700 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="text-xs text-slate-900 font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span dir="ltr">{branch.phone}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{branch.hours}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Support Form */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">
                  ارسال پیام مستقیم به کارشناسان پشتیبانی
                </h2>

                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-emerald-900">
                      پیام شما با موفقیت ثبت شد
                    </h3>
                    <p className="text-xs text-emerald-800">
                      کارشناسان ما حداکثر ظرف ۳۰ دقیقه آینده با شماره تماس ثبت‌شده ارتباط خواهند گرفت.
                    </p>
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg cursor-pointer"
                    >
                      ارسال پیام دیگر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          نام و نام خانوادگی *
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="نام کامل شما"
                          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          شماره تماس *
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          required
                          value={contactPhone}
                          onChange={(e) =>
                            setContactPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))
                          }
                          placeholder="09123456789"
                          className="w-full px-3 py-2.5 text-sm font-mono-tabular border border-slate-300 rounded-lg text-left"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        موضوع درخواست
                      </label>
                      <select
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="مشاوره رزرو تور و کاروان">مشاوره رزرو تور و کاروان</option>
                        <option value="پیگیری صدور بلیت هواپیما">پیگیری صدور بلیت هواپیما</option>
                        <option value="همکاری آژانس‌ها و فروش گروهی">همکاری آژانس‌ها و فروش گروهی</option>
                        <option value="امور مالی و استرداد">امور مالی و استرداد</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        متن پیام *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="شرح سوال یا درخواست خود را بنویسید..."
                        className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4C81]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      ارسال پیام به پشتیبانی
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Quiet, Structured RTL Footer */}
      <footer className="bg-slate-900 text-slate-300 mt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-3">
            <div className="text-lg font-extrabold text-white">سفریار پلاس</div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              سامانه یکپارچه گردشگری، رزرواسیون تورهای زیارتی و سیاحتی، صدور آنی بلیت هواپیما و
              مدیریت مالی کاروان‌ها تحت نظارت سازمان هواپیمایی کشوری و سازمان حج و زیارت.
            </p>
            <div className="text-xs text-slate-400 pt-2">
              تلفن پشتیبانی ۲۴ ساعته: <span className="text-white font-semibold">۰۲۱-۸۸۹۰۴۵۰۰</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <div className="text-sm font-bold text-white">دسترسی سریع</div>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => navigate(link.id)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <div className="text-sm font-bold text-white">مجوزها و نمادهای اعتماد</div>
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center text-[11px]">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                <Plane className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                مجوز بند الف
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                حج و زیارت
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                <Users className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                نماد اعتماد
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © ۱۴۰۵ تمامی حقوق مادی و معنوی برای آژانس مسافرتی و هواپیمایی «سفریار پلاس» محفوظ است.
        </div>
      </footer>

      {/* Hotel Room Booking Modal */}
      {bookingRoom && currentHotel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                رزرو آنلاین — {bookingRoom.name}
              </h3>
              <button
                type="button"
                onClick={() => setBookingRoom(null)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleHotelBookingSubmit} className="p-5 space-y-3.5">
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="font-bold text-slate-900">{currentHotel.name}</div>
                <div className="mt-0.5">
                  {bookingRoom.mealPlan} · {formatToman(bookingRoom.pricePerNight)} هر شب
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تاریخ ورود
                  </label>
                  <input
                    type="text"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    تعداد شب
                  </label>
                  <select
                    value={hotelNights}
                    onChange={(e) => setHotelNights(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 7].map((n) => (
                      <option key={n} value={n}>
                        {toPersianDigits(n)} شب
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام مهمان اصلی *
                </label>
                <input
                  type="text"
                  required
                  value={hotelGuestName}
                  onChange={(e) => setHotelGuestName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">کد ملی</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={hotelGuestNationalId}
                    onChange={(e) => setHotelGuestNationalId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    موبایل *
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    value={hotelGuestPhone}
                    onChange={(e) => setHotelGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                <span>جمع کل اقامت:</span>
                <span className="font-extrabold text-[#0F4C81] tabular-nums">
                  {formatToman(bookingRoom.pricePerNight * hotelNights)}
                </span>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                تأیید و صدور واچر هتل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#0F4C81]" />
                <h3 className="text-sm font-bold text-slate-900">پیگیری آنلاین رزرو و بلیت</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <form onSubmit={handleTrackSearch} className="flex gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="کد رهگیری (مثلاً SY-4031) یا کد ملی"
                  className="flex-1 px-3 py-2 text-xs font-mono-tabular border border-slate-300 rounded-lg text-left"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0F4C81] hover:bg-[#0B3B66] rounded-lg whitespace-nowrap cursor-pointer"
                >
                  استعلام
                </button>
              </form>

              <div className="text-[11px] text-slate-500">
                کدهای نمونه فعال برای تست:{' '}
                <button
                  type="button"
                  onClick={() => setTrackingInput('SY-4031')}
                  className="font-mono-tabular text-[#0F4C81] font-semibold hover:underline cursor-pointer"
                >
                  SY-4031
                </button>{' '}
                ·{' '}
                <button
                  type="button"
                  onClick={() => setTrackingInput('SY-4048')}
                  className="font-mono-tabular text-[#0F4C81] font-semibold hover:underline cursor-pointer"
                >
                  SY-4048
                </button>
              </div>

              {trackingResult === 'not-found' && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  رزروی با این کد رهگیری یا کد ملی یافت نشد.
                </div>
              )}

              {trackingResult && trackingResult !== 'not-found' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular font-bold text-[#0F4C81]">
                      {trackingResult.trackingCode}
                    </span>
                    <span className="font-bold text-emerald-700">{trackingResult.status}</span>
                  </div>
                  <div className="font-bold text-slate-900">{trackingResult.itemName}</div>
                  <div className="text-slate-600">مسافر: {trackingResult.customerName}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>تاریخ: {trackingResult.date}</span>
                    <span>·</span>
                    <span>{toPersianDigits(trackingResult.guests)} نفر</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 font-bold text-slate-900 tabular-nums">
                    مبلغ کل: {formatToman(trackingResult.totalPrice)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

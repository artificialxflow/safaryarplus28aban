import React, { useState, useCallback } from 'react';
import { Globe, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import {
  AdminTab,
  AppMode,
  Caravan,
  CmsSettings,
  CustomerBooking,
  Hotel,
  HotelRoom,
  IssuedTicket,
  PartnerAccount,
  PartnerTransaction,
  Passenger,
  Tour,
} from './types';
import {
  INITIAL_BOOKINGS,
  INITIAL_CARAVANS,
  INITIAL_CMS_SETTINGS,
  INITIAL_HOTELS,
  INITIAL_PARTNERS,
  INITIAL_PASSENGERS,
  INITIAL_TOURS,
  INITIAL_TICKETS,
} from './data/mockData';
import { generateTrackingCode } from './utils/format';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [mode, setMode] = useState<AppMode>('customer');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Unified Single-Source-of-Truth State
  const [tours, setTours] = useState<Tour[]>(INITIAL_TOURS);
  const [hotels, setHotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [caravans, setCaravans] = useState<Caravan[]>(INITIAL_CARAVANS);
  const [passengers, setPassengers] = useState<Passenger[]>(INITIAL_PASSENGERS);
  const [issuedTickets, setIssuedTickets] = useState<IssuedTicket[]>(INITIAL_TICKETS);
  const [partners, setPartners] = useState<PartnerAccount[]>(INITIAL_PARTNERS);
  const [cmsSettings, setCmsSettings] = useState<CmsSettings>(INITIAL_CMS_SETTINGS);
  const [bookings, setBookings] = useState<CustomerBooking[]>(INITIAL_BOOKINGS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  // CMS Handlers
  const handleUpdateCmsSettings = (updates: Partial<CmsSettings>) => {
    setCmsSettings((prev) => ({ ...prev, ...updates }));
    showToast('تنظیمات سامانه با موفقیت ذخیره و در سایت اعمال شد.');
  };

  const handleAddTour = (tour: Tour) => {
    setTours((prev) => [tour, ...prev]);
    showToast(`تور «${tour.title}» در سایت مشتریان منتشر شد.`);
  };

  const handleDeleteTour = (tourId: string) => {
    setTours((prev) => prev.filter((t) => t.id !== tourId));
    showToast('تور انتخاب‌شده از سایت حذف شد.');
  };

  const handleUpdateTourPrice = (tourId: string, price: number) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, price } : t)));
  };

  const handleAddHotel = (hotel: Hotel) => {
    setHotels((prev) => [hotel, ...prev]);
    showToast(`هتل «${hotel.name}» به فهرست سایت اضافه شد.`);
  };

  const handleDeleteHotel = (hotelId: string) => {
    setHotels((prev) => prev.filter((h) => h.id !== hotelId));
    showToast('هتل از فهرست سایت حذف شد.');
  };

  // Caravans & Passengers Handlers
  const handleAddPassenger = (
    payload: Omit<Passenger, 'id' | 'ticketStatus' | 'registeredAt'>
  ) => {
    const newPassenger: Passenger = {
      ...payload,
      id: `pax-${Date.now()}`,
      ticketStatus: 'pending',
      registeredAt: '۱۴۰۵/۰۸/۲۸',
    };
    setPassengers((prev) => [newPassenger, ...prev]);
    showToast(`مسافر «${newPassenger.fullName}» در کاروان ثبت شد و آماده صدور بلیت است.`);
  };

  const handleAddCaravan = (payload: Omit<Caravan, 'id'>) => {
    const newCaravan: Caravan = {
      ...payload,
      id: `crv-${Date.now()}`,
    };
    setCaravans((prev) => [newCaravan, ...prev]);
    showToast(`کاروان «${newCaravan.name}» با موفقیت تعریف شد.`);
  };

  // Flight Ticket Issuance Handler (syncs with Caravans & Bookings)
  const handleIssueTicket = (payload: Omit<IssuedTicket, 'id' | 'issuedAt'>) => {
    const newTicket: IssuedTicket = {
      ...payload,
      id: `tkt-${Date.now()}`,
      issuedAt: '۱۴۰۵/۰۸/۲۸',
    };
    setIssuedTickets((prev) => [newTicket, ...prev]);

    if (payload.passengerId) {
      setPassengers((prev) =>
        prev.map((p) =>
          p.id === payload.passengerId
            ? {
                ...p,
                ticketStatus: 'issued',
                ticketNumber: payload.ticketNumber,
                pnr: payload.pnr,
              }
            : p
        )
      );
    } else {
      // Also match by national ID if entered manually
      setPassengers((prev) =>
        prev.map((p) =>
          p.nationalId === payload.nationalId
            ? {
                ...p,
                ticketStatus: 'issued',
                ticketNumber: payload.ticketNumber,
                pnr: payload.pnr,
              }
            : p
        )
      );
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.nationalId === payload.nationalId ? { ...b, status: 'صادر شده' } : b
      )
    );

    showToast(`بلیت ${payload.passengerName} صادر و وضعیت مسافر در کاروان به «صادر شده» تغییر یافت.`);
  };

  // Accounting Handlers
  const handleUpdateCaravanFinance = (
    caravanId: string,
    updates: { hotelCost: number; buyCost: number; sellRevenue: number }
  ) => {
    setCaravans((prev) =>
      prev.map((c) => (c.id === caravanId ? { ...c, ...updates } : c))
    );
    showToast('ارقام مالی کاروان به‌روزرسانی و سود خالص مجدداً محاسبه شد.');
  };

  const handleAddPartnerTransaction = (
    partnerId: string,
    tx: Omit<PartnerTransaction, 'id'>
  ) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              lastActivity: tx.date,
              transactions: [...p.transactions, { ...tx, id: `tx-${Date.now()}` }],
            }
          : p
      )
    );
    showToast('سند مالی جدید در دفتر معین طرف حساب ثبت شد.');
  };

  // Customer Storefront Online Booking Handlers (flow straight into Admin ERP!)
  const handleCreateTourBooking = (payload: {
    tour: Tour;
    departureDate: string;
    customerName: string;
    latinName: string;
    nationalId: string;
    passportNumber: string;
    phone: string;
    guests: number;
    totalPrice: number;
  }): CustomerBooking => {
    const trackingCode = generateTrackingCode();
    const booking: CustomerBooking = {
      trackingCode,
      type: 'tour',
      itemName: payload.tour.title,
      customerName: payload.customerName,
      nationalId: payload.nationalId,
      phone: payload.phone,
      date: payload.departureDate,
      guests: payload.guests,
      totalPrice: payload.totalPrice,
      status: 'در انتظار صدور بلیت',
    };
    setBookings((prev) => [booking, ...prev]);

    // Link passenger directly into matching Caravan in Admin ERP
    const matchingCaravan =
      caravans.find((c) =>
        payload.tour.destination.includes('کربلا')
          ? c.destinationCode === 'NJF'
          : payload.tour.destination.includes('مشهد')
          ? c.destinationCode === 'MHD'
          : payload.tour.destination.includes('استانبول')
          ? c.destinationCode === 'IST'
          : payload.tour.destination.includes('دبی')
          ? c.destinationCode === 'DXB'
          : false
      ) || caravans[0];

    if (matchingCaravan) {
      const newPax: Passenger = {
        id: `pax-${Date.now()}`,
        fullName: payload.customerName,
        latinName: payload.latinName,
        nationalId: payload.nationalId,
        passportNumber: payload.passportNumber,
        phone: payload.phone,
        caravanId: matchingCaravan.id,
        ticketStatus: 'pending',
        registeredAt: '۱۴۰۵/۰۸/۲۸',
      };
      setPassengers((prev) => [newPax, ...prev]);
      setCaravans((prev) =>
        prev.map((c) =>
          c.id === matchingCaravan.id
            ? { ...c, sellRevenue: c.sellRevenue + payload.totalPrice }
            : c
        )
      );
    }

    showToast(`رزرو با کد ${trackingCode} ثبت و مسافر به لیست کاروان پنل ادمین اضافه شد.`);
    return booking;
  };

  const handleCreateHotelBooking = (payload: {
    hotel: Hotel;
    room: HotelRoom;
    checkInDate: string;
    nights: number;
    customerName: string;
    nationalId: string;
    phone: string;
  }): CustomerBooking => {
    const trackingCode = generateTrackingCode();
    const booking: CustomerBooking = {
      trackingCode,
      type: 'hotel',
      itemName: `${payload.hotel.name} — ${payload.room.name}`,
      customerName: payload.customerName,
      nationalId: payload.nationalId,
      phone: payload.phone,
      date: payload.checkInDate,
      guests: payload.room.capacity,
      totalPrice: payload.room.pricePerNight * payload.nights,
      status: 'تأیید شده',
    };
    setBookings((prev) => [booking, ...prev]);
    showToast(`واچر هتل با کد رهگیری ${trackingCode} صادر شد.`);
    return booking;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Top Quick Mode Switcher Bar (hidden in print mode) */}
      <div className="sticky top-0 z-40 h-10 bg-[#0B2942] text-white border-b border-white/10 no-print">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-medium text-sky-100 hidden sm:inline whitespace-nowrap">
            سامانه یکپارچه سفریار پلاس · جابه‌جایی سریع میان نمای مشتریان و پنل مدیریت:
          </span>

          <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => setMode('customer')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'customer'
                  ? 'bg-white text-[#0F4C81]'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              نمای مشتریان (سایت آژانس)
            </button>
            <button
              type="button"
              onClick={() => setMode('admin')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] sm:text-xs font-bold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'admin'
                  ? 'bg-amber-400 text-slate-900'
                  : 'text-sky-100 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              پنل مدیریت یکپارچه (Admin)
            </button>
          </div>
        </div>
      </div>

      {/* Main Active Mode */}
      {mode === 'customer' ? (
        <CustomerPortal
          tours={tours}
          hotels={hotels}
          cmsSettings={cmsSettings}
          bookings={bookings}
          onCreateTourBooking={handleCreateTourBooking}
          onCreateHotelBooking={handleCreateHotelBooking}
        />
      ) : (
        <AdminDashboard
          activeTab={adminTab}
          onTabChange={setAdminTab}
          tours={tours}
          hotels={hotels}
          caravans={caravans}
          passengers={passengers}
          issuedTickets={issuedTickets}
          partners={partners}
          cmsSettings={cmsSettings}
          onUpdateCmsSettings={handleUpdateCmsSettings}
          onAddTour={handleAddTour}
          onDeleteTour={handleDeleteTour}
          onUpdateTourPrice={handleUpdateTourPrice}
          onAddHotel={handleAddHotel}
          onDeleteHotel={handleDeleteHotel}
          onAddPassenger={handleAddPassenger}
          onAddCaravan={handleAddCaravan}
          onIssueTicket={handleIssueTicket}
          onUpdateCaravanFinance={handleUpdateCaravanFinance}
          onAddPartnerTransaction={handleAddPartnerTransaction}
        />
      )}

      {/* Clean Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 max-w-sm bg-slate-900 text-white border border-slate-700 rounded-xl px-4 py-3 shadow-lg flex items-start gap-2.5 text-xs no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

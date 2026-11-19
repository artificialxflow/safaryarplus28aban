export type AppMode = 'customer' | 'admin';

export type CustomerPage =
  | 'home'
  | 'tours'
  | 'tour-detail'
  | 'hotels'
  | 'hotel-detail'
  | 'about'
  | 'contact';

export type AdminTab =
  | 'dashboard'
  | 'cms'
  | 'caravans'
  | 'ticketing'
  | 'accounting';

export type TourCategory = 'pilgrimage' | 'domestic' | 'international';

export interface TourDeparture {
  id: string;
  date: string;
  airline: string;
  doublePrice: number;
  singlePrice: number;
  childPrice: number;
  remainingSeats: number;
}

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  code: string;
  title: string;
  destination: string;
  origin: string;
  category: TourCategory;
  isHajjOfficial: boolean;
  durationNights: number;
  durationDays: number;
  price: number;
  originalPrice?: number;
  airline: string;
  hotelName: string;
  hotelStars: number;
  image: string;
  gallery: string[];
  featured: boolean;
  specialOffer?: boolean;
  summary: string;
  services: string[];
  itinerary: TourItineraryDay[];
  departures: TourDeparture[];
  hajjGroupCode?: string;
}

export interface HotelRoom {
  id: string;
  name: string;
  capacity: number;
  mealPlan: string;
  pricePerNight: number;
  available: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  address: string;
  distanceNote: string;
  image: string;
  gallery: string[];
  amenities: string[];
  description: string;
  rooms: HotelRoom[];
}

export interface Caravan {
  id: string;
  code: string;
  name: string;
  destination: string;
  destinationCode: string;
  origin: string;
  originCode: string;
  departureDate: string;
  returnDate: string;
  monthLabel: string;
  hotelName: string;
  capacity: number;
  isHajjOfficial: boolean;
  hotelCost: number;
  buyCost: number;
  sellRevenue: number;
  status: 'active' | 'completing' | 'departed';
}

export type TicketStatus = 'pending' | 'issued';

export interface Passenger {
  id: string;
  fullName: string;
  latinName: string;
  nationalId: string;
  passportNumber: string;
  phone: string;
  caravanId: string;
  ticketStatus: TicketStatus;
  ticketNumber?: string;
  pnr?: string;
  registeredAt: string;
}

export interface IssuedTicket {
  id: string;
  ticketNumber: string;
  pnr: string;
  passengerId?: string;
  passengerName: string;
  latinName: string;
  nationalId: string;
  passportNumber: string;
  airline: string;
  flightNumber: string;
  originCity: string;
  originCode: string;
  destinationCity: string;
  destinationCode: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  boardingTime: string;
  gate: string;
  seat: string;
  cabinClass: 'Economy' | 'Business';
  baggage: string;
  fareAmount: number;
  issuedAt: string;
  caravanCode?: string;
}

export interface PartnerTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  debit: number; // بدهکار (طرف حساب به ما بدهکار است / طلب ما)
  credit: number; // بستانکار (ما به طرف حساب بدهکاریم / بدهی ما)
}

export interface PartnerAccount {
  id: string;
  code: string;
  name: string;
  type: 'همکار آژانسی' | 'کارگزار هتل' | 'چارترکننده پرواز' | 'کارگزار عتبات';
  phone: string;
  city: string;
  lastActivity: string;
  transactions: PartnerTransaction[];
}

export interface CmsSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  hajjApiConnected: boolean;
  hajjOfficeCode: string;
  hajjApiEndpoint: string;
  hajjLastSync: string;
}

export interface CustomerBooking {
  trackingCode: string;
  type: 'tour' | 'hotel';
  itemName: string;
  customerName: string;
  nationalId: string;
  phone: string;
  date: string;
  guests: number;
  totalPrice: number;
  status: 'تأیید شده' | 'در انتظار صدور بلیت' | 'صادر شده';
}

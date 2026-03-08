import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Train as TrainIcon, 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  History, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  Plus,
  Trash2,
  Menu,
  X,
  Star,
  Utensils,
  ArrowLeft,
  Share2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Headphones,
  MessageSquare,
  Send,
  Bus,
  Plane,
  Hotel
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isBefore,
  startOfToday
} from 'date-fns';
import { cn, generatePNR, formatCurrency } from './lib/utils';
import { Train, User as UserType, Booking, Passenger, ClassAvailability, LiveStatus } from './types';

// --- Components ---

const Calendar = ({ selectedDate, onSelect, onClose }: { selectedDate: Date, onSelect: (date: Date) => void, onClose: () => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const today = startOfToday();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-black/5 p-4 w-full max-w-md animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-zinc-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(day, today);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={idx}
              disabled={isPast}
              onClick={() => {
                onSelect(day);
                onClose();
              }}
              className={cn(
                "h-10 w-full flex items-center justify-center rounded-lg text-sm transition-all relative",
                !isCurrentMonth && "text-zinc-300",
                isCurrentMonth && !isPast && "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600",
                isPast && "text-zinc-200 cursor-not-allowed",
                isSelected && "bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white",
                isToday && !isSelected && "border border-emerald-200 text-emerald-600"
              )}
            >
              {format(day, 'd')}
              {isToday && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end">
        <button 
          onClick={onClose}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'search' | 'results' | 'booking' | 'payment' | 'history' | 'status' | 'wallet' | 'support'>('search');
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [serviceType, setServiceType] = useState<'train' | 'bus' | 'flight' | 'hotel'>('train');

  // Search State
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [trains, setTrains] = useState<Train[]>([]);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterACOnly, setFilterACOnly] = useState(false);

  // Booking State
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassAvailability | null>(null);
  const [passengers, setPassengers] = useState<(Passenger & { saveToMaster?: boolean })[]>([
    { id: '1', name: '', age: 0, gender: 'Male', seatPreference: 'Lower', saveToMaster: true }
  ]);

  // History State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Live Status State
  const [statusTrainNumber, setStatusTrainNumber] = useState('');
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [showSchedule, setShowSchedule] = useState<Train | null>(null);
  const [recentSearches, setRecentSearches] = useState<{from: string, to: string}[]>([]);
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>([]);
  const [walletAmount, setWalletAmount] = useState('');
  const [supportMessages, setSupportMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! How can I help you with your rail booking today?' }
  ]);
  const [supportInput, setSupportInput] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('railEaseUser');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedRecent = localStorage.getItem('railEaseRecentSearches');
    if (savedRecent) setRecentSearches(JSON.parse(savedRecent));

    const savedP = localStorage.getItem('railEaseSavedPassengers');
    if (savedP) setSavedPassengers(JSON.parse(savedP));
  }, []);

  const saveSearch = (from: string, to: string) => {
    const newSearches = [{ from, to }, ...recentSearches.filter(s => s.from !== from || s.to !== to)].slice(0, 3);
    setRecentSearches(newSearches);
    localStorage.setItem('railEaseRecentSearches', JSON.stringify(newSearches));
  };

  const savePassenger = (p: Passenger) => {
    const newP = [p, ...savedPassengers.filter(sp => sp.name !== p.name)].slice(0, 5);
    setSavedPassengers(newP);
    localStorage.setItem('railEaseSavedPassengers', JSON.stringify(newP));
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setUser(result);
        localStorage.setItem('railEaseUser', JSON.stringify(result));
        setShowAuthModal(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert('Authentication failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('railEaseUser');
    setView('search');
  };

  const majorStations = [
    { name: 'New Delhi', code: 'NDLS', icon: '🏛️' },
    { name: 'Mumbai Central', code: 'MMCT', icon: '🏙️' },
    { name: 'Bengaluru', code: 'SBC', icon: '🌳' },
    { name: 'Guwahati', code: 'GHY', icon: '🏔️' },
    { name: 'Kolkata', code: 'HWH', icon: '🌉' },
    { name: 'Chennai Central', code: 'MAS', icon: '🌊' },
    { name: 'Hyderabad', code: 'HYB', icon: '🕌' },
    { name: 'Ahmedabad', code: 'ADI', icon: '🏭' },
  ];

  const searchTrains = async () => {
    if (!from) return alert('Please enter source station');
    setLoading(true);
    saveSearch(from, to);
    try {
      const res = await fetch(`/api/trains/search?from=${from}&to=${to || ''}`);
      const data = await res.json();
      setTrains(data);
      setView('results');
    } catch (err) {
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const startBooking = (train: Train, cls: ClassAvailability) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedTrain(train);
    setSelectedClass(cls);
    setView('booking');
  };

  const addPassenger = () => {
    setPassengers([...passengers, { id: Math.random().toString(), name: '', age: 0, gender: 'Male', seatPreference: 'Lower', saveToMaster: true }]);
  };

  const removePassenger = (id: string) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter(p => p.id !== id));
    }
  };

  const updatePassenger = (id: string, field: keyof Passenger | 'saveToMaster', value: any) => {
    setPassengers(passengers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const confirmBooking = async () => {
    if (passengers.some(p => !p.name || p.age <= 0)) return alert('Please fill all passenger details');
    // Save passengers for future fast booking if toggle is on
    passengers.forEach(p => {
      if (p.name && p.age > 0 && p.saveToMaster) {
        const { saveToMaster, ...passengerData } = p;
        savePassenger(passengerData);
      }
    });
    setView('payment');
  };

  const addMoney = async () => {
    if (!user || !walletAmount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount: parseFloat(walletAmount) }),
      });
      const data = await res.json();
      const updatedUser = { ...user, walletBalance: data.walletBalance };
      setUser(updatedUser);
      localStorage.setItem('railEaseUser', JSON.stringify(updatedUser));
      setWalletAmount('');
      alert('Money added successfully!');
    } catch (err) {
      alert('Failed to add money');
    } finally {
      setLoading(false);
    }
  };

  const sendSupportMessage = () => {
    if (!supportInput.trim()) return;
    const newMessages = [...supportMessages, { role: 'user' as const, text: supportInput }];
    setSupportMessages(newMessages);
    setSupportInput('');
    
    // Mock bot response
    setTimeout(() => {
      setSupportMessages(prev => [...prev, { 
        role: 'bot', 
        text: "Thank you for contacting RailEase 24/7 Support. Our agent will be with you shortly. For immediate assistance, please call our toll-free number 1800-RAIL-HELP." 
      }]);
    }, 1000);
  };

  const processPayment = async (method: 'card' | 'wallet') => {
    if (!user) return;
    setLoading(true);
    const totalAmount = (selectedClass?.price || 0) * passengers.length + 45; // Including service charge

    if (method === 'wallet' && user.walletBalance < totalAmount) {
      setLoading(false);
      return alert('Insufficient wallet balance. Please add money or use card.');
    }

    try {
      if (method === 'wallet') {
        const walletRes = await fetch('/api/wallet/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, amount: totalAmount }),
        });
        if (!walletRes.ok) throw new Error('Wallet deduction failed');
        const walletData = await walletRes.json();
        const updatedUser = { ...user, walletBalance: walletData.walletBalance };
        setUser(updatedUser);
        localStorage.setItem('railEaseUser', JSON.stringify(updatedUser));
      }

      const pnr = generatePNR();
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          pnr,
          trainId: selectedTrain?.id,
          trainName: selectedTrain?.name,
          trainNumber: selectedTrain?.number,
          from: selectedTrain?.from,
          to: selectedTrain?.to,
          date: format(date, 'yyyy-MM-dd'),
          classType: selectedClass?.type,
          passengers,
          totalAmount
        }),
      });
      
      if (res.ok) {
        alert(`Booking Successful! PNR: ${pnr}`);
        fetchBookings();
        setView('history');
      }
    } catch (err) {
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bookings/${user.id}`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error('Failed to fetch bookings');
    }
  };

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;
    try {
      await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
      fetchBookings();
    } catch (err) {
      alert('Cancellation failed');
    }
  };

  const checkLiveStatus = async () => {
    if (!statusTrainNumber) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/trains/${statusTrainNumber}/status`);
      const data = await res.json();
      setLiveStatus(data);
    } catch (err) {
      alert('Failed to get status');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (train: Train) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trains/${train.number}/schedule`);
      const data = await res.json();
      setShowSchedule({ ...train, schedule: data });
    } catch (err) {
      alert('Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const classOptions: ClassAvailability[] = [
    { type: '2S', price: 105, status: 'Available', count: 234 },
    { type: 'SL', price: 150, status: 'Available', count: 141 },
    { type: 'CC', price: 360, status: 'Waiting List', count: 3 },
    { type: '3A', price: 520, status: 'Available', count: 50 },
    { type: '2A', price: 850, status: 'Available', count: 12 },
    { type: '1A', price: 1250, status: 'Available', count: 8 },
  ];


  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('search')}>
              <div className="bg-emerald-600 p-2 rounded-lg">
                <TrainIcon className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-emerald-700">RailEase</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setView('search')} className={cn("text-sm font-medium transition-colors hover:text-emerald-600", view === 'search' ? "text-emerald-600" : "text-zinc-500")}>Search</button>
              <button onClick={() => { setView('history'); fetchBookings(); }} className={cn("text-sm font-medium transition-colors hover:text-emerald-600", view === 'history' ? "text-emerald-600" : "text-zinc-500")}>My Bookings</button>
              <button onClick={() => setView('status')} className={cn("text-sm font-medium transition-colors hover:text-emerald-600", view === 'status' ? "text-emerald-600" : "text-zinc-500")}>Live Status</button>
              {user && (
                <>
                  <button onClick={() => setView('wallet')} className={cn("text-sm font-medium transition-colors hover:text-emerald-600 flex items-center gap-2", view === 'wallet' ? "text-emerald-600" : "text-zinc-500")}>
                    <Wallet className="w-4 h-4" />
                    ₹{user.walletBalance}
                  </button>
                  <button onClick={() => setView('support')} className={cn("text-sm font-medium transition-colors hover:text-emerald-600 flex items-center gap-2", view === 'support' ? "text-emerald-600" : "text-zinc-500")}>
                    <Headphones className="w-4 h-4" />
                    Support
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-zinc-600 hidden sm:block">Welcome, {user.fullName}</span>
                  <button onClick={handleLogout} className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
                >
                  Login / Signup
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Search View */}
          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-zinc-900 mb-4">
                  {serviceType === 'train' && "Where would you like to go?"}
                  {serviceType === 'bus' && "Book Bus Tickets Online"}
                  {serviceType === 'flight' && "Fly to Your Destination"}
                  {serviceType === 'hotel' && "Find the Perfect Stay"}
                </h1>
                <p className="text-zinc-500">
                  {serviceType === 'train' && "Book train tickets across India with ease and comfort."}
                  {serviceType === 'bus' && "Safe and reliable bus travel at the best prices."}
                  {serviceType === 'flight' && "Compare and book flights to anywhere in the world."}
                  {serviceType === 'hotel' && "Discover amazing hotels and resorts for your next trip."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                {[
                  { id: 'train', name: 'Trains', icon: TrainIcon },
                  { id: 'bus', name: 'Buses', icon: Bus },
                  { id: 'flight', name: 'Flights', icon: Plane },
                  { id: 'hotel', name: 'Hotels', icon: Hotel },
                ].map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setServiceType(service.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                      serviceType === service.id 
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                        : "bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-100"
                    )}
                  >
                    <service.icon className="w-5 h-5" />
                    {service.name}
                  </button>
                ))}
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                      {serviceType === 'hotel' ? 'Location' : 'From'}
                    </label>
                    <div className="flex items-center border border-zinc-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                      <MapPin className="w-5 h-5 text-zinc-400 mr-3" />
                      <input 
                        type="text" 
                        placeholder={
                          serviceType === 'train' ? "Source Station" :
                          serviceType === 'bus' ? "Source City" :
                          serviceType === 'flight' ? "Source Airport" :
                          "City or Hotel Name"
                        } 
                        className="w-full outline-none bg-transparent text-zinc-800"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>
                  </div>

                  {serviceType !== 'hotel' && (
                    <div className="flex items-center justify-center -my-3 z-10">
                      <button 
                        onClick={() => { const temp = from; setFrom(to); setTo(temp); }}
                        className="bg-white border border-zinc-200 p-2 rounded-full shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {serviceType !== 'hotel' && (
                    <div className="relative">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">To</label>
                      <div className="flex items-center border border-zinc-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                        <MapPin className="w-5 h-5 text-zinc-400 mr-3" />
                        <input 
                          type="text" 
                          placeholder={
                            serviceType === 'train' ? "Destination Station" :
                            serviceType === 'bus' ? "Destination City" :
                            "Destination Airport"
                          } 
                          className="w-full outline-none bg-transparent text-zinc-800"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                      {serviceType === 'hotel' ? 'Check-in Date' : 'Date of Journey'}
                    </label>
                    <button 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full flex items-center border border-zinc-200 rounded-xl px-4 py-3 hover:border-emerald-500 transition-all text-left"
                    >
                      <CalendarIcon className="w-5 h-5 text-zinc-400 mr-3" />
                      <span className="text-zinc-800">{format(date, 'dd MMM yyyy')}</span>
                    </button>

                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-50">
                        <Calendar 
                          selectedDate={date} 
                          onSelect={setDate} 
                          onClose={() => setShowCalendar(false)} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  id="main-search-btn"
                  onClick={serviceType === 'train' ? searchTrains : () => alert(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} booking coming soon!`)}
                  disabled={loading}
                  className="w-full mt-8 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Search {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}s
                    </>
                  )}
                </button>
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Searches</h3>
                  <div className="flex flex-wrap gap-3">
                    {recentSearches.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => { setFrom(s.from); setTo(s.to); }}
                        className="bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm font-medium text-zinc-700 flex items-center gap-2"
                      >
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {s.from} → {s.to}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Major Stations Quick Search */}
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    {serviceType === 'train' ? 'Major Stations' : 'Popular Destinations'}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Quick Search</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {majorStations.map((station) => (
                    <button 
                      key={station.code}
                      onClick={() => { 
                        setFrom(station.name); 
                        if (serviceType !== 'hotel') setTo('');
                        // Small delay to ensure state updates before search
                        setTimeout(() => {
                          const searchBtn = document.getElementById('main-search-btn');
                          searchBtn?.click();
                        }, 100);
                      }}
                      className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-1 bg-emerald-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Search className="w-3 h-3" />
                      </div>
                      <span className="text-2xl mb-2 block">{station.icon}</span>
                      <p className="text-sm font-bold text-zinc-800">{station.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{station.code}</p>
                    </button>
                  ))}
                </div>
              </div>


              {/* Quick Links / Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                {[
                  { 
                    icon: serviceType === 'train' ? Clock : serviceType === 'bus' ? Bus : serviceType === 'flight' ? Plane : Hotel, 
                    title: serviceType === 'train' ? "Instant Booking" : serviceType === 'bus' ? "Live Bus Tracking" : serviceType === 'flight' ? "Best Fares" : "Luxury Stays", 
                    desc: serviceType === 'train' ? "Fast and secure ticket reservations" : serviceType === 'bus' ? "Track your bus in real-time" : serviceType === 'flight' ? "Cheapest flights guaranteed" : "Handpicked premium hotels" 
                  },
                  { icon: Navigation, title: "Live Tracking", desc: "Real-time updates for your journey" },
                  { icon: CreditCard, title: "Easy Refunds", desc: "Hassle-free cancellation & refunds" }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-start gap-4">
                    <div className="bg-emerald-50 p-3 rounded-xl">
                      <item.icon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-800">{item.title}</h3>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results View */}
          {view === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100vh-120px)]"
            >
              {/* Header */}
              <div className="bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView('search')} className="p-2 hover:bg-zinc-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-zinc-600" />
                  </button>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">{from} → {to || 'Anywhere'}</h2>
                    <p className="text-[10px] font-medium text-zinc-500">{format(date, 'dd MMM, EEE')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="text-emerald-600">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Date Selector */}
              <div className="bg-white border-b border-zinc-100 flex overflow-x-auto no-scrollbar">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = addDays(startOfToday(), i);
                  const isSelected = isSameDay(d, date);
                  return (
                    <button
                      key={i}
                      onClick={() => setDate(d)}
                      className={cn(
                        "flex-shrink-0 px-6 py-3 border-b-2 transition-all",
                        isSelected ? "border-emerald-600 bg-emerald-50/30" : "border-transparent"
                      )}
                    >
                      <p className={cn("text-xs font-bold", isSelected ? "text-emerald-700" : "text-zinc-500")}>
                        {format(d, 'EEE, dd')}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-medium text-emerald-600">Available</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Train List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
                {trains.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl text-center border border-zinc-100">
                    <TrainIcon className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-zinc-800">No trains found</h3>
                    <p className="text-zinc-500">Try searching for different stations or dates.</p>
                  </div>
                ) : (
                  trains
                    .filter(t => !filterACOnly || true) // Mock filter logic
                    .map((train, idx) => (
                      <React.Fragment key={train.id}>
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
                          <div className="p-4">
                            {/* Train Info Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-400">{train.number}</span>
                                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-1">
                                  {train.name}
                                  <ChevronRight className="w-3 h-3 text-emerald-600" />
                                </h3>
                              </div>
                              <div className="flex items-center gap-4">
                                <Utensils className="w-4 h-4 text-zinc-300" />
                                <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                                  <Star className="w-3 h-3 text-zinc-400 fill-zinc-400" />
                                  <span className="text-[10px] font-bold text-zinc-600">4.2</span>
                                </div>
                                <button 
                                  onClick={() => fetchSchedule(train)}
                                  className="text-[10px] font-bold text-emerald-600 hover:underline"
                                >
                                  Schedule
                                </button>
                              </div>
                            </div>

                            {/* Time and Route */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="text-left">
                                <p className="text-lg font-black text-zinc-900">{train.departureTime}</p>
                                <p className="text-xs font-bold text-zinc-500">{train.from.split(' ').map(w => w[0]).join('')}</p>
                                <p className="text-[10px] text-zinc-400 mt-1">8 hours ago</p>
                              </div>
                              <div className="flex flex-col items-center flex-1 px-4">
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-2 h-2 rounded-full border border-zinc-300" />
                                  <div className="h-[1px] flex-1 bg-zinc-200 border-dashed border-t" />
                                  <span className="text-[10px] font-bold text-zinc-400">{train.duration}</span>
                                  <div className="h-[1px] flex-1 bg-zinc-200 border-dashed border-t" />
                                  <div className="w-2 h-2 rounded-full border border-zinc-300" />
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-zinc-900">{train.arrivalTime}</p>
                                <p className="text-xs font-bold text-zinc-500">{train.to.split(' ').map(w => w[0]).join('')}</p>
                                <p className="text-[10px] text-zinc-400 mt-1">15 hours ago</p>
                              </div>
                            </div>

                            {/* Class Selection Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              {classOptions
                                .filter(cls => !filterACOnly || cls.type.includes('A') || cls.type === 'CC')
                                .filter(cls => !filterAvailable || cls.status === 'Available')
                                .map((cls) => (
                                  <button 
                                    key={cls.type}
                                    onClick={() => startBooking(train, cls)}
                                    className={cn(
                                      "p-3 rounded-xl border text-left transition-all",
                                      cls.status === 'Available' ? "border-emerald-100 bg-emerald-50/30 hover:border-emerald-500" : "border-zinc-100 bg-zinc-50"
                                    )}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-bold text-zinc-500">{cls.type}</span>
                                      <span className="text-[10px] font-bold text-zinc-900">₹{cls.price}</span>
                                    </div>
                                    <p className={cn(
                                      "text-xs font-black",
                                      cls.status === 'Available' ? "text-emerald-600" : cls.status === 'RAC' ? "text-amber-600" : "text-zinc-400"
                                    )}>
                                      {cls.status === 'Available' ? `AVL ${cls.count}` : cls.status === 'Waiting List' ? `WL ${cls.count}` : `RAC ${cls.count}`}
                                    </p>
                                    <p className={cn(
                                      "text-[10px] font-medium mt-0.5",
                                      cls.status === 'Available' ? "text-emerald-500" : "text-zinc-400"
                                    )}>
                                      {cls.status}
                                    </p>
                                    {(cls.type === '3A' || cls.type === 'CC') && (
                                      <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[8px] font-bold text-emerald-600">Confirm or 3X Refund*</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                            </div>

                            {/* Quick Book Action */}
                            {savedPassengers.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2">
                                    {savedPassengers.slice(0, 3).map((p, i) => (
                                      <div key={i} className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-emerald-700">
                                        {p.name[0]}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-400">Book for {savedPassengers[0].name}</span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const bestClass = classOptions.find(c => c.status === 'Available') || classOptions[0];
                                    setSelectedTrain(train);
                                    setSelectedClass(bestClass);
                                    setPassengers([{ ...savedPassengers[0], id: Math.random().toString() }]);
                                    setView('booking');
                                  }}
                                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                                >
                                  <Clock className="w-3 h-3" />
                                  Quick Book
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      {/* Promotional Banner */}
                      {idx === 0 && (
                        <div className="bg-emerald-50 rounded-2xl overflow-hidden border border-emerald-100 flex items-center p-4 gap-4">
                          <div className="flex-1">
                            <div className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded inline-block mb-1 uppercase tracking-widest">Get</div>
                            <h4 className="text-xl font-black text-emerald-900 leading-tight">1% CASHBACK</h4>
                            <p className="text-[10px] font-bold text-emerald-700">on All Train Bookings!</p>
                          </div>
                          <div className="relative w-32 h-16">
                            <div className="absolute inset-0 bg-emerald-200/50 rounded-full blur-xl" />
                            <TrainIcon className="w-12 h-12 text-emerald-600 absolute right-4 top-1/2 -translate-y-1/2 opacity-20" />
                            <div className="absolute right-0 bottom-0 text-2xl">🌴</div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                )}
              </div>

              {/* Bottom Filters */}
              <div className="bg-white border-t border-zinc-100 p-4 flex items-center justify-around">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setFilterAvailable(!filterAvailable)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      filterAvailable ? "bg-emerald-600" : "bg-zinc-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                      filterAvailable ? "left-7" : "left-1"
                    )} />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-500">Available</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setFilterACOnly(!filterACOnly)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      filterACOnly ? "bg-emerald-600" : "bg-zinc-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                      filterACOnly ? "left-7" : "left-1"
                    )} />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-500">AC Only</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Booking View */}
          {view === 'booking' && (
            <motion.div 
              key="booking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('results')} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold">Passenger Details</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Fast Selection */}
                  {savedPassengers.length > 0 && (
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                      <h3 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Quick Add Saved Passengers
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {savedPassengers.map((p) => (
                          <div key={p.id} className="flex items-center bg-white rounded-xl border border-emerald-100 overflow-hidden group">
                            <button
                              onClick={() => {
                                // Find first empty passenger or add new
                                const emptyIdx = passengers.findIndex(pass => !pass.name);
                                if (emptyIdx !== -1) {
                                  updatePassenger(passengers[emptyIdx].id, 'name', p.name);
                                  updatePassenger(passengers[emptyIdx].id, 'age', p.age);
                                  updatePassenger(passengers[emptyIdx].id, 'gender', p.gender);
                                  updatePassenger(passengers[emptyIdx].id, 'seatPreference', p.seatPreference);
                                } else {
                                  setPassengers([...passengers, { ...p, id: Math.random().toString(), saveToMaster: false }]);
                                }
                              }}
                              className="px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              + {p.name}
                            </button>
                            <button 
                              onClick={() => {
                                const newP = savedPassengers.filter(sp => sp.id !== p.id);
                                setSavedPassengers(newP);
                                localStorage.setItem('railEaseSavedPassengers', JSON.stringify(newP));
                              }}
                              className="px-2 py-2 border-l border-emerald-50 text-emerald-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {passengers.map((passenger, index) => (
                    <div key={passenger.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 relative">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-zinc-800">Passenger {index + 1}</h3>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div 
                              onClick={() => updatePassenger(passenger.id, 'saveToMaster', !passenger.saveToMaster)}
                              className={cn(
                                "w-10 h-5 rounded-full transition-all relative",
                                passenger.saveToMaster ? "bg-emerald-600" : "bg-zinc-200"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                passenger.saveToMaster ? "left-5.5" : "left-0.5"
                              )} />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase group-hover:text-emerald-600 transition-colors">Save for future</span>
                          </label>
                          {passengers.length > 1 && (
                            <button onClick={() => removePassenger(passenger.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase">Full Name</label>
                          <input 
                            type="text" 
                            className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                            value={passenger.name}
                            onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                            placeholder="As per ID proof"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Age</label>
                            <input 
                              type="number" 
                              className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                              value={passenger.age || ''}
                              onChange={(e) => updatePassenger(passenger.id, 'age', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Gender</label>
                            <select 
                              className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 bg-white"
                              value={passenger.gender}
                              onChange={(e) => updatePassenger(passenger.id, 'gender', e.target.value)}
                            >
                              <option>Male</option>
                              <option>Female</option>
                              <option>Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-zinc-400 uppercase">Seat Preference</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {['Lower', 'Middle', 'Upper', 'Side Lower', 'Side Upper'].map(pref => (
                              <button
                                key={pref}
                                onClick={() => updatePassenger(passenger.id, 'seatPreference', pref)}
                                className={cn(
                                  "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                                  passenger.seatPreference === pref ? "bg-emerald-600 border-emerald-600 text-white" : "border-zinc-200 text-zinc-600 hover:border-emerald-200"
                                )}
                              >
                                {pref}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={addPassenger}
                    className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Passenger
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                    <h3 className="font-bold text-zinc-900 mb-4 pb-4 border-b border-zinc-100">Fare Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Base Fare ({passengers.length} × {formatCurrency(selectedClass?.price || 0)})</span>
                        <span className="font-bold text-zinc-800">{formatCurrency((selectedClass?.price || 0) * passengers.length)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Service Charge</span>
                        <span className="font-bold text-zinc-800">{formatCurrency(45)}</span>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                        <span className="font-bold text-zinc-900">Total Amount</span>
                        <span className="text-xl font-black text-emerald-600">{formatCurrency(((selectedClass?.price || 0) * passengers.length) + 45)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={confirmBooking}
                      className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Proceed to Payment
                    </button>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <h4 className="text-emerald-800 font-bold mb-2 flex items-center gap-2">
                      <TrainIcon className="w-4 h-4" />
                      Journey Details
                    </h4>
                    <p className="text-sm text-emerald-700 font-bold">{selectedTrain?.name} ({selectedTrain?.number})</p>
                    <p className="text-xs text-emerald-600 mt-1">{selectedTrain?.from} → {selectedTrain?.to}</p>
                    <p className="text-xs text-emerald-600 mt-1">{format(date, 'EEEE, dd MMM yyyy')}</p>
                    <p className="text-xs text-emerald-600 mt-1 font-bold">{selectedClass?.type}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment View */}
          {view === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
                <div className="text-center mb-8">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-900">Secure Payment</h2>
                  <p className="text-zinc-500">Choose your preferred payment method</p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => processPayment('wallet')}
                    className="w-full p-6 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:border-emerald-500 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">💰</span>
                      <div className="text-left">
                        <span className="font-bold text-emerald-700 block">RailEase Wallet</span>
                        <span className="text-xs text-emerald-600">Balance: ₹{user?.walletBalance}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-500" />
                  </button>

                  {[
                    { id: 'upi', name: 'UPI (PhonePe, Google Pay, Paytm)', icon: '📱' },
                    { id: 'card', name: 'Debit / Credit Card', icon: '💳' },
                    { id: 'net', name: 'Net Banking', icon: '🏦' }
                  ].map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => processPayment('card')}
                      className="w-full p-6 rounded-2xl border border-zinc-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{method.icon}</span>
                        <span className="font-bold text-zinc-700 group-hover:text-emerald-700">{method.name}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-emerald-500" />
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-100 flex items-center justify-center gap-8 opacity-50 grayscale">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" referrerPolicy="no-referrer" />
                </div>
              </div>
            </motion.div>
          )}

          {/* History View */}
          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-zinc-900 mb-8">My Booking History</h2>
              
              {bookings.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl text-center border border-zinc-100">
                  <History className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-800">No bookings yet</h3>
                  <p className="text-zinc-500">Your travel history will appear here.</p>
                  <button onClick={() => setView('search')} className="mt-6 text-emerald-600 font-bold hover:underline">Book your first trip</button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                    <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-zinc-400 uppercase">PNR: <span className="text-zinc-900">{booking.pnr}</span></span>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Booked on: <span className="text-zinc-900">{format(new Date(booking.bookingDate), 'dd MMM yyyy')}</span></span>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        booking.status === 'Confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {booking.status}
                      </div>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-emerald-50 p-2 rounded-lg">
                            <TrainIcon className="text-emerald-600 w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-zinc-900">{booking.trainName} ({booking.trainNumber})</h3>
                        </div>
                        <div className="flex items-center gap-12">
                          <div>
                            <p className="text-sm font-bold text-zinc-400 uppercase mb-1">From</p>
                            <p className="text-lg font-bold text-zinc-800">{booking.fromStation}</p>
                            <p className="text-sm text-zinc-500">{booking.date}</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-zinc-200" />
                          <div>
                            <p className="text-sm font-bold text-zinc-400 uppercase mb-1">To</p>
                            <p className="text-lg font-bold text-zinc-800">{booking.toStation}</p>
                            <p className="text-sm text-zinc-500">{booking.classType}</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:w-1/3 border-t md:border-t-0 md:border-l border-zinc-100 pt-6 md:pt-0 md:pl-8">
                        <p className="text-sm font-bold text-zinc-400 uppercase mb-4">Passengers</p>
                        <div className="space-y-3">
                          {booking.passengers.map((p, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-zinc-800">{p.name}</p>
                                <p className="text-xs text-zinc-500">{p.age} yrs • {p.gender} • {p.seatPreference}</p>
                              </div>
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">S{i+1}-3{i+6}</span>
                            </div>
                          ))}
                        </div>
                        {booking.status === 'Confirmed' && (
                          <div className="mt-8 flex items-center gap-4">
                            <button 
                              onClick={() => setSelectedBooking(booking)}
                              className="text-emerald-600 text-sm font-bold hover:underline flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              View Ticket
                            </button>
                            <button 
                              onClick={() => cancelBooking(booking.id)}
                              className="text-red-500 text-sm font-bold hover:underline flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Live Status View */}
          {view === 'status' && (
            <motion.div 
              key="status"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">Live Train Status</h2>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <TrainIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Enter Train Number (e.g. 12423)" 
                      className="w-full border border-zinc-200 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-emerald-500"
                      value={statusTrainNumber}
                      onChange={(e) => setStatusTrainNumber(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={checkLiveStatus}
                    disabled={loading}
                    className="bg-emerald-600 text-white px-8 rounded-xl font-bold hover:bg-emerald-700 transition-all"
                  >
                    {loading ? "..." : "Track"}
                  </button>
                </div>

                {liveStatus && (
                  <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-3xl font-black text-zinc-900">{liveStatus.currentStation}</h3>
                        <p className="text-emerald-600 font-bold flex items-center gap-2 mt-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Arrived at Station
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-400 uppercase">Delay</p>
                        <p className={cn("text-xl font-bold", liveStatus.delay === 'On Time' ? "text-emerald-600" : "text-red-500")}>{liveStatus.delay}</p>
                      </div>
                    </div>

                    <div className="relative py-12">
                      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-zinc-100 -translate-x-1/2" />
                      <div className="relative flex flex-col items-center gap-24">
                        <div className="bg-emerald-600 w-4 h-4 rounded-full ring-8 ring-emerald-100 z-10" />
                        <div className="bg-zinc-200 w-4 h-4 rounded-full z-10" />
                      </div>
                      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 translate-x-8">
                        <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                          <p className="text-xs font-bold text-zinc-400 uppercase">Next Station</p>
                          <p className="font-bold text-zinc-800">{liveStatus.nextStation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-50 p-4 rounded-2xl flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Last Updated: {liveStatus.lastUpdated}</span>
                      <button onClick={checkLiveStatus} className="text-emerald-600 text-xs font-bold hover:underline">Refresh</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Wallet View */}
          {view === 'wallet' && user && (
            <motion.div 
              key="wallet"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900">My Wallet</h2>
                  <div className="bg-emerald-100 p-3 rounded-2xl">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-emerald-600 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2">Available Balance</p>
                  <h3 className="text-5xl font-black tracking-tighter">₹{user.walletBalance}</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Add Money</label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">₹</span>
                        <input 
                          type="number" 
                          placeholder="Enter amount" 
                          className="w-full border border-zinc-200 rounded-xl pl-8 pr-4 py-4 outline-none focus:border-emerald-500"
                          value={walletAmount}
                          onChange={(e) => setWalletAmount(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={addMoney}
                        disabled={loading}
                        className="bg-emerald-600 text-white px-8 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        {loading ? "..." : "Add"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[500, 1000, 2000].map(amt => (
                      <button 
                        key={amt}
                        onClick={() => setWalletAmount(amt.toString())}
                        className="py-3 rounded-xl border border-zinc-100 text-sm font-bold text-zinc-600 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                      >
                        + ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Support View */}
          {view === 'support' && (
            <motion.div 
              key="support"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto h-[600px] flex flex-col"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 flex-1 flex flex-col overflow-hidden">
                <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">24/7 Support</h2>
                      <p className="text-xs text-white/60">We're here to help you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {supportMessages.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl text-sm",
                        msg.role === 'user' 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : "bg-zinc-100 text-zinc-800 rounded-tl-none"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-zinc-100 bg-zinc-50">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      className="flex-1 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 bg-white"
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
                    />
                    <button 
                      onClick={sendSupportMessage}
                      className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Ticket Modal */}
      <AnimatePresence>
        {showSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSchedule(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="bg-emerald-600 p-6 text-white shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black">{showSchedule.name}</h2>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{showSchedule.number} • {showSchedule.from} to {showSchedule.to}</p>
                  </div>
                  <button onClick={() => setShowSchedule(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-0 relative">
                  <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-zinc-100" />
                  
                  {showSchedule.schedule?.map((stop, i) => (
                    <div key={i} className="relative pl-10 pb-8 last:pb-0">
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10",
                        i === 0 || i === (showSchedule.schedule?.length || 0) - 1 ? "bg-emerald-600" : "bg-zinc-200"
                      )}>
                        {i === 0 || i === (showSchedule.schedule?.length || 0) - 1 ? (
                          <MapPin className="w-3 h-3 text-white" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-zinc-800">{stop.station}</h4>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Day {stop.day} • Halt: {stop.halt}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Arr</p>
                              <p className="text-sm font-black text-zinc-900">{stop.arrivalTime}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">Dep</p>
                              <p className="text-sm font-black text-zinc-900">{stop.departureTime}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-zinc-50 border-t border-zinc-100 shrink-0">
                <button 
                  onClick={() => setShowSchedule(null)}
                  className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Close Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <TrainIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">E-TICKET</h2>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">RailEase Official Ticket</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-white/60 uppercase mb-1">PNR Number</p>
                      <p className="text-3xl font-black tracking-tighter">{selectedBooking.pnr}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white/60 uppercase mb-1">Train Number</p>
                      <p className="text-xl font-bold">{selectedBooking.trainNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div className="text-center md:text-left">
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">From</p>
                    <p className="text-2xl font-black text-zinc-900">{selectedBooking.fromStation}</p>
                    <p className="text-sm font-medium text-zinc-500">{selectedBooking.date}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                    <div className="h-[2px] w-full bg-zinc-100 relative">
                      <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-zinc-300" />
                      <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-zinc-300" />
                      <TrainIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 bg-white" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedBooking.classType}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs font-bold text-zinc-400 uppercase mb-1">To</p>
                    <p className="text-2xl font-black text-zinc-900">{selectedBooking.toStation}</p>
                    <p className="text-sm font-medium text-zinc-500">Confirmed</p>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-6">
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-4">Passenger List</p>
                  <div className="space-y-4">
                    {selectedBooking.passengers.map((p, i) => (
                      <div key={i} className="flex justify-between items-center pb-4 border-b border-zinc-200 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-zinc-800">{p.name}</p>
                          <p className="text-xs text-zinc-500">{p.age} yrs • {p.gender} • {p.seatPreference}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-zinc-400 uppercase">Coach/Seat</p>
                          <p className="font-black text-emerald-600">S{i+1} / {30 + i * 2}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2">
                    <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Status</p>
                      <p className="font-bold text-emerald-600">VALID TICKET</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-400 uppercase">Total Paid</p>
                    <p className="text-2xl font-black text-zinc-900">{formatCurrency(selectedBooking.totalAmount)}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-dashed border-zinc-200 flex justify-center">
                  <div className="bg-zinc-100 p-4 rounded-xl flex flex-col items-center gap-2">
                    <div className="w-48 h-12 bg-zinc-800 rounded flex items-center justify-center gap-1 px-2">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className={cn("bg-white w-1", i % 3 === 0 ? "h-8" : "h-6")} />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-[0.5em] uppercase">Scan for Verification</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Full Name</label>
                      <input name="fullName" type="text" required className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="John Doe" />
                    </div>
                  )}
                  {authMode === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Email Address</label>
                      <input name="email" type="email" required className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="john@example.com" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Username</label>
                    <input name="username" type="text" required className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="johndoe123" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Password</label>
                    <input name="password" type="password" required className="w-full border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500" placeholder="••••••••" />
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all mt-4 shadow-lg shadow-emerald-100">
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-zinc-500">
                    {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="ml-2 text-emerald-600 font-bold hover:underline"
                    >
                      {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

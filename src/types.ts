export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  walletBalance: number;
}

export interface ScheduleStop {
  station: string;
  arrivalTime: string;
  departureTime: string;
  halt: string;
  day: number;
}

export interface Train {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  days: string[];
  schedule?: ScheduleStop[];
}

export interface ClassAvailability {
  type: string;
  price: number;
  status: 'Available' | 'RAC' | 'Waiting List';
  count: number;
}

export interface Passenger {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  seatPreference: 'Lower' | 'Middle' | 'Upper' | 'Side Lower' | 'Side Upper';
}

export interface Booking {
  id: string;
  userId: string;
  pnr: string;
  trainId: string;
  trainName: string;
  trainNumber: string;
  from: string;
  to: string;
  date: string;
  classType: string;
  passengers: Passenger[];
  totalAmount: number;
  status: 'Confirmed' | 'Cancelled';
  bookingDate: string;
}

export interface LiveStatus {
  trainNumber: string;
  currentStation: string;
  nextStation: string;
  delay: string;
  lastUpdated: string;
}

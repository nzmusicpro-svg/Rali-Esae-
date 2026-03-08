import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("railway.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    walletBalance REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS trains (
    id TEXT PRIMARY KEY,
    number TEXT,
    name TEXT,
    fromStation TEXT,
    toStation TEXT,
    departureTime TEXT,
    arrivalTime TEXT,
    duration TEXT,
    days TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT,
    pnr TEXT,
    trainId TEXT,
    trainName TEXT,
    trainNumber TEXT,
    fromStation TEXT,
    toStation TEXT,
    date TEXT,
    classType TEXT,
    passengers TEXT,
    totalAmount REAL,
    status TEXT,
    bookingDate TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Seed initial data
const seedTrains = [
  { id: '1', number: '12423', name: 'Rajdhani Express', from: 'Guwahati', to: 'New Delhi', dep: '06:00', arr: '10:30', dur: '28h 30m', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' },
  { id: '2', number: '12012', name: 'Shatabdi Express', from: 'New Delhi', to: 'Kalka', dep: '07:40', arr: '11:45', dur: '4h 05m', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' },
  { id: '3', number: '12259', name: 'Duronto Express', from: 'Sealdah', to: 'New Delhi', dep: '18:30', arr: '11:00', dur: '16h 30m', days: 'Mon,Wed,Thu,Sun' },
  { id: '4', number: '12951', name: 'Mumbai Rajdhani', from: 'Mumbai Central', to: 'New Delhi', dep: '17:00', arr: '08:32', dur: '15h 32m', days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' },
  { id: '5', number: '22435', name: 'Vande Bharat Express', from: 'Varanasi', to: 'New Delhi', dep: '15:00', arr: '23:00', dur: '8h 00m', days: 'Mon,Tue,Wed,Fri,Sat,Sun' },
  { id: '6', number: '12509', name: 'Guwahati Express', from: 'Bengaluru', to: 'Guwahati', dep: '23:40', arr: '05:50', dur: '54h 10m', days: 'Wed,Thu,Fri' },
  { id: '7', number: '12510', name: 'Kaziranga Express', from: 'Guwahati', to: 'Bengaluru', dep: '06:30', arr: '11:40', dur: '53h 10m', days: 'Mon,Tue,Sun' },
];

const insertTrain = db.prepare(`
  INSERT OR IGNORE INTO trains (id, number, name, fromStation, toStation, departureTime, arrivalTime, duration, days)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

seedTrains.forEach(t => {
  insertTrain.run(t.id, t.number, t.name, t.from, t.to, t.dep, t.arr, t.dur, t.days);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, username, password } = req.body;
    try {
      const id = uuidv4();
      db.prepare("INSERT INTO users (id, fullName, email, username, password, walletBalance) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, fullName, email, username, password, 500); // Give 500 welcome bonus
      res.json({ id, fullName, email, username, walletBalance: 500 });
    } catch (error) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, fullName, email, username, walletBalance FROM users WHERE username = ? AND password = ?")
      .get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Wallet Routes
  app.post("/api/wallet/add", (req, res) => {
    const { userId, amount } = req.body;
    db.prepare("UPDATE users SET walletBalance = walletBalance + ? WHERE id = ?").run(amount, userId);
    const user = db.prepare("SELECT walletBalance FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  app.post("/api/wallet/deduct", (req, res) => {
    const { userId, amount } = req.body;
    const user = db.prepare("SELECT walletBalance FROM users WHERE id = ?").get(userId);
    if (user.walletBalance >= amount) {
      db.prepare("UPDATE users SET walletBalance = walletBalance - ? WHERE id = ?").run(amount, userId);
      const updatedUser = db.prepare("SELECT walletBalance FROM users WHERE id = ?").get(userId);
      res.json(updatedUser);
    } else {
      res.status(400).json({ error: "Insufficient balance" });
    }
  });

  // Train Routes
  app.get("/api/trains/search", (req, res) => {
    const { from, to } = req.query;
    const trains = db.prepare("SELECT * FROM trains WHERE fromStation LIKE ? AND toStation LIKE ?")
      .all(`%${from}%`, `%${to}%`);
    res.json(trains);
  });

  // Booking Routes
  app.post("/api/bookings", (req, res) => {
    const { userId, pnr, trainId, trainName, trainNumber, from, to, date, classType, passengers, totalAmount } = req.body;
    const id = uuidv4();
    const bookingDate = new Date().toISOString();
    db.prepare(`
      INSERT INTO bookings (id, userId, pnr, trainId, trainName, trainNumber, fromStation, toStation, date, classType, passengers, totalAmount, status, bookingDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, pnr, trainId, trainName, trainNumber, from, to, date, classType, JSON.stringify(passengers), totalAmount, 'Confirmed', bookingDate);
    res.json({ id, pnr, status: 'Confirmed' });
  });

  app.get("/api/bookings/:userId", (req, res) => {
    const bookings = db.prepare("SELECT * FROM bookings WHERE userId = ? ORDER BY bookingDate DESC")
      .all(req.params.userId);
    res.json(bookings.map(b => ({ ...b, passengers: JSON.parse(b.passengers as string) })));
  });

  app.post("/api/bookings/:id/cancel", (req, res) => {
    db.prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?").run(req.params.id);
    res.json({ status: 'Cancelled' });
  });

  // Live Status Mock
  app.get("/api/trains/:number/status", (req, res) => {
    const stations = ["Ghaziabad", "Kanpur Central", "Prayagraj Jn", "Varanasi Jn", "Patna Jn", "Gaya Jn", "Dhanbad Jn", "Asansol Jn", "Howrah Jn"];
    const randomIdx = Math.floor(Math.random() * stations.length);
    res.json({
      trainNumber: req.params.number,
      currentStation: stations[randomIdx],
      nextStation: stations[(randomIdx + 1) % stations.length],
      delay: Math.random() > 0.7 ? "15 mins" : "On Time",
      lastUpdated: new Date().toLocaleTimeString()
    });
  });

  // Train Schedule Mock
  app.get("/api/trains/:number/schedule", (req, res) => {
    const schedule = [
      { station: "Origin Station", arrivalTime: "--", departureTime: "06:00", halt: "--", day: 1 },
      { station: "Intermediate Stop 1", arrivalTime: "08:30", departureTime: "08:35", halt: "5m", day: 1 },
      { station: "Intermediate Stop 2", arrivalTime: "11:20", departureTime: "11:30", halt: "10m", day: 1 },
      { station: "Major Junction", arrivalTime: "14:45", departureTime: "15:00", halt: "15m", day: 1 },
      { station: "Intermediate Stop 3", arrivalTime: "18:10", departureTime: "18:15", halt: "5m", day: 1 },
      { station: "Intermediate Stop 4", arrivalTime: "21:40", departureTime: "21:45", halt: "5m", day: 1 },
      { station: "Destination Station", arrivalTime: "23:30", departureTime: "--", halt: "--", day: 1 },
    ];
    res.json(schedule);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

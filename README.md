# 📈 TradeLog Pro

A full-featured trading journal built with React + Vite, Firebase, and Recharts.

## Features
- 🔐 Auth — Google login + Email/Password
- 📋 Journal — Log trades with full position entry details
- ↑ Position Entry — Entry price, qty, stop loss, take profit targets (with R:R calc)
- ↓ Exits — Record partial closes with per-exit P&L tracking
- 📊 Analytics — Equity curve, monthly P&L, strategy breakdown, win/loss ratio
- ⬆⬇ CSV Import / Export
- 📱 Mobile responsive

---

## Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Create Firebase project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `tradelog`
3. Add a **Web App** (click `</>` icon)
4. Copy the `firebaseConfig` object

### 3. Enable Firebase services
- **Authentication** → Sign-in method → Enable **Google** and **Email/Password**
- **Firestore Database** → Create database → Start in **production mode**
- Add this Firestore security rule:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/trades/{tradeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Paste your Firebase config
Open `src/lib/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
}
```

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Build for production
```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or Firebase Hosting.

---

## Project Structure
```
src/
├── lib/
│   ├── firebase.js       # Firebase init + config
│   ├── calc.js           # Trade P&L calculations
│   └── csv.js            # Import / export logic
├── context/
│   └── AuthContext.jsx   # Firebase auth state
├── hooks/
│   └── useTrades.js      # Firestore CRUD + real-time listener
├── components/
│   ├── ui/               # Shared UI primitives
│   ├── layout/           # Navbar + layout wrapper
│   └── trades/           # Position entry, exits, detail modal
└── pages/
    ├── AuthPage.jsx       # Login / register
    ├── JournalPage.jsx    # Trade list + filters
    ├── TradePage.jsx      # New / edit trade form
    └── AnalyticsPage.jsx  # Charts + stats
```

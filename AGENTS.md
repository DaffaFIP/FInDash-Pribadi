# AGENTS.md — FinDash-Pribadi

## Stack
- **Frontend**: React 19 + Vite 8, JavaScript (JSX), no TypeScript
- **Styling**: Tailwind CSS via CDN (`cdn.tailwindcss.com` in `index.html`) — no PostCSS config
- **State**: Local `useState` per component, no global store
- **Backend**: Firebase Auth + Firestore (`transactions` collection)
- **AI Server**: Express 5 in `server/`, supports Ollama (local) or Open Router (cloud, via `server/.env`)
- **Package manager**: npm (two separate `package.json` — root and `server/`)

## Commands
```sh
npm run dev        # Jalankan Vite + AI server bersamaan (via concurrently)
npm run dev:fe     # Vite dev server saja
npm run dev:server # AI server saja
npm run build      # Vite production build
npm run lint       # ESLint flat config (`eslint.config.js`)
npm run preview    # Vite preview build
```

> **No test runner, no typecheck, no CI configured.**

## Architecture essentials
- **Entry**: `src/main.jsx` → `src/App.jsx` — `BrowserRouter` with Firebase `onAuthStateChanged`
- **Routes** (all protected except `/login`):
  - `/` → `AddData`, `/home` → `Home`, `/login` → `Login`, `/ai` → `AIChat`, `/about` → `About`
- **Auth**: email/password via Firebase Auth; token passed to Express AI server
- **UI language**: Indonesian (labels, messages)
- **Currency**: IDR via `Intl.NumberFormat("id-ID", ...)`

## AI Server (server/)
- Runs on `http://localhost:3001`
- Requires Ollama running locally with model `gemma4:e2b`
- Endpoints: `POST /init-ai` (loads 50 transactions into memory), `POST /ask-ai`
- Requires Firebase ID token in `Authorization: Bearer <token>` header
- No `npm start` script exists — run `node server.js`
- `serviceAccountKey.json` is committed (Firebase Admin SDK credentials)
- Dukungan Open Router: atur `AI_PROVIDER=openrouter` dan `OPENROUTER_API_KEY` di `server/.env`
- Bisa ganti provider langsung dari halaman AI Assistant (tombol Ollama / Open Router)

## Code quirks
- `src/App.css` and `src/index.css` are empty — all styling is inline Tailwind classes
- `src/pages/Home copy.jsx` is dead code (not imported anywhere)
- Firestore collection: `transactions`, field `Date` (capital D) is a Firestore Timestamp — convert with `.toDate()`
- `useMemo` used extensively for client-side filtering/grouping (date ranges, categories)

## Operational notes
- Both `npm install` (root) and `cd server && npm install` are needed for a fresh clone
- The AI server must be started **after** Ollama is running
- AIChat calls `/init-ai` on mount — this loads transaction data into server RAM (not persisted across restarts)

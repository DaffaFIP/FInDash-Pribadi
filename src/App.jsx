import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom'

import Home from './pages/Home'
import AddData from './pages/AddData'
import Login from './pages/Login'
import AIChat from './pages/AIChat'
import ProtectedRoute from "./pages/ProtectedRoute";
import ErrorBoundary from "./pages/ErrorBoundary";
import { FirestoreProvider, useFirestore } from "./context/FirestoreContext";
import MobileBottomNav from './components/MobileBottomNav'

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

function StatusBanner() {
  const { isOnline, expense, income } = useFirestore();
  const pending = (expense.data || []).filter((d) => d._pending).length +
    (income.data || []).filter((d) => d._pending).length;

  if (!isOnline) {
    return (
      <div className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-900">
        Offline — showing {expense.fromCache ? "cached" : "live"} data
        {pending > 0 && ` (${pending} pending)`}
      </div>
    );
  }
  return null;
}

function MobileHeader({ user }) {
  const location = useLocation();

  const titleMap = {
    "/home": "Dashboard",
    "/adddata": "Add Transaction",
    "/ai": "AI Assistant",
    "/login": "Profile",
  };

  const title = titleMap[location.pathname] || "FinanceApp";

  return (
    <header className="flex items-center justify-between border-b bg-white/80 dark:bg-slate-900/80 px-4 py-3 backdrop-blur md:hidden">
      <Link to="/" className="text-lg font-bold text-indigo-600">
        {title}
      </Link>
      {user && (
        <Link
          to="/login"
          className="flex items-center gap-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            {user.email?.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[120px] truncate text-sm text-slate-600 dark:text-slate-300">
            {user.email}
          </span>
        </Link>
      )}
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(true);

  // check firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      setShowNavbar(window.scrollY < 10 || window.scrollY < lastScrollY);
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-5">

          {/* spinner */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>

            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-slate-700 dark:border-t-slate-300"></div>
          </div>

          {/* text */}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Loading application
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Please wait a moment...
            </p>
          </div>

        </div>
      </div>
    );
  }



  return (
    <BrowserRouter>
      <FirestoreProvider user={user}>
      <div className="flex min-h-screen flex-col">

      <nav
        className={`
  hidden md:flex
  sticky top-0 z-50
  border-b
  bg-white/80 dark:bg-slate-900/80
  backdrop-blur dark:backdrop-blur
  transition-transform
  duration-300
  ${showNavbar
            ? "translate-y-0"
            : "-translate-y-full"
          }
`}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

          {/* Logo */}
          <Link
            to="/"
            className="text-center text-xl font-bold text-indigo-600 sm:text-2xl"
          >
            FinanceApp
          </Link>

          {/* Menu */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">

            <Link
              to="/home"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:text-indigo-600 sm:text-base"
            >
              Home
            </Link>

            <Link
              to="/adddata"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:text-indigo-600 sm:text-base"
            >
              Add Data
            </Link>

            <Link to="/ai" className="text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:text-indigo-600 sm:text-base" > AI Assistant </Link>

            <Link
              to="/login"
              className="max-w-[140px] truncate rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 sm:max-w-none sm:px-4 sm:text-sm"
            >
              {user ? user.email : "Login"}
            </Link>

          </div>
        </div>
      </nav>

      <MobileHeader user={user} />

      <StatusBanner />

      <main className="flex-1 pb-20 md:pb-0">
        <ErrorBoundary>
        <Routes>

        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <AddData />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute user={user}>
              <Home user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adddata"
          element={
            <ProtectedRoute user={user}>
              <AddData />
            </ProtectedRoute>
          }
        />


        <Route path="/login" element={<Login />} />

        <Route
          path="/ai"
          element={
            <ProtectedRoute user={user}>
              <AIChat user={user} />
            </ProtectedRoute>
          }
        />


        </Routes>
        </ErrorBoundary>
      </main>

      <div className="hidden md:block border-t dark:border-slate-700 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <a
          href="https://daffafip.my.id"
        >
          © {new Date().getFullYear()} Daffa Faadihilah
        </a>
      </div>

      <MobileBottomNav />

      </div>
      </FirestoreProvider>
    </BrowserRouter>
  );
}
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate
} from 'react-router-dom'

import Home from './pages/Home'
import About from './pages/About'
import AddData from './pages/AddData'
import Login from './pages/Login'
import AIChat from './pages/AIChat'
import ProtectedRoute from "./pages/ProtectedRoute";
import ErrorBoundary from "./pages/ErrorBoundary";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(true);

  // cek login firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // sembunyikan navbar saat scroll down, tampilkan saat scroll up
  useEffect(() => {

    let lastScrollY = window.scrollY;

    const handleScroll = () => {

      if (window.scrollY < 10) {
        setShowNavbar(true);
        return;
      }

      if (window.scrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      lastScrollY = window.scrollY;
    };


    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {

      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };

  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-5">

          {/* spinner */}
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200"></div>

            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-slate-700"></div>
          </div>

          {/* text */}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Memuat aplikasi
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Mohon tunggu sebentar...
            </p>
          </div>

        </div>
      </div>
    );
  }



  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">

      <nav
        className={`
  sticky top-0 z-50
  border-b
  bg-white/80
  backdrop-blur
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
              className="text-sm font-medium text-slate-700 transition hover:text-indigo-600 sm:text-base"
            >
              Home
            </Link>

            <Link
              to="/adddata"
              className="text-sm font-medium text-slate-700 transition hover:text-indigo-600 sm:text-base"
            >
              Add Data
            </Link>

            <Link to="/ai" className="text-sm font-medium text-slate-700 transition hover:text-indigo-600 sm:text-base" > AI Assistant </Link>

            <Link
              to="/login"
              className="max-w-[140px] truncate rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:max-w-none sm:px-4 sm:text-sm"
            >
              {user ? user.email : "Login"}
            </Link>

          </div>
        </div>
      </nav>

      <main className="flex-1">
        <ErrorBoundary>
        <Routes>

        <Route
          path="/"
          element={
            <ProtectedRoute user={user}>
              <AddData user={user} />
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
          path="/about"
          element={
            <ProtectedRoute user={user}>
              <About user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adddata"
          element={
            <ProtectedRoute user={user}>
              <AddData user={user} />
            </ProtectedRoute>
          }
        />


        <Route path="/login" element={<Login user={user} />} />

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

      <div className="border-t py-4 text-center text-sm text-slate-500">
        <a
          href="https://daffafip.my.id"
        >
          © {new Date().getFullYear()} Daffa Faadihilah
        </a>
      </div>

      </div>

    </BrowserRouter>
  );
}
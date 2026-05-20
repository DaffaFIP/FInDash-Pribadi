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
import ProtectedRoute from "./pages/ProtectedRoute";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // cek login firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // tunggu firebase selesai cek login
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>

      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
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

            <Link
              to="/login"
              className="max-w-[140px] truncate rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:max-w-none sm:px-4 sm:text-sm"
            >
              {user ? user.email : "Login"}
            </Link>

          </div>
        </div>
      </nav>

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

      </Routes>

      <div className="border-t py-4 text-center text-sm text-slate-500">
        <a
          href="https://daffafip.my.id"
          target="_blank"
          rel="noopener noreferrer"
        >
          © {new Date().getFullYear()} Daffa Faadihilah
        </a>
      </div>

    </BrowserRouter>
  );
}
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            to="/"
            className="text-2xl font-bold text-indigo-600"
          >
            FinanceApp
          </Link>

          <div className="flex items-center gap-6">

            <Link
              to="/home"
              className="font-medium text-slate-700 transition hover:text-indigo-600"
            >
              Home
            </Link>

            <Link
              to="/adddata"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700"
            >
              Add Data
            </Link>

            <Link
              to="/login"
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
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
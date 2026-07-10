import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";
import ChangePassModal from "./ChangePassModal";
import SuccessModal from "./SuccessModal";
import DataExportImport from "./DataExportImport";
import MasterCategory from "./MasterCategory";

// ...existing code...

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // CEK USER LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg("Login successful!");
      setShowSuccess(true);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    setIsLoading(true);
    setMessage("");
    await signOut(auth);
    setIsLoading(false);
    setSuccessMsg("Logout successful!");
    setShowSuccess(true);
  };



  return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
          Firebase Login
        </h1>

        {user ? (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back,</p>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logout...
                </span>
              ) : (
                "Logout"
              )}
            </button>

            <button
              onClick={() => setIsChangePwOpen(true)}
              className="mt-2 w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition"
            >
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border dark:border-slate-600 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border dark:border-slate-600 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Login...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-medium ${
              message.includes("successful")
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {user && (
        <DataExportImport
          user={user}
          onSuccess={(msg) => { setSuccessMsg(msg); setShowSuccess(true); }}
          onError={(msg) => setMessage(msg)}
        />
      )}
      </div>

      {user && (
        <MasterCategory
          onSuccess={(msg) => { setSuccessMsg(msg); setShowSuccess(true); }}
        />
      )}

      <ChangePassModal
        isOpen={isChangePwOpen}
        onClose={() => setIsChangePwOpen(false)}
        user={auth.currentUser}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setShowSuccess(true);
          setIsChangePwOpen(false);
        }}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMsg}
      />
    </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

// ...existing code...

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ...existing code...

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
      setMessage("Login berhasil!");
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
    setMessage("Logout berhasil!");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01]"
        style={{
          width: "300px",
          margin: "100px auto",
          padding: "20px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "16px",
          
        }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Firebase Login
            </span>
          </h2>
        </div>

        {/* INFO USER */}
        {user ? (
          <div className="animate-fade-in-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-gray-500">Selamat datang kembali,</p>
                <p className="text-base font-semibold text-gray-800">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          </div>
        ) : (
          <form onSubmit={handleLogin} className="animate-fade-in-up">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Masukkan email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                style={{
                  width: "100%",
                  padding: "10px",
                }}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                style={{
                  width: "100%",
                  padding: "10px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

        {/* POPUP MESSAGE */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg text-center font-medium transition-all duration-300 transform animate-fade-in-up ${
              message.includes("berhasil")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
            style={{
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
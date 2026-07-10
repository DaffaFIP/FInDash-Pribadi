import { Link, useLocation } from "react-router-dom";
import { Home, Plus, MessageSquare, User } from "lucide-react";

export default function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname === path;
  };

  return (
    <>
      <style>{`
        @keyframes fab-press {
          0% { transform: scale(1); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        .fab-press:active { animation: fab-press 0.15s ease-out; }
      `}</style>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t dark:border-slate-700 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-end justify-around px-2 h-16">

            {/* Home */}
            <Link
              to="/home"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition ${
                isActive("/home")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <Home size={22} fill={isActive("/home") ? "currentColor" : "none"} strokeWidth={2} />
              <span className="text-[10px] font-medium">Home</span>
            </Link>

            {/* Add (FAB) */}
            <Link
              to="/adddata"
              className="flex flex-1 items-end justify-center h-full"
            >
              <span className="fab-press absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700">
                <Plus size={26} strokeWidth={2.5} />
              </span>
            </Link>

            {/* AI */}
            <Link
              to="/ai"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition ${
                isActive("/ai")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <MessageSquare size={22} fill={isActive("/ai") ? "currentColor" : "none"} strokeWidth={2} />
              <span className="text-[10px] font-medium">AI</span>
            </Link>

            {/* Profile */}
            <Link
              to="/login"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full pt-2 transition ${
                isActive("/login")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <User size={22} fill={isActive("/login") ? "currentColor" : "none"} strokeWidth={2} />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>

          </div>
        </div>
      </nav>
    </>
  );
}

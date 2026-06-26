import { useState, useEffect, useRef } from "react";

export default function DeepSeekPassModal({ isOpen, onClose, onSubmit, loading, error }) {
  const [password, setPassword] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const prevOpen = useRef(isOpen);
  const inputRef = useRef(null);

  useEffect(() => {
    if (prevOpen.current && !isOpen) {
      setIsClosing(true);
      const timer = setTimeout(() => setIsClosing(false), 300);
      return () => clearTimeout(timer);
    }
    prevOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password);
  };

  return (
    <>
      <style>{`
        @keyframes popup {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popup { animation: popup 0.3s ease-out; }

        @keyframes popup-close {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.7); opacity: 0; }
        }
        .animate-popup-close { animation: popup-close 0.3s ease-in forwards; }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>

      <div className={`fixed inset-0 z-50 flex ${isClosing ? "" : "animate-fade-in"} items-center justify-center bg-black/50`}>
        <div className={`${isClosing ? "animate-popup-close" : "animate-popup"} w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6`}>
          <h2 className="mb-4 text-2xl font-bold dark:text-slate-100">
            DeepSeek Access
          </h2>

          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Enter password to enable DeepSeek AI
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              ref={inputRef}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border dark:border-slate-600 p-3 dark:bg-slate-700 dark:text-slate-200"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg bg-slate-300 dark:bg-slate-600 dark:text-slate-200 px-4 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Unlock"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

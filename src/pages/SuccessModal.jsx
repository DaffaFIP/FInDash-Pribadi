import { useEffect, useState } from "react";

export default function SuccessModal({ isOpen, onClose, message = "Data updated successfully" }) {
  const [progress, setProgress] = useState(100);
  const DURATION = 3000;

  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(100);
      return;
    }

    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        onClose();
      }
    }, 30);

    return () => clearInterval(id);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes popup {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popup { animation: popup 0.3s ease-out; }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }

        @keyframes pop-icon {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pop-icon { animation: pop-icon 0.4s ease-out 0.1s both; }

      `}</style>

      <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50">
        <div className="animate-popup w-80 rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="animate-pop-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{message}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Closing automatically...</p>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-1 bg-green-500 transition-[width] duration-75 ease-linear" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </>
  );
}

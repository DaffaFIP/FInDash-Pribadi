import { useEffect } from "react";

export default function SuccessModal({ isOpen, onClose, message = "Data updated successfully" }) {
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`@keyframes popup { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } } .animate-popup { animation: popup 0.3s ease-out; }`}</style>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50">
        <div className="animate-popup w-80 rounded-2xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{message}</h2>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
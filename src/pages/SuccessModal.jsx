import { useEffect, useState } from "react";

export default function SuccessModal({ isOpen, onClose, message = "Data berhasil diperbarui" }) {
  const [progress, setProgress] = useState(100);
  const DURATION = 3000;

  useEffect(() => {
    if (!isOpen) {
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

      <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50">
        <div className="animate-popup w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
          <div className="animate-pop-icon mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            {message}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Tutup secara otomatis...</p>
          <button
            onClick={onClose}
            className="relative mt-4 w-full overflow-hidden rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-200"
          >
            <span className="relative z-10">Tutup</span>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-green-500 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </button>
        </div>
      </div>
    </>
  );
}

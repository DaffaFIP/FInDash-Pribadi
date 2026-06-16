export default function DeleteModal({
    isOpen,
    setIsDeleteOpen,
    confirmDelete,
  }) {
  
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
        `}</style>

        <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50">

        <div className="animate-popup w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">

          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Confirm Delete
          </h2>
  
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this data?
          </p>
  
          <div className="mt-6 flex justify-end gap-3">
  
            <button
              onClick={() =>
                setIsDeleteOpen(false)
              }
              className="rounded-lg bg-slate-200 dark:bg-slate-600 dark:text-slate-200 px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Cancel
            </button>
  
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Delete
            </button>
  
          </div>
        </div>
      </div>
    </>
    );
  }
export default function DeleteModal({
    isOpen,
    setIsDeleteOpen,
    confirmDelete,
  }) {
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
  
          <h2 className="text-xl font-semibold text-slate-800">
            Konfirmasi Hapus
          </h2>
  
          <p className="mt-3 text-slate-600">
            Yakin ingin menghapus data ini?
          </p>
  
          <div className="mt-6 flex justify-end gap-3">
  
            <button
              onClick={() =>
                setIsDeleteOpen(false)
              }
              className="rounded-lg bg-slate-200 px-4 py-2 hover:bg-slate-300"
            >
              Batal
            </button>
  
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Hapus
            </button>
  
          </div>
        </div>
      </div>
    );
  }
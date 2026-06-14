export default function EditCategory({ isOpen, editData, setEditData, onClose, onSave }) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

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
        <div className="animate-popup w-full max-w-md rounded-2xl bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            {editData.id ? "Edit Category" : "Add Category"}
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleChange}
              placeholder="Category name"
              className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />

            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={editData.color}
                onChange={handleChange}
                className="w-10 h-10 rounded cursor-pointer border shrink-0"
              />
              <input
                type="text"
                name="color"
                value={editData.color}
                onChange={handleChange}
                placeholder="#06B6D4"
                className="w-full rounded-lg border p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-200 px-4 py-2 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

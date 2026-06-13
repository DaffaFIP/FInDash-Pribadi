export default function EditModal({
    isOpen,
    editData,
    setEditData,
    setIsEditOpen,
    handleUpdate,
  }) {
  
    if (!isOpen) return null;
  
    const handleChange = (e) => {
      setEditData({
        ...editData,
        [e.target.name]:
          e.target.value,
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
  
          <h2 className="mb-4 text-2xl font-bold">
            Edit Transaction
          </h2>
  
          <div className="space-y-4">
  
            <input
              type="text"
              name="title"
              value={editData.title}
              onChange={handleChange}
              placeholder="Title"
              className="w-full rounded-lg border p-3"
            />
  
            <input
              type="text"
              name="category"
              value={editData.category}
              onChange={handleChange}
              placeholder="Category"
              className="w-full rounded-lg border p-3"
            />
  
            <input
              type="number"
              name="amount"
              value={editData.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="w-full rounded-lg border p-3"
            />
  
            <input
              type="date"
              name="Date"
              value={editData.Date}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
            />
  
            <div className="flex justify-end gap-2">
  
              <button
                onClick={() =>
                  setIsEditOpen(false)
                }
                className="rounded-lg bg-slate-300 px-4 py-2"
              >
                Cancel
              </button>
  
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white"
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
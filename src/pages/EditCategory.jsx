import { useState } from "react";

const ICONS = [
  "utensils", "coffee", "cake", "burger", "carrot", "apple-whole", "egg", "fish",
  "car", "bus", "motorcycle", "bicycle", "gas-pump", "plane", "train", "truck",
  "wifi", "lightbulb", "bolt", "water", "phone", "envelope", "tv", "laptop",
  "film", "gamepad", "music", "headset", "book", "camera", "dice", "guitar",
  "cart-shopping", "bag-shopping", "gift", "tag", "gem", "wallet", "coins", "piggy-bank",
  "heart-pulse", "dumbbell", "person-running", "soap", "house", "paw", "tree", "leaf",
  "users", "globe", "clock", "calendar", "star", "heart", "bell", "gear",
];

export default function EditCategory({ isOpen, editData, setEditData, onClose, onSave }) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="animate-popup w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
            {editData.id ? "Edit Category" : "Add Category"}
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleChange}
              placeholder="Category name"
              className="w-full rounded-lg border dark:border-slate-600 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
            />

            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={editData.color}
                onChange={handleChange}
                className="w-10 h-10 rounded cursor-pointer border dark:border-slate-600 shrink-0"
              />
              <input
                type="text"
                name="color"
                value={editData.color}
                onChange={handleChange}
                placeholder="#06B6D4"
                className="w-full rounded-lg border dark:border-slate-600 p-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icon name..."
                className="w-full rounded-lg border dark:border-slate-600 p-2 mb-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 rounded-lg border dark:border-slate-600">
                {filtered.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => {
                      setEditData({ ...editData, icon });
                      setSearch("");
                    }}
                    className={`flex items-center justify-center w-9 h-9 rounded-lg border text-lg transition ${
                      editData.icon === icon
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
                        : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                    }`}
                    title={icon}
                    type="button"
                  >
                    <i className={`fa-solid fa-${icon}`} />
                  </button>
                ))}
                {search && filtered.length === 0 && (
                  <div className="col-span-8 py-3 text-center text-sm text-slate-400 dark:text-slate-500">
                    No matching icon.
                  </div>
                )}
              </div>
              {editData.icon && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Selected: <code className="text-indigo-500">fa-{editData.icon}</code>
                  </p>
                  <button
                    onClick={() => setEditData({ ...editData, icon: "" })}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              )}
              {search && !ICONS.includes(search) && (
                <button
                  onClick={() => {
                    setEditData({ ...editData, icon: search });
                    setSearch("");
                  }}
                  className="mt-2 w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg py-2 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                  type="button"
                >
                  <i className="fa-solid fa-magic" />
                  Use custom icon: <code>fa-{search}</code>
                </button>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-200 dark:bg-slate-600 dark:text-slate-200 px-4 py-2 hover:bg-slate-300 dark:hover:bg-slate-500"
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

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import DeleteModal from "./DeleteModal";
import EditCategory from "./EditCategory";

export default function MasterCategory({ user, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "mastercategory"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCategories(list);
      setCatLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleDeleteCat = (cat) => {
    setDeleteTarget(cat);
  };

  const confirmDeleteCat = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "mastercategory", deleteTarget.id));
      setDeleteTarget(null);
      onSuccess?.("Category deleted successfully");
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditTarget({ name: "", color: "#4F46E5", icon: "" });
  };

  const handleEditCat = (cat) => {
    setEditTarget({ id: cat.id, name: cat.name, color: cat.color, icon: cat.icon || "" });
  };

  const handleSaveCat = async () => {
    if (!editTarget || !editTarget.name.trim()) return;
    try {
      if (editTarget.id) {
        await updateDoc(doc(db, "mastercategory", editTarget.id), {
          name: editTarget.name.trim(),
          color: editTarget.color,
          icon: editTarget.icon || "",
        });
        onSuccess?.("Category updated successfully");
      } else {
        await addDoc(collection(db, "mastercategory"), {
          name: editTarget.name.trim(),
          color: editTarget.color,
          icon: editTarget.icon || "",
          uid: user.uid,
        });
        onSuccess?.("Category added successfully");
      }
      setEditTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="w-full rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Master Category
        </h3>

        {catLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No categories yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-2 text-slate-500 dark:text-slate-400 font-medium w-10">
                    No
                  </th>
                  <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">
                    Category Name
                  </th>
                  <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">
                    Color
                  </th>
                  <th className="py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">
                    Icon
                  </th>
                  <th className="py-2 pl-2 text-slate-500 dark:text-slate-400 font-medium w-16">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((cat, i) => (
                  <tr key={cat.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <td className="py-2 pr-2 text-slate-400 dark:text-slate-500">{i + 1}</td>
                    <td className="py-2 px-2 font-medium text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {cat.icon ? (
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid fa-${cat.icon} text-lg text-slate-400 dark:text-slate-500`} />
                          <span className="text-xs text-slate-400 dark:text-slate-500">{cat.icon}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditCat(cat)}
                            className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCat(cat)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M3 6h18" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={handleOpenAdd}
          className="w-full mt-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition"
        >
          + Add Category
        </button>
      </div>

      <EditCategory
        isOpen={!!editTarget}
        editData={editTarget}
        setEditData={setEditTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveCat}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        setIsDeleteOpen={() => setDeleteTarget(null)}
        confirmDelete={confirmDeleteCat}
      />
    </>
  );
}

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
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

import { auth, db } from "../firebase";
import DeleteModal from "./DeleteModal";
import EditCategory from "./EditCategory";
import SuccessModal from "./SuccessModal";

// ...existing code...

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ...existing code...

  // CEK USER LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login successful!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    setIsLoading(true);
    setMessage("");
    await signOut(auth);
    setMessage("Logout successful!");
  };

  // CATEGORY MASTER
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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
      setSuccessMsg("Category deleted successfully");
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditTarget({ name: "", color: "#4F46E5" });
  };

  const handleEditCat = (cat) => {
    setEditTarget({ id: cat.id, name: cat.name, color: cat.color });
  };

  const handleSaveCat = async () => {
    if (!editTarget || !editTarget.name.trim()) return;
    try {
      if (editTarget.id) {
        await updateDoc(doc(db, "mastercategory", editTarget.id), {
          name: editTarget.name.trim(),
          color: editTarget.color,
        });
        setSuccessMsg("Category updated successfully");
      } else {
        await addDoc(collection(db, "mastercategory"), {
          name: editTarget.name.trim(),
          color: editTarget.color,
          uid: user.uid,
        });
        setSuccessMsg("Category added successfully");
      }
      setEditTarget(null);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
      <div className="flex flex-col lg:flex-row min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 gap-6 pt-12">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            <span className="text-indigo-600">Firebase Login</span>
          </h2>
        </div>

        {user ? (
          <div className="animate-fade-in-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back,</p>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logout...
                </span>
              ) : (
                "Logout"
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="animate-fade-in-up">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border dark:border-slate-600 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border dark:border-slate-600 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-slate-700 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Login...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>
        )}

        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-medium ${
              message.includes("successful")
                ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {user && (
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow self-start">
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
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {cat.color}
                          </span>
                        </div>
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
      )}

      <EditCategory
        isOpen={!!editTarget}
        editData={editTarget || { name: "", color: "#4F46E5" }}
        setEditData={setEditTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveCat}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        setIsDeleteOpen={() => setDeleteTarget(null)}
        confirmDelete={confirmDeleteCat}
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message={successMsg}
      />
    </div>
  );
}
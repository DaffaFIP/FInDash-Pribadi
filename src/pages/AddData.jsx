import { useState, useEffect } from "react";

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AddTransaction({ user }) {

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [type, setType] = useState("expense");

  const [form, setForm] = useState({
    title: "",
    category: "",
    amount: "",
    Date: today,
  });


  const formatAmount = (value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const raw = value.replace(/\D/g, "");
      setForm({ ...form, amount: raw });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // CATEGORIES FROM FIRESTORE
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        title: form.title,
        amount: Number(form.amount),
        uid: user.uid,
        Date: new Date(form.Date),
      };

      if (type === "expense") {
        data.category = form.category;
      }

      await addDoc(collection(db, type), data);

      alert("Transaction added successfully");

      setForm({
        title: "",
        category: "",
        amount: "",
        Date: "",
      });

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl font-bold">
            Add Transaction
          </h1>

          <div className="flex self-start rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setForm({ ...form, category: "" });
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                type === "expense"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Expense
            </button>

            <button
              type="button"
              onClick={() => {
                setType("income");
                setForm({ ...form, category: "" });
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                type === "income"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* TITLE */}
          <div>
            <label className="mb-1 block">
              Title
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          {type === "expense" && (
            <div>
              <label className="mb-1 block">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border p-3"
                required
              >
                <option value="">-- Select Category --</option>
                {catLoading ? (
                  <option value="" disabled>Memuat...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* AMOUNT */}
          <div>
            <label className="mb-1 block">
              Amount
            </label>

            <input
              type="text"
              inputMode="numeric"
              name="amount"
              value={formatAmount(form.amount)}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          {/* DATE */}
          <div>
            <label className="mb-1 block">
              Date
            </label>

            <input
              type="date"
              name="Date"
              value={form.Date}
              onChange={handleChange}
              className="w-full rounded-lg border p-3"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-white hover:bg-indigo-700"
          >
            Save
          </button>

        </form>
      </div>

    </div>

  );
}
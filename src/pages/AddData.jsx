import { useState } from "react";
import { useFirestore } from "../context/FirestoreContext";
import SuccessModal from "./SuccessModal";

export default function AddTransaction() {

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

  const { mastercategory, addExpense, addIncome } = useFirestore();
  const categories = mastercategory.data;
  const catLoading = mastercategory.loading;
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        title: form.title,
        amount: Number(form.amount),
        Date: form.Date,
      };
      if (type === "expense") {
        data.category = form.category;
        await addExpense(data);
      } else {
        await addIncome(data);
      }
      setShowSuccess(true);
      setForm({ title: "", category: "", amount: "", Date: today });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-xl rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl font-bold dark:text-slate-100">
            Add Transaction
          </h1>

          <div className="flex w-full sm:w-fit rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setForm({ ...form, category: "" });
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                type === "expense"
                  ? "bg-red-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-slate-300"
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
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                type === "income"
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-gray-600 dark:text-slate-300"
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
            <label className="mb-1 block dark:text-slate-300">
              Title
            </label>

            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border dark:border-slate-600 p-3 dark:bg-slate-700 dark:text-slate-200"
              required
            />
          </div>

          {type === "expense" && (
            <div>
              <label className="mb-1 block dark:text-slate-300">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border dark:border-slate-600 p-3 dark:bg-slate-700 dark:text-slate-200"
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
            <label className="mb-1 block dark:text-slate-300">
              Amount
            </label>

            <input
              type="text"
              inputMode="numeric"
              name="amount"
              value={formatAmount(form.amount)}
              onChange={handleChange}
              className="w-full rounded-lg border dark:border-slate-600 p-3 dark:bg-slate-700 dark:text-slate-200"
              required
            />
          </div>

          {/* DATE */}
          <div>
            <label className="mb-1 block dark:text-slate-300">
              Date
            </label>

            <input
              type="date"
              name="Date"
              value={form.Date}
              onChange={handleChange}
              className="w-full rounded-lg border dark:border-slate-600 p-3 dark:bg-slate-700 dark:text-slate-200"
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

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Transaction added successfully"
      />

    </div>

  );
}
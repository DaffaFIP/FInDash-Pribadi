import { useState } from "react";

import {
  collection,
  addDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function AddTransaction() {

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [form, setForm] = useState({
    title: "",
    category: "",
    amount: "",
    Date: today,
  });


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(
        collection(db, "transactions"),
        {
          title: form.title,
          category: form.category,
          amount: Number(form.amount),

          // convert string date to Date object
          Date: new Date(form.Date),
        }
      );

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

        <h1 className="mb-6 text-2xl font-bold">
          Add Transaction
        </h1>

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

          {/* CATEGORY */}
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
              <option value="Jajan">Jajan</option>
              <option value="Transport">Transport</option>
              <option value="Gadget">Gadget</option>
              <option value="Olahraga">Olahraga</option>
              <option value="Buku">Buku</option>
              <option value="Internet">Internet</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* AMOUNT */}
          <div>
            <label className="mb-1 block">
              Amount
            </label>

            <input
              type="number"
              name="amount"
              value={form.amount}
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
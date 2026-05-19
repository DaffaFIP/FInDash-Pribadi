import React, { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App() {
  const [expenses, setExpenses] = useState([]);

  const [form, setForm] = useState({
    Date: "",
    category: "",
    amount: "",
    title: "",
  });

  // FETCH FIREBASE DATA
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "transactions")
        );

        const data = querySnapshot.docs.map((doc) => {
          const firebaseData = doc.data();

          return {
            id: doc.id,
            ...firebaseData,

            // convert firestore timestamp
            Date: firebaseData.Date?.toDate(),
          };
        });

        setExpenses(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchTransactions();
  }, []);

  // TOTAL
  const totalExpense = useMemo(() => {
    return expenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );
  }, [expenses]);

  // CHART DATA
  const chartData = [...expenses]
    .sort((a, b) => new Date(a.Date) - new Date(b.Date))
    .map((item) => ({
      date: item.Date?.toLocaleDateString("id-ID"),
      amount: item.amount,
    }));

  // DELETE
  const handleDelete = async (id) => {
    try {

      // hapus dari firebase
      await deleteDoc(
        doc(db, "transactions", id)
      );

      // update state local
      setExpenses(
        expenses.filter(
          (item) => item.id !== id
        )
      );

    } catch (error) {
      console.log(error);
    }
  };

  // CURRENCY
  const currency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-slate-800">
            Financial Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Monitoring pengeluaran harian
          </p>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-indigo-600">
              Total Pengeluaran:
              {" "}
              {currency(totalExpense)}
            </h2>
          </div>
        </div>

        {/* CHART */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Grafik Pengeluaran
          </h2>

          <div className="h-[350px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    currency(value)
                  }
                />

                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Daftar Pengeluaran
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-xl">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-3 text-left">
                    Title
                  </th>

                  <th className="p-3 text-left">
                    Tanggal
                  </th>

                  <th className="p-3 text-left">
                    Kategori
                  </th>

                  <th className="p-3 text-left">
                    Jumlah
                  </th>

                  <th className="p-3 text-left">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3">
                      {item.title}
                    </td>

                    <td className="p-3">
                      {item.Date?.toLocaleDateString(
                        "id-ID"
                      )}
                    </td>

                    <td className="p-3">
                      {item.category}
                    </td>

                    <td className="p-3">
                      {currency(item.amount)}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          handleDelete(item.id)
                        }
                        className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
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
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("30days");


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


  // FILTER DATA
  const filteredExpenses = useMemo(() => {

    // untuk penggunaan pribadi tanggal berubah-ubah
    const now = new Date();


    if (filter === "7days") {
      const last7Days = new Date();

      last7Days.setDate(
        now.getDate() - 7
      );

      return expenses.filter(
        (item) =>
          new Date(item.Date) >= last7Days
      );
    }

    if (filter === "30days") {
      const last30Days = new Date();

      last30Days.setDate(
        now.getDate() - 30
      );

      return expenses.filter(
        (item) =>
          new Date(item.Date) >= last30Days
      );
    }

    return expenses;

  }, [expenses, filter]);


  // CHART DATA (TOTAL PER HARI + SORT TANGGAL)
  const chartData = useMemo(() => {

    const groupedData = {};

    filteredExpenses.forEach((item) => {

      // format tanggal display
      const dateLabel = item.Date?.toLocaleDateString("id-ID");

      // format key aman untuk sorting
      const dateKey = new Date(item.Date);
      dateKey.setHours(0, 0, 0, 0);

      const key = dateKey.getTime();

      if (!groupedData[key]) {
        groupedData[key] = {
          date: dateLabel,
          fullDate: dateKey,
          amount: 0,
        };
      }

      groupedData[key].amount += Number(item.amount);

    });

    return Object.values(groupedData).sort(
      (a, b) => a.fullDate - b.fullDate
    );

  }, [filteredExpenses]);

  // CURRENCY
  const currency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };



  return (
    <div className="mx-auto max-w-6xl space-y-6">



      {/* Header CHART */}
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">
          Grafik Pengeluaran
        </h2>

        {/* filter button */}
        <div className="mb-4 flex gap-2">

          <button
            onClick={() => setFilter("7days")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "7days"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            7 Hari
          </button>

          <button
            onClick={() => setFilter("30days")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "30days"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            30 Hari
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            Semua
          </button>

        </div>


        {/* Chart */}
        <div className="w-full h-[350px] min-h-[350px]">
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

    </div>
  );
}
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
    const toDayStart = (date) => {
      const day = new Date(date);
      day.setHours(0, 0, 0, 0);
      return day;
    };

    const today = toDayStart(new Date());

    const isWithinDayRange = (item, daysBack) => {
      if (!item.Date) return false;
      const itemDay = toDayStart(item.Date);
      const rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - daysBack);
      return itemDay >= rangeStart && itemDay <= today;
    };

    if (filter === "7days") {
      return expenses.filter((item) => isWithinDayRange(item, 7));
    }

    if (filter === "30days") {
      return expenses.filter((item) => isWithinDayRange(item, 30));
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

  const totalFilteredExpense = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const filterTotalLabel =
    filter === "7days"
      ? "Total 7 hari terakhir"
      : filter === "30days"
        ? "Total 30 hari terakhir"
        : "Total semua data";

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

        {/* filter button + total */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
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

          <div className="border-l border-slate-200 pl-4">
            <p className="text-sm text-slate-500">{filterTotalLabel}</p>
            <p className="text-lg font-semibold text-indigo-600">
              {currency(totalFilteredExpense)}
            </p>
          </div>
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
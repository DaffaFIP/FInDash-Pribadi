import { useEffect, useMemo, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [filter, setFilter] = useState("30days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const expenseQuery = query(
          collection(db, "expense"),
          where("uid", "==", user.uid)
        );
        const incomeQuery = query(
          collection(db, "income"),
          where("uid", "==", user.uid)
        );

        const [expenseSnap, incomeSnap] = await Promise.all([
          getDocs(expenseQuery),
          getDocs(incomeQuery),
        ]);

        const expenseData = expenseSnap.docs.map((doc) => {
          const firebaseData = doc.data();
          return {
            id: doc.id,
            ...firebaseData,
            Date: firebaseData.Date?.toDate(),
          };
        });

        const incomeData = incomeSnap.docs.map((doc) => {
          const firebaseData = doc.data();
          return {
            id: doc.id,
            ...firebaseData,
            Date: firebaseData.Date?.toDate(),
          };
        });

        setExpenses(expenseData);
        setIncomes(incomeData);
      } catch (error) {
        console.log(error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user.uid]);

  // FILTER
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

  const filteredIncomes = useMemo(() => {
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
      return incomes.filter((item) => isWithinDayRange(item, 7));
    }

    if (filter === "30days") {
      return incomes.filter((item) => isWithinDayRange(item, 30));
    }

    return incomes;
  }, [incomes, filter]);

  // CHART DATA
  const chartData = useMemo(() => {
    const groupedData = {};

    const addAmount = (items, keyName) => {
      items.forEach((item) => {
        const dateLabel = item.Date?.toLocaleDateString("en-US");
        const dateKey = new Date(item.Date);
        dateKey.setHours(0, 0, 0, 0);
        const key = dateKey.getTime();

        if (!groupedData[key]) {
          groupedData[key] = {
            date: dateLabel,
            fullDate: dateKey,
            expense: 0,
            income: 0,
          };
        }

        groupedData[key][keyName] += Number(item.amount);
      });
    };

    addAmount(filteredExpenses, "expense");
    addAmount(filteredIncomes, "income");

    return Object.values(groupedData).sort(
      (a, b) => a.fullDate - b.fullDate
    );
  }, [filteredExpenses, filteredIncomes]);

  const totalFilteredExpense = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [filteredExpenses]);

  const totalFilteredIncome = useMemo(() => {
    return filteredIncomes.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [filteredIncomes]);

  const currency = (value) => {
    return Number(value).toLocaleString("en-US");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">
          Finance Chart
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
            </div>
            <div className="h-[350px] animate-pulse rounded-lg bg-slate-200" />
          </div>
        ) : (
        <>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setFilter("7days")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "7days"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            7 Days
          </button>

          <button
            onClick={() => setFilter("30days")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "30days"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            30 Days
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-slate-200"
              }`}
          >
            All
          </button>

          <div className="flex items-center gap-6 border-l border-slate-200 pl-4">
            <div>
              <p className="text-sm text-slate-500">Expense</p>
              <p className="text-lg font-semibold text-indigo-600">
                {currency(totalFilteredExpense)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Income</p>
              <p className="text-lg font-semibold text-green-600">
                {currency(totalFilteredIncome)}
              </p>
            </div>
          </div>
        </div>

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
                formatter={(value, name) =>
                  `${name === "expense" ? "Expense" : "Income"}: ${currency(value)}`
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="expense"
                stroke="#4f46e5"
                strokeWidth={3}
                name="Expense"
              />

              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                name="Income"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        </>
        )}
      </div>

    </div>
  );
}

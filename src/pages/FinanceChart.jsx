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
  ReferenceLine,
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
  const [showExpense, setShowExpense] = useState(true);
  const [showIncome, setShowIncome] = useState(false);

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
    const toDayStart = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const getWeekEndingSunday = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      if (day !== 0) d.setDate(d.getDate() + (7 - day));
      return d;
    };

    if (filter === "30days") {
      const today = toDayStart(new Date());
      const rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - 30);

      // Monday of the week containing rangeStart
      const weekStart = new Date(rangeStart);
      const d = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (d === 0 ? 6 : d - 1));
      weekStart.setHours(0, 0, 0, 0);

      const weeklyData = {};

      const addAmount = (items, keyName) => {
        items.forEach((item) => {
          if (!item.Date) return;
          const itemDate = toDayStart(item.Date);
          if (itemDate < weekStart || itemDate > today) return;

          const sunday = getWeekEndingSunday(itemDate);
          const key = sunday.getTime();

          if (!weeklyData[key]) {
            weeklyData[key] = {
              date: sunday.toLocaleDateString("en-GB"),
              fullDate: new Date(sunday),
              expense: 0,
              income: 0,
            };
          }
          weeklyData[key][keyName] += Number(item.amount);
        });
      };

      addAmount(expenses, "expense");
      addAmount(incomes, "income");

      // Ensure current week is included
      const currentSunday = getWeekEndingSunday(today);
      const currentKey = currentSunday.getTime();
      if (!weeklyData[currentKey]) {
        weeklyData[currentKey] = {
          date: currentSunday.toLocaleDateString("en-GB"),
          fullDate: new Date(currentSunday),
          expense: 0,
          income: 0,
        };
      }

      return Object.values(weeklyData)
        .sort((a, b) => a.fullDate - b.fullDate)
        .map((d) => ({
          ...d,
          expense: d.expense === 0 ? null : d.expense,
          income: d.income === 0 ? null : d.income,
        }));
    }

    if (filter === "all") {
      const monthlyData = {};

      const addAmount = (items, keyName) => {
        items.forEach((item) => {
          if (!item.Date) return;
          const d = new Date(item.Date);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const monthLabel = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
          const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);

          if (!monthlyData[key]) {
            monthlyData[key] = {
              date: monthLabel,
              fullDate: monthStart,
              expense: 0,
              income: 0,
            };
          }
          monthlyData[key][keyName] += Number(item.amount);
        });
      };

      addAmount(filteredExpenses, "expense");
      addAmount(filteredIncomes, "income");

      return Object.values(monthlyData)
        .sort((a, b) => a.fullDate - b.fullDate)
        .map((d) => ({
          ...d,
          expense: d.expense === 0 ? null : d.expense,
          income: d.income === 0 ? null : d.income,
        }));
    }

    // daily grouping for 7days
    const groupedData = {};

    const addAmount = (items, keyName) => {
      items.forEach((item) => {
        const dateLabel = item.Date?.toLocaleDateString("en-GB");
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

    return Object.values(groupedData)
      .sort((a, b) => a.fullDate - b.fullDate)
      .map((d) => ({
        ...d,
        expense: d.expense === 0 ? null : d.expense,
        income: d.income === 0 ? null : d.income,
      }));
  }, [filteredExpenses, filteredIncomes, filter, expenses, incomes]);

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

  const avgExpense = useMemo(() => {
    const values = chartData.filter((d) => d.expense != null).map((d) => d.expense);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }, [chartData]);

  const avgIncome = useMemo(() => {
    const values = chartData.filter((d) => d.income != null).map((d) => d.income);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }, [chartData]);

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
          <div className="flex flex-row sm:flex-col w-fit rounded-lg bg-gray-100 p-1">
            {[
              { value: "7days", label: "7 Days" },
              { value: "30days", label: "30 Days" },
              { value: "all", label: "All" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-2 sm:py-0.5 text-sm sm:text-xs font-medium transition ${
                  filter === opt.value
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
            <button
              onClick={() => setShowExpense((prev) => !prev)}
              className={`text-left transition ${showExpense ? "opacity-100" : "opacity-40"}`}
            >
              <p className="text-sm text-slate-500">Expense</p>
              <p className="text-lg font-semibold text-indigo-600">
                {currency(totalFilteredExpense)}
              </p>
              <p className="text-xs text-indigo-400">
                Avg: {currency(avgExpense)}
              </p>
            </button>
            <button
              onClick={() => setShowIncome((prev) => !prev)}
              className={`text-left transition ${showIncome ? "opacity-100" : "opacity-40"}`}
            >
              <p className="text-sm text-slate-500">Income</p>
              <p className="text-lg font-semibold text-green-600">
                {currency(totalFilteredIncome)}
              </p>
              <p className="text-xs text-green-400">
                Avg: {currency(avgIncome)}
              </p>
            </button>
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
                formatter={(value, name) => `${name}: ${currency(value)}`}
              />

              <Legend onClick={(e) => {
                if (e.dataKey === 'expense') setShowExpense(prev => !prev);
                if (e.dataKey === 'income') setShowIncome(prev => !prev);
              }} />

              {showExpense && (
                <ReferenceLine
                  y={avgExpense}
                  stroke="#4f46e5"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />
              )}
              {showIncome && (
                <ReferenceLine
                  y={avgIncome}
                  stroke="#10b981"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                />
              )}

              <Line
                type="monotone"
                dataKey="expense"
                stroke="#4f46e5"
                strokeWidth={3}
                name="Expense"
                connectNulls
                hide={!showExpense}
              />

              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={3}
                name="Income"
                connectNulls
                hide={!showIncome}
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

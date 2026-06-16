import { useEffect, useMemo, useState } from "react";

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
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("30days");
  const [visibleCategories, setVisibleCategories] = useState({});

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, "expense"),
          where("uid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => {
          const firebaseData = doc.data();
          return {
            id: doc.id,
            ...firebaseData,
            Date: firebaseData.Date?.toDate(),
          };
        });
        setExpenses(data);
      } catch (error) {
        console.log(error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [user.uid]);

  useEffect(() => {
    const fetchMasterCategory = async () => {
      try {
        const q = query(
          collection(db, "mastercategory"),
          where("uid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMasterCategories(data);
      } catch (error) {
        console.log(error);
      }
    };
    fetchMasterCategory();
  }, [user.uid]);

  const categoryColorMap = useMemo(() => {
    const map = {};
    masterCategories.forEach((cat) => {
      map[cat.name] = cat.color;
    });
    map.Lainnya = "#64748B";
    return map;
  }, [masterCategories]);

  const getColor = (category) => categoryColorMap[category] || "#64748B";

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

      const weekStart = new Date(rangeStart);
      const d = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - (d === 0 ? 6 : d - 1));
      weekStart.setHours(0, 0, 0, 0);

      const weeklyData = {};

      filteredExpenses.forEach((item) => {
        if (!item.Date) return;
        const category = item.category || "Lainnya";
        const itemDate = toDayStart(item.Date);
        if (itemDate < weekStart || itemDate > today) return;

        const sunday = getWeekEndingSunday(itemDate);
        const key = sunday.getTime();

        if (!weeklyData[key]) {
          weeklyData[key] = {
            date: sunday.toLocaleDateString("en-GB"),
            fullDate: new Date(sunday),
          };
        }
        weeklyData[key][category] =
          (weeklyData[key][category] || 0) + Number(item.amount);
      });

      const currentSunday = getWeekEndingSunday(today);
      const currentKey = currentSunday.getTime();
      if (!weeklyData[currentKey]) {
        weeklyData[currentKey] = {
          date: currentSunday.toLocaleDateString("en-GB"),
          fullDate: new Date(currentSunday),
        };
      }

      return Object.values(weeklyData)
        .sort((a, b) => a.fullDate - b.fullDate);
    }

    if (filter === "all") {
      const monthlyData = {};

      filteredExpenses.forEach((item) => {
        if (!item.Date) return;
        const category = item.category || "Lainnya";
        const d = new Date(item.Date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const monthLabel = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);

        if (!monthlyData[key]) {
          monthlyData[key] = {
            date: monthLabel,
            fullDate: monthStart,
          };
        }
        monthlyData[key][category] =
          (monthlyData[key][category] || 0) + Number(item.amount);
      });

      return Object.values(monthlyData)
        .sort((a, b) => a.fullDate - b.fullDate);
    }

    const groupedData = {};

    filteredExpenses.forEach((item) => {
      if (!item.Date) return;
      const category = item.category || "Lainnya";
      const dateLabel = item.Date.toLocaleDateString("en-GB");
      const dateKey = new Date(item.Date);
      dateKey.setHours(0, 0, 0, 0);
      const key = dateKey.getTime();

      if (!groupedData[key]) {
        groupedData[key] = {
          date: dateLabel,
          fullDate: dateKey,
        };
      }
      groupedData[key][category] =
        (groupedData[key][category] || 0) + Number(item.amount);
    });

    return Object.values(groupedData)
      .sort((a, b) => a.fullDate - b.fullDate);
  }, [filteredExpenses, filter]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    chartData.forEach((d) => {
      Object.keys(d).forEach((key) => {
        if (key !== "date" && key !== "fullDate") cats.add(key);
      });
    });
    return [...cats];
  }, [chartData]);

  useEffect(() => {
    setVisibleCategories((prev) => {
      const next = { ...prev };
      allCategories.forEach((cat) => {
        if (!(cat in next)) next[cat] = true;
      });
      return next;
    });
  }, [allCategories]);

  const categoryAverages = useMemo(() => {
    const avgs = {};
    allCategories.forEach((cat) => {
      const values = chartData
        .filter((d) => d[cat] != null)
        .map((d) => d[cat]);
      avgs[cat] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });
    return avgs;
  }, [allCategories, chartData]);

  const currency = (value) => {
    const num = Number(value);
    if (num >= 1000) {
      return Math.round(num / 1000) + "K";
    }
    return String(num);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold dark:text-slate-100">
          Category Chart
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-[350px] animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center py-20 text-sm text-slate-400 dark:text-slate-500">
            No data available for selected filter
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div className="flex w-full sm:w-fit rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
                {[
                  { value: "7days", label: "7 Days" },
                  { value: "30days", label: "30 Days" },
                  { value: "all", label: "All" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`flex-1 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition ${
                      filter === opt.value
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => `${name}: ${currency(value)}`}
                  />
                  {allCategories.map((cat) => (
                    <Line
                      key={cat}
                      type="monotone"
                      dataKey={cat}
                      stroke={getColor(cat)}
                      strokeWidth={2}
                      name={cat}
                      connectNulls
                      hide={!visibleCategories[cat]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-nowrap justify-center gap-4 overflow-x-auto pt-4">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setVisibleCategories((prev) => ({
                      ...prev,
                      [cat]: !prev[cat],
                    }))
                  }
                  className={`text-center transition ${
                    visibleCategories[cat] !== false
                      ? "opacity-100"
                      : "opacity-40"
                  }`}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: getColor(cat) }}
                  >
                    {cat}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    avg {currency(categoryAverages[cat] || 0)}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

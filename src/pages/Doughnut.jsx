import { useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import { useFirestore } from "../context/FirestoreContext";

export default function Doughnut() {

  const { expense, mastercategory } = useFirestore();
  const expenses = expense.data;
  const masterCats = mastercategory.data;
  const loading = expense.loading || mastercategory.loading;
  const error = expense.error;
  const [showAllMobile, setShowAllMobile] = useState(false);

  // FILTER DOUGHNUT CHART
  const [
    doughnutFilter,
    setDoughnutFilter,
  ] = useState("30days");

  // GENERIC FILTER FUNCTION
  const filterExpenses = (
    data,
    filter
  ) => {

    // PUBLIC DEMO
    // const now = new Date("2026-05-19");

    const toDayStart = (date) => {
      const day = new Date(date);
      day.setHours(0, 0, 0, 0);
      return day;
    };


    // use real time for production
    const today = toDayStart(new Date());

    // use fixed date for testing so data doesn't change daily
    // const today = toDayStart(new Date(2026, 4, 14));

    const isWithinDayRange = (item, daysBack) => {
      if (!item.Date) return false;
      const itemDay = toDayStart(item.Date);
      const rangeStart = new Date(today);
      rangeStart.setDate(today.getDate() - daysBack);
      return itemDay >= rangeStart && itemDay <= today;
    };

    if (filter === "thisMonth") {
      return data.filter((item) => {
        if (!item.Date) return false;
        return (
          item.Date.getMonth() === today.getMonth() &&
          item.Date.getFullYear() === today.getFullYear()
        );
      });
    }

    if (filter === "7days") {
      return data.filter((item) => isWithinDayRange(item, 7));
    }

    if (filter === "30days") {
      return data.filter((item) => isWithinDayRange(item, 30));
    }

    return data;
  };


  // FILTERED DATA DOUGHNUT
  const filteredDoughnutExpenses =
    useMemo(() => {

      return filterExpenses(
        expenses,
        doughnutFilter
      );

    }, [expenses, doughnutFilter]);

  // DOUGHNUT CHART DATA
  const doughnutData = useMemo(() => {

    const grouped =
      filteredDoughnutExpenses.reduce(
        (acc, item) => {

          const category =
            item.category || "Lainnya";

          acc[category] =
            (acc[category] || 0) +
            Number(item.amount);

          return acc;

        },
        {}
      );

    const total = Object.values(grouped)
      .reduce((a, b) => a + b, 0);

    const entries = Object.entries(grouped);
    // sort by highest amount
    entries.sort((a, b) => b[1] - a[1]);
    let accumulated = 0;

    const count = entries.length;
    const isLast = (i) => i === count - 1;

    return entries.map(
      ([label, amount], index) => {

        if (total === 0) {
          return {
            label,
            amount: 0,
            percentage: "0.0",
            squares: 0,
          };
        }

        const raw =
          (amount / total) * 100;

        let squareCount;

        // last category
        // ensure total is always exactly 100
        if (isLast(index)) {

          squareCount = 100 - accumulated;

        } else {

          squareCount = Math.round(raw);

          accumulated += squareCount;
        }

        return {
          label,
          amount,
          percentage:
            raw.toFixed(1),
          squares: squareCount,
        };
      }
    );

  }, [filteredDoughnutExpenses]);

  // dynamic colors from master category collection
  const categoryColors = useMemo(() => {
    const map = {};
    masterCats.forEach((c) => {
      map[c.name] = `bg-[${c.color}]`;
    });
    return map;
  }, [masterCats]);

  // raw hex colors for pie chart
  const pieColors = useMemo(() => {
    const map = {};
    masterCats.forEach((c) => {
      map[c.name] = c.color;
    });
    return map;
  }, [masterCats]);

  // icon names for legend
  const categoryIcons = useMemo(() => {
    const map = {};
    masterCats.forEach((c) => {
      map[c.name] = c.icon || "";
    });
    return map;
  }, [masterCats]);

  // (squares logic removed — replaced by donut chart)

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      <style>{`
        :root { --tooltip-bg: #fff; --tooltip-border: #e2e8f0; --tooltip-color: #1e293b; }
        .dark { --tooltip-bg: #1e293b; --tooltip-border: #334155; --tooltip-color: #e2e8f0; }
      `}</style>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* DOUGHNUT CHART */}
      {/* ========================= */}

      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold dark:text-slate-100">
          Expense Distribution
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : (
        <>
        <div
          className="flex flex-col items-center gap-8 lg:flex-row lg:items-start    lg:justify-center">

          {/* DONUT CHART */}
          <div className="relative flex items-center justify-center w-[280px] h-[280px]">
            <svg width={0} height={0}>
              <defs>
                {doughnutData.map((d, i) => (
                  <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={pieColors[d.label] || "#64748B"} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={pieColors[d.label] || "#64748B"} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
            </svg>
            <PieChart width={280} height={280}>
              <Pie
                data={doughnutData.map(d => ({ name: d.label, value: d.amount }))}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                dataKey="value"
                paddingAngle={2}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {doughnutData.map((entry, i) => (
                  <Cell key={i} fill={`url(#grad-${i})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString("id-ID")}`}
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg)",
                  borderColor: "var(--tooltip-border)",
                  color: "var(--tooltip-color)",
                }}
              />
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">Total</p>
                <p className="text-2xl font-bold dark:text-slate-100">
                  {doughnutData.reduce((s, d) => s + d.amount, 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0">
              {(() => {
                const total = doughnutData.reduce((s, d) => s + d.amount, 0);
                if (total === 0) return null;
                const cx = 140, cy = 140;
                const innerR = 70, outerR = 120;
                const midR = innerR + (outerR - innerR) / 2;
                let accumulated = 0;
                return doughnutData.map((item) => {
                  const angle = (item.amount / total) * 360;
                  const midAngle = accumulated + angle / 2;
                  accumulated += angle;
                  const rad = -midAngle * (Math.PI / 180);
                  const x = cx + midR * Math.cos(rad);
                  const y = cy + midR * Math.sin(rad);
                  const iconName = categoryIcons[item.label];
                  if (!iconName) return null;
                  return (
                    <div
                      key={item.label}
                      className="absolute flex items-center justify-center w-5 h-5 rounded"
                      style={{
                        left: x, top: y,
                        transform: "translate(-50%, -50%)",
                        border: "1.5px solid white",
                      }}
                    >
                      <i className={`fa-solid fa-${iconName} text-white`} style={{ fontSize: 11 }} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* LEGEND */}
          <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden lg:w-[320px]">

            <div className="flex items-center justify-center border-b border-slate-100 dark:border-slate-700">
              <div className="flex w-full rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
                {[
                  { value: "thisMonth", label: "Month" },
                  { value: "7days", label: "7 Days" },
                  { value: "30days", label: "30 Days" },
                  { value: "all", label: "All" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDoughnutFilter(opt.value)}
                    className={`flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition ${
                      doughnutFilter === opt.value
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700">
              {/* Mobile: single column */}
              <div className="sm:hidden">
                {doughnutData.slice(0, showAllMobile ? doughnutData.length : 5).map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between gap-1 p-2.5 bg-white dark:bg-slate-800 ${
                      i > 0 ? "border-t border-slate-100 dark:border-slate-700" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center ${categoryColors[item.label] || categoryColors["Lainnya"]}`}>
                        {categoryIcons[item.label] ? <i className={`fa-solid fa-${categoryIcons[item.label]} text-xs`} /> : null}
                      </div>
                      <span className="truncate text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.percentage}%</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {Number(item.amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
                {doughnutData.length > 5 && (
                  <button
                    onClick={() => setShowAllMobile(!showAllMobile)}
                    className="flex w-full items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 text-sm text-indigo-500 hover:text-indigo-600 transition border-t border-slate-100 dark:border-slate-700"
                  >
                    <span>{showAllMobile ? "Sembunyikan" : `Lihat Semua (${doughnutData.length})`}</span>
                    <span>{showAllMobile ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
              {/* Desktop: column overflow */}
              <div className="hidden sm:grid" style={{
                  gridTemplateRows: `repeat(${Math.min(4, doughnutData.length)}, auto)`,
                  gridAutoFlow: "column",
                  gap: "1px",
                }}>
                {doughnutData.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-1 p-2.5 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center ${categoryColors[item.label] || categoryColors["Lainnya"]}`}>
                        {categoryIcons[item.label] ? <i className={`fa-solid fa-${categoryIcons[item.label]} text-xs`} /> : null}
                      </div>
                      <span className="truncate text-sm font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.percentage}%</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {Number(item.amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
                {(() => {
                  const rows = Math.min(4, doughnutData.length);
                  const totalSlots = Math.ceil(doughnutData.length / rows) * rows;
                  return Array.from({ length: totalSlots - doughnutData.length }).map((_, i) => (
                    <div key={`filler-${i}`} className="bg-white dark:bg-slate-800" />
                  ));
                })()}
              </div>
            </div>

          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
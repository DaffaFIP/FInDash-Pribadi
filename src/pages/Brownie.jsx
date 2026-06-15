import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [masterCats, setMasterCats] = useState([]);

  // FILTER BROWNIE CHART
  const [
    brownieFilter,
    setBrownieFilter,
  ] = useState("30days");

  // FETCH FIREBASE DATA
  useEffect(() => {

    const fetchTransactions = async () => {

      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, "expense"),
          where("uid", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        const data =
          querySnapshot.docs.map((doc) => {

            const firebaseData =
              doc.data();

            return {
              id: doc.id,
              ...firebaseData,

              Date:
                firebaseData.Date?.toDate(),
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

    fetchTransactions();

  }, [user.uid]);

  // FETCH MASTER CATEGORIES
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "mastercategory"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMasterCats(list);
    });
    return () => unsub();
  }, [user]);

  // GENERIC FILTER FUNCTION
  const filterExpenses = (
    data,
    filter
  ) => {

    // PUBLIC DEMO
    // const now = new Date("2026-05-19");

    // REAL TIME
    const now = new Date();

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


  // FILTERED DATA BROWNIE
  const filteredBrownieExpenses =
    useMemo(() => {

      return filterExpenses(
        expenses,
        brownieFilter
      );

    }, [expenses, brownieFilter]);

  const currency = (value) => {
    return Number(value).toLocaleString("en-US");
  };

  // BROWNIE CHART DATA
  const brownieData = useMemo(() => {

    const grouped =
      filteredBrownieExpenses.reduce(
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

  }, [filteredBrownieExpenses]);

  // dynamic colors from master category collection
  const categoryColors = useMemo(() => {
    const map = {};
    masterCats.forEach((c) => {
      map[c.name] = `bg-[${c.color}]`;
    });
    map["Lainnya"] = "bg-[#64748B]";
    return map;
  }, [masterCats]);

  // // BROWNIE SQUARES
  // const brownieSquares =
  //   brownieData.flatMap(
  //     (item, index) => {

  //       return Array.from(
  //         { length: item.squares },
  //         () => ({
  //           label: item.label,

  //           value: item.percentage,

  //           color:
  //             brownieColors[
  //             index %
  //             brownieColors.length
  //             ],
  //         })
  //       );
  //     }
  //   );

  const brownieSquares =
    brownieData.flatMap(
      (item) => {

        return Array.from(
          { length: item.squares },
          () => ({
            label: item.label,

            value: item.percentage,

            color:
              categoryColors[item.label] ||
              categoryColors["Lainnya"],
          })
        );
      }
    );

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* BROWNIE CHART */}
      {/* ========================= */}

      <div className="rounded-2xl bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold">
          Expense Distribution
        </h2>

        {loading ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
          </div>
        ) : (
        <>
        <div
          className="flex flex-col items-center gap-8 lg:flex-row lg:items-start    lg:justify-center">

          {/* GRID */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <div
              className=" grid grid-cols-10 gap-[2px] bg-white p-[2px] rounded-sm"
            >

              {brownieSquares.map(
                (square, i) => (

                  <div
                    key={i}

                    title={`
                      ${square.label}
                      (${square.value}%)
                    `}
                    className={`
                      aspect-square
                      w-6 sm:w-8 md:w-10
                      rounded-md
                      ${square.color}
                    `}
                  />

                )
              )}

            </div>
          </div>

          {/* LEGEND */}
          <div
            className="w-full rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 lg:w-[320px]"
          >

            <div className="flex items-center justify-center p-3">
              <div className="flex w-fit rounded-lg bg-gray-100 p-1">
                {[
                  { value: "thisMonth", label: "Month" },
                  { value: "7days", label: "7 Days" },
                  { value: "30days", label: "30 Days" },
                  { value: "all", label: "All" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBrownieFilter(opt.value)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                      brownieFilter === opt.value
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {brownieData.map(
              (item, index) => (

                <div
                  key={item.label}

                  className="
                    flex items-center
                    justify-between
                    p-3
                  "
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`
                        h-5 w-5 rounded
                        ${categoryColors[item.label] ||
                        categoryColors["Lainnya"]}
                      `}
                    />

                    <span className="font-medium">
                      {item.label}
                    </span>

                  </div>

                  <div className="text-right">

                    <p className="font-semibold">
                      {item.percentage}%
                    </p>

                    <p className="text-sm text-slate-500">
                      {currency(item.amount)}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
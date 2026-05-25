import React, {
  useEffect,
  useMemo,
  useState,
} from "react";



import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App() {

  const [expenses, setExpenses] = useState([]);



  // FILTER BROWNIE CHART
  const [
    brownieFilter,
    setBrownieFilter,
  ] = useState("30days");

  // FETCH FIREBASE DATA
  useEffect(() => {

    const fetchTransactions = async () => {

      try {

        const querySnapshot =
          await getDocs(
            collection(db, "transactions")
          );

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
      }
    };

    fetchTransactions();

  }, []);

  // GENERIC FILTER FUNCTION
  const filterExpenses = (
    data,
    filter
  ) => {

    // PUBLIC DEMO
    // const now = new Date("2026-05-19");

    // REAL TIME
    const now = new Date();

    if (filter === "7days") {

      const last7Days = new Date();

      last7Days.setDate(
        now.getDate() - 7
      );

      return data.filter(
        (item) =>
          new Date(item.Date) >=
          last7Days
      );
    }

    if (filter === "30days") {

      const last30Days = new Date();

      last30Days.setDate(
        now.getDate() - 30
      );

      return data.filter(
        (item) =>
          new Date(item.Date) >=
          last30Days
      );
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

  // menghitung persentase dan jumlah kotak untuk setiap kategori
  const currency = (value) => {

    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(value);
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
    // urutkan berdasarkan amount terbesar
    entries.sort((a, b) => b[1] - a[1]);
    let accumulated = 0;



    return entries.map(
      ([label, amount], index) => {

        const raw =
          (amount / total) * 100;

        let squareCount;

        // kategori terakhir
        // supaya total selalu tepat 100
        if (index === entries.length - 1) {

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

  // // COLORS
  // const brownieColors = [
  //   "bg-indigo-500",
  //   "bg-pink-500",
  //   "bg-emerald-500",
  //   "bg-amber-500",
  //   "bg-cyan-500",
  //   "bg-orange-500",
  //   "bg-violet-500",
  // ];

  // warna per kategori (bisa disesuaikan dengan kategori yang ada di data)
  const categoryColors = {
    Jajan: "bg-indigo-500",
    Transport: "bg-pink-500",
    Internet: "bg-emerald-500",
    Gadget: "bg-cyan-500",
    // Makanan: "bg-amber-500",
    Olahraga: "bg-orange-500",
    Hiburan: "bg-violet-500",

    // default fallback
    Lainnya: "bg-slate-500",
  };

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



      {/* ========================= */}
      {/* BROWNIE CHART */}
      {/* ========================= */}

      <div className="rounded-2xl bg-white p-6 shadow">

        <h2 className="mb-4 text-xl font-semibold">
          Distribusi Kategori
        </h2>

        {/* FILTER */}
        <div className="mb-6 flex gap-2">

          <button
            onClick={() =>
              setBrownieFilter(
                "7days"
              )
            }
            className={`
              rounded-lg px-4 py-2 text-sm
              ${brownieFilter ===
                "7days"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200"
              }
            `}
          >
            7 Hari
          </button>

          <button
            onClick={() =>
              setBrownieFilter(
                "30days"
              )
            }
            className={`
              rounded-lg px-4 py-2 text-sm
              ${brownieFilter ===
                "30days"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200"
              }
            `}
          >
            30 Hari
          </button>

          <button
            onClick={() =>
              setBrownieFilter("all")
            }
            className={`
              rounded-lg px-4 py-2 text-sm
              ${brownieFilter ===
                "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-200"
              }
            `}
          >
            Semua
          </button>

        </div>

        <div
          className="flex flex-col items-center gap-8 lg:flex-row lg:items-start    lg:justify-center">

          {/* GRID */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">

            <div className="grid grid-cols-10 gap-1 sm:gap-2">

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
                      border border-black/10
                      shadow-inner
                      hover:scale-105
                      transition-transform
                      ${square.color}
                    `}
                  />

                )
              )}

            </div>
          </div>

          {/* LEGEND */}
          <div
            className="grid w-full gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1"
          >

            {brownieData.map(
              (item, index) => (

                <div
                  key={item.label}

                  className="
                    flex items-center
                    justify-between
                    rounded-2xl
                    border
                    bg-white
                    p-4
                    shadow
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
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";


import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    Date: "",
    category: "",
    amount: "",
    title: "",
  });

  // NAMA BULAN
  const monthName = new Date().toLocaleDateString(
    "id-ID",
    {
      month: "long",
    }
  );

  // FETCH FIREBASE DATA
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
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
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // FILTER BULAN INI
  const currentMonthExpenses = useMemo(() => {
  
    const now = new Date();
  
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
  
    return expenses.filter((item) => {
  
      if (!item.Date) return false;
  
      const itemDate = new Date(item.Date);
  
      return (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    });
  
  }, [expenses]);
  
  // TOTAL BULAN INI
  const totalExpense = useMemo(() => {
  
    return currentMonthExpenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );
  
  }, [currentMonthExpenses]);
  

  // CURRENCY
  const currency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  return (
      <div className="mx-auto max-w-6xl space-y-6">

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* HEADER */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-slate-800">
            Financial Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Monitoring pengeluaran harian
          </p>

          <div className="mt-4">
            {loading ? (
              <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
            ) : (
              <h2 className="text-xl font-semibold text-indigo-600">
              Pengeluaran {monthName} :
                {" "}
                {currency(totalExpense)}
              </h2>
            )}
          </div>
        </div>

      </div>
  );
}
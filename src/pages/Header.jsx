import React, { useEffect, useMemo, useState } from "react";


import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {
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
    "en-US",
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

            // convert firestore timestamp
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

    fetchTransactions();
  }, [user.uid]);

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
    return Number(value).toLocaleString("en-US");
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

        {loading ? (
          <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
        ) : (
          <p className="mt-2 text-slate-500">

            {monthName} Expenses :
            {" "}
            {currency(totalExpense)}
          </p>
        )}

      </div>

    </div>
  );
}
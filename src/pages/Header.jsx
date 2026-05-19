import React, { useEffect, useMemo, useState } from "react";


import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App() {
  const [expenses, setExpenses] = useState([]);

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

        {/* HEADER */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-slate-800">
            Financial Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Monitoring pengeluaran harian
          </p>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-indigo-600">
            Pengeluaran {monthName} :
              {" "}
              {currency(totalExpense)}
            </h2>
          </div>
        </div>

      </div>
  );
}
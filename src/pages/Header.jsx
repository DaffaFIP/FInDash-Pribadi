import { useMemo } from "react";
import { useFirestore } from "../context/FirestoreContext";

export default function Header() {
  const { expense } = useFirestore();
  const loading = expense.loading;
  const error = expense.error;
  const expenses = expense.data;

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return expenses.filter((item) => {
      if (!item.Date) return false;
      const d = new Date(item.Date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [expenses]);

  const totalExpense = useMemo(
    () => currentMonthExpenses.reduce((sum, item) => sum + item.amount, 0),
    [currentMonthExpenses]
  );

  const currency = (value) => Number(value).toLocaleString("id-ID");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Financial Dashboard
        </h1>
        {loading ? (
          <div className="mt-2 h-7 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ) : (
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {monthName} Expenses : {currency(totalExpense)}
          </p>
        )}
      </div>
    </div>
  );
}

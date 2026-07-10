import { useState } from "react";
import Header from "./Header";
import FinanceChart from "./FinanceChart";
import CategoryChart from "./CategoryChart";
import ExpenseList from "./ExpenseList";
import IncomeList from "./IncomeList";
import Doughnut from "./Doughnut";

export default function Home({ user }) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
    { value: "trends", label: "Trends" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        <div className="flex rounded-xl bg-white dark:bg-slate-800 p-1 shadow md:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                activeTab === tab.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          {activeTab === "overview" && (
            <>
              <Header />
              <FinanceChart />
              <Doughnut />
            </>
          )}
          {activeTab === "expense" && <ExpenseList user={user} />}
          {activeTab === "income" && <IncomeList user={user} />}
          {activeTab === "trends" && <CategoryChart />}
        </div>

        <div className="hidden md:block space-y-6">
          <Header />
          <FinanceChart />
          <CategoryChart />
          <Doughnut />
          <ExpenseList user={user} />
          <IncomeList user={user} />
        </div>

      </div>
    </div>
  );
}

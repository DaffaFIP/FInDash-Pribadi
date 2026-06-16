import Header from "./Header";
import FinanceChart from "./FinanceChart";
import CategoryChart from "./CategoryChart";
import ExpenseList from "./ExpenseList";
import IncomeList from "./IncomeList";
import Brownie from "./Brownie";

export default function App({ user }) {
 
  return (


    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-6">
      <div className="mx-auto max-w-6xl space-y-6">


        <div>
          <Header user={user} />
        </div>

        <div>
          <FinanceChart user={user} />
        </div>

        <div>
          <CategoryChart user={user} />
        </div>

        <div>
          <Brownie user={user} />
        </div>

        <div>
          <ExpenseList user={user} />
        </div>

        <div>
          <IncomeList user={user} />
        </div>

      </div>
    </div>
  );
}
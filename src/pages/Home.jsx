import Header from "./Header";
import Chart from "./Chart";
import Tabel from "./Tabel";
import Brownie from "./Brownie";

export default function App({ user }) {
 
  return (


    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">


        <div>
          <Header user={user} />
        </div>

        <div>
          <Chart user={user} />
        </div>

        <div>
          <Tabel user={user} />
        </div>

        <div>
          <Brownie user={user} />
        </div>


      </div>
    </div>
  );
}
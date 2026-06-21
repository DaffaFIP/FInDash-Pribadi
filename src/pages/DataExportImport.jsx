import { useRef, useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";
import { Download, Upload } from "lucide-react";

export default function DataExportImport({ user, onSuccess, onError }) {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const [expenseSnap, incomeSnap] = await Promise.all([
        getDocs(query(collection(db, "expense"), where("uid", "==", user.uid))),
        getDocs(query(collection(db, "income"), where("uid", "==", user.uid))),
      ]);

      const expenseData = expenseSnap.docs.map((d) => {
        const data = d.data();
        return {
          Title: data.title || "",
          Amount: Number(data.amount || 0),
          Category: data.category || "",
          Date: data.Date?.toDate().toLocaleDateString("en-GB") || "",
        };
      });

      const incomeData = incomeSnap.docs.map((d) => {
        const data = d.data();
        return {
          Title: data.title || "",
          Amount: Number(data.amount || 0),
          Date: data.Date?.toDate().toLocaleDateString("en-GB") || "",
        };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseData), "Expense");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeData), "Income");
      XLSX.writeFile(wb, "FinDash-Data.xlsx");
    } catch (err) {
      console.error(err);
      onError?.("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = (file) => {
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });

        let added = 0;

        const processSheet = async (sheetName, type) => {
          const sheet = wb.Sheets[sheetName];
          if (!sheet) return;
          const rows = XLSX.utils.sheet_to_json(sheet);
          for (const row of rows) {
            const docData = {
              title: row.Title || row.title || "",
              amount: Number(row.Amount || row.amount || 0),
              uid: user.uid,
              Date: row.Date ? new Date(row.Date) : new Date(),
            };
            if (type === "expense") {
              docData.category = row.Category || row.category || "";
            }
            await addDoc(collection(db, type), docData);
            added++;
          }
        };

        await Promise.all([
          processSheet("Expense", "expense"),
          processSheet("Income", "income"),
        ]);

        onSuccess?.(`Import successful! ${added} records added.`);
      } catch (err) {
        console.error(err);
        onError?.("Failed to import data");
      } finally {
        setImportLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const expenseData = [
      { Title: "e.g. Groceries", Amount: 50000, Category: "e.g. Pangan", Date: "2026-01-01" },
    ];
    const incomeData = [
      { Title: "e.g. Salary", Amount: 1000000, Date: "2026-01-01" },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseData), "Expense");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeData), "Income");
    XLSX.writeFile(wb, "Import-Template.xlsx");
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-800 p-6 shadow space-y-3">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        Data
      </h2>
      <button
        onClick={handleExport}
        disabled={exportLoading}
        className="w-full py-3 px-4 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center justify-center gap-2"
      >
        {exportLoading ? (
          <span>Exporting...</span>
        ) : (
          <>
            <Download size={18} />
            Export to Excel
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleImport(e.target.files[0]);
            e.target.value = "";
          }
        }}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importLoading}
        className="w-full py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow flex items-center justify-center gap-2"
      >
        {importLoading ? (
          <span>Importing...</span>
        ) : (
          <>
            <Upload size={18} />
            Import from Excel
          </>
        )}
      </button>

      <button
        onClick={handleDownloadTemplate}
        className="w-full text-center text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-500 transition"
      >
        Download template
      </button>
    </div>
  );
}

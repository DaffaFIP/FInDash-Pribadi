import { useMemo, useState } from "react";
import EditModal from "./EditModal";
import DeleteModal from "./DeleteModal";
import SuccessModal from "./SuccessModal";
import { Trash2, SquarePen } from "lucide-react";
import { useFirestore } from "../context/FirestoreContext";

export default function IncomeList({ user }) {
  const { income, updateIncome, deleteIncome } = useFirestore();
  const incomes = income.data;
  const loading = income.loading;
  const error = income.error;
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  const [sortDirection, setSortDirection] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  const [isEditOpen, setIsEditOpen] =
    useState(false);

  const [editData, setEditData] =
    useState({
      id: "",
      title: "",
      amount: "",
      Date: "",
    });

  const [isSuccessOpen, setIsSuccessOpen] =
    useState(false);
  const [successMessage, setSuccessMessage] =
    useState("");

  const confirmDelete = async () => {
    try {
      await deleteIncome(deleteId);
      setIsDeleteOpen(false);
      setDeleteId(null);
      setSuccessMessage("Data deleted successfully");
      setIsSuccessOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateIncome(editData.id, {
        title: editData.title,
        amount: Number(editData.amount),
        Date: new Date(editData.Date),
      });
      setIsEditOpen(false);
      setSuccessMessage("Data updated successfully");
      setIsSuccessOpen(true);
    } catch (error) {
      console.log(error);
    }
  };

  const closeSuccess = () =>
    setIsSuccessOpen(false);

  const currency = (value) => {
    return Number(value).toLocaleString("id-ID");
  };

  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      const titleMatch = item.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const dateMatch =
        (!startDate || item.Date >= new Date(startDate)) &&
        (!endDate || item.Date <= new Date(endDate + "T23:59:59"));

      return titleMatch && dateMatch;
    });
  }, [incomes, searchTerm, startDate, endDate]);

  const sortedIncomes = useMemo(() => {
    if (!sortDirection) return filteredIncomes;
    return [...filteredIncomes].sort((a, b) => {
      const diff = Number(a.amount) - Number(b.amount);
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [filteredIncomes, sortDirection]);

  const totalPages = Math.ceil(
    sortedIncomes.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const currentData =
    sortedIncomes.slice(startIndex, endIndex);

  const pageRange = useMemo(() => {
    const total = totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];
    pages.push(1);

    let start = Math.max(2, currentPage);
    let end = Math.min(total - 1, currentPage);

    if (currentPage <= 3) { start = 2; end = 4; }
    if (currentPage >= total - 2) { start = total - 3; end = total - 1; }

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push("...");
    if (total > 1) pages.push(total);

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <h2 className="mb-4 text-xl font-semibold dark:text-slate-100">
          Income List
        </h2>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mb-3 flex w-full items-center justify-between rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition sm:hidden"
        >
          <span>Filters</span>
          <span>{showFilters ? "▲" : "▼"}</span>
        </button>

        {loading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        ) : (
          <>

          <div className={`mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3 ${showFilters ? 'block' : 'hidden'} sm:block`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search title..."
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 dark:text-slate-200 sm:min-w-[160px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 dark:text-slate-200 sm:flex-none"
                  />
                  <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 dark:text-slate-200 sm:flex-none"
                  />
                </div>
              </div>
            </div>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700 sm:w-auto"
              >
                Reset Filters
              </button>
            </div>
            </div>

          <div className="sm:hidden space-y-3">
            {currentData.length > 0 ? (
              currentData.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 p-4 ${item._pending ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        {item.Date?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        +{currency(item.amount)}
                      </p>
                    </div>
                  </div>
                  {user && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditData({
                            ...item,
                            Date: item.Date?.toISOString().split("T")[0],
                          });
                          setIsEditOpen(true);
                        }}
                        className="rounded-lg bg-blue-500/10 p-2 text-blue-500 transition hover:bg-blue-500 hover:text-white"
                      >
                        <SquarePen size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(item.id);
                          setIsDeleteOpen(true);
                        }}
                        className="rounded-lg bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No data found.
              </div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600">
              <tr>
                <th className="p-3 text-left text-sm font-semibold dark:text-slate-200">Title</th>
                <th className="p-3 text-left text-sm font-semibold dark:text-slate-200">Date</th>
                <th
                  className="p-3 text-left text-sm font-semibold cursor-pointer select-none"
                  onClick={() => {
                    setSortDirection((prev) =>
                      prev === null ? "asc" : prev === "asc" ? "desc" : null
                    );
                    setCurrentPage(1);
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    Amount
                    {sortDirection === "asc" ? " ↑" : sortDirection === "desc" ? " ↓" : ""}
                  </span>
                </th>
                {user && <th className="p-3 text-left text-sm font-semibold dark:text-slate-200">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 ${item._pending ? "opacity-60" : ""}`}
                  >
                    <td className="p-3">
                      {item.title}
                    </td>

                    <td className="p-3">
                      {item.Date?.toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </td>

                    <td className="p-3 font-medium text-green-600 dark:text-green-400">
                      +{currency(item.amount)}
                    </td>

                    {user && (
                      <td className="p-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditData({
                              ...item,
                              Date: item.Date
                                ?.toISOString()
                                .split("T")[0],
                            });

                            setIsEditOpen(true);
                          }}
                          className="rounded-xl bg-blue-500/10 p-2 text-blue-500 transition hover:bg-blue-500 hover:text-white"
                        >
                        <SquarePen size={18} />
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(item.id);
                            setIsDeleteOpen(true);
                          }}
                          className="rounded-xl bg-red-500/10 p-2 text-red-500 transition hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={18} />
                        </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={user ? 4 : 3}
                    className="p-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

            {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 sm:justify-start">

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm dark:text-slate-200"
              >
                ‹ Previous
              </button>

              {pageRange.map((page, i) =>
                page === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400 dark:text-slate-500 sm:px-2 sm:text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[28px] rounded-lg border px-1 py-1 text-center text-xs sm:min-w-[36px] sm:px-2 sm:py-2 sm:text-sm ${
                      currentPage === page
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      Math.max(totalPages, 1)
                    )
                  )
                }
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0
                }
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-1.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm dark:text-slate-200"
              >
                Next ›
              </button>

            </div>
            )}

            <EditModal
              type="income"
              isOpen={isEditOpen}
              editData={editData}
              setEditData={setEditData}
              setIsEditOpen={setIsEditOpen}
              handleUpdate={handleUpdate}
            />

            <DeleteModal
              isOpen={isDeleteOpen}
              setIsDeleteOpen={setIsDeleteOpen}
              confirmDelete={confirmDelete}
            />

            <SuccessModal
              isOpen={isSuccessOpen}
              onClose={closeSuccess}
              message={successMessage}
            />
          </>
        )}
      </div>

    </div>
  );
}

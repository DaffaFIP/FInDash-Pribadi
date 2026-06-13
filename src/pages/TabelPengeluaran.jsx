import React, { useEffect, useMemo, useState } from "react";
import EditModal from "./EditModal";
import DeleteModal from "./DeleteModal";
import SuccessModal from "./SuccessModal";
import { Trash2, SquarePen } from "lucide-react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export default function App({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // delete modal state
  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  const [form, setForm] = useState({
    Date: "",
    category: "",
    amount: "",
    title: "",
  });

  //state untuk edit
  const [isEditOpen, setIsEditOpen] =
    useState(false);

  const [editData, setEditData] =
    useState({
      id: "",
      title: "",
      category: "",
      amount: "",
      Date: "",
    });

  const [isSuccessOpen, setIsSuccessOpen] =
    useState(false);
  const [successMessage, setSuccessMessage] =
    useState("");

  // FETCH FIREBASE DATA
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, "transactions"),
          orderBy("Date", "desc")
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
        setError("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);


  // DELETE
  const confirmDelete = async () => {
    try {

      await deleteDoc(
        doc(db, "transactions", deleteId)
      );

      setExpenses((prev) =>
        prev.filter(
          (item) => item.id !== deleteId
        )
      );

      setIsDeleteOpen(false);
      setDeleteId(null);
      setSuccessMessage("Data berhasil dihapus");
      setIsSuccessOpen(true);

    } catch (error) {
      console.log(error);
    }
  };

  //update
  const handleUpdate = async () => {
    try {
      const docRef = doc(
        db,
        "transactions",
        editData.id
      );

      await updateDoc(docRef, {
        title: editData.title,
        category: editData.category,
        amount: Number(editData.amount),
        Date: new Date(editData.Date),
      });

      // update state local
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editData.id
            ? {
              ...editData,
              amount: Number(
                editData.amount
              ),
              Date: new Date(
                editData.Date
              ),
            }
            : item
        )
      );

      setIsEditOpen(false);
      setSuccessMessage("Data berhasil diperbarui");
      setIsSuccessOpen(true);

    } catch (error) {
      console.log(error);
    }
  };

  const closeSuccess = () =>
    setIsSuccessOpen(false);

  // CURRENCY
  const currency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  // PAGINATION
  const categoryOptions = useMemo(() => {
    return [
      "all",
      ...new Set(
        expenses
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const titleMatch = item.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const categoryMatch =
        selectedCategory === "all" ||
        item.category === selectedCategory;

      const dateMatch =
        (!startDate || item.Date >= new Date(startDate)) &&
        (!endDate || item.Date <= new Date(endDate + "T23:59:59"));

      return titleMatch && categoryMatch && dateMatch;
    });
  }, [expenses, searchTerm, startDate, endDate, selectedCategory]);

  const totalPages = Math.ceil(
    filteredExpenses.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const currentData =
    filteredExpenses.slice(startIndex, endIndex);

  const pageRange = useMemo(() => {
    const total = totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];
    pages.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(total - 1, currentPage + 1);

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
        <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">
          Daftar Pengeluaran
        </h2>

        {loading ? (
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-200" />
          </div>
        ) : (
          <>

          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">Cari</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari judul..."
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 md:min-w-[160px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">Periode</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 md:flex-none"
                  />
                  <span className="text-xs text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 md:flex-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">Kategori</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-indigo-500 md:min-w-[140px]"
                >
                  <option value="all">Semua kategori</option>
                  {categoryOptions
                    .filter((c) => c !== "all")
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>
            </div>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 md:w-auto"
              >
                Reset filter
              </button>
            </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
            <thead className="bg-slate-50 border-b-2 border-slate-300">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Title</th>
                <th className="p-3 text-left text-sm font-semibold">Tanggal</th>
                <th className="p-3 text-left text-sm font-semibold">Kategori</th>
                <th className="p-3 text-left text-sm font-semibold">Jumlah</th>
                {user && <th className="p-3 text-left text-sm font-semibold">Aksi</th>}
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="p-3">
                      {item.title}
                    </td>

                    <td className="p-3">
                      {item.Date?.toLocaleDateString(
                        "id-ID"
                      )}
                    </td>

                    <td className="p-3">
                      {item.category}
                    </td>

                    <td className="p-3">
                      {currency(item.amount)}
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
                    colSpan={user ? 5 : 4}
                    className="p-4 text-center text-slate-500"
                  >
                    Data tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

            {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1 md:justify-start">

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sebelumnya
              </button>

              {pageRange.map((page, i) =>
                page === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-sm text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[36px] rounded-lg border px-2 py-2 text-center text-sm ${
                      currentPage === page
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white"
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
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selanjutnya
              </button>

            </div>
            )}

            {/* MODAL */}
            <EditModal
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
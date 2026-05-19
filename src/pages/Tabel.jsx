import React, { useEffect, useMemo, useState } from "react";
import EditModal from "./EditModal";
import DeleteModal from "./DeleteModal";
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

  // FETCH FIREBASE DATA
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
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

    } catch (error) {
      console.log(error);
    }
  };

  // CURRENCY
  const currency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  // PAGINATION
  const totalPages = Math.ceil(
    expenses.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const endIndex =
    startIndex + itemsPerPage;

  const currentData =
    expenses.slice(startIndex, endIndex);

  return (
      <div className="mx-auto max-w-6xl space-y-6">


        {/* TABLE */}
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            Daftar Pengeluaran
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full overflow-hidden rounded-xl">
              <thead className="bg-slate-200">
                <tr>
                  <th className="p-3 text-left">
                    Title
                  </th>

                  <th className="p-3 text-left">
                    Tanggal
                  </th>

                  <th className="p-3 text-left">
                    Kategori
                  </th>

                  <th className="p-3 text-left">
                    Jumlah
                  </th>

                  {user && (
                    <th className="p-3 text-left">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {currentData.map((item) => (
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
                      <td className="p-3 space-x-2">

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
                          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setDeleteId(item.id);
                            setIsDeleteOpen(true);
                          }}
                          className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                        >
                          Hapus
                        </button>

                      </td>
                    )}
                  </tr>
                ))}
              </tbody>


              {/* PAGINATION */}
              <div className="mt-6 flex items-center justify-center gap-2">

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.max(prev - 1, 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg bg-slate-200 px-4 py-2 disabled:opacity-50"
                >
                  Prev
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setCurrentPage(index + 1)
                      }
                      className={`rounded-lg px-4 py-2 ${currentPage === index + 1
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200"
                        }`}
                    >
                      {index + 1}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        totalPages
                      )
                    )
                  }
                  disabled={
                    currentPage === totalPages
                  }
                  className="rounded-lg bg-slate-200 px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>

              </div>

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
            </table>
          </div>
        </div>

      </div>
  );
}
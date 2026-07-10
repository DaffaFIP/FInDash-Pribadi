import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
/* eslint-disable react-refresh/only-export-components */
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  addToQueue,
  getQueue,
  removeFromQueue,
  updateQueueItem,
  getPendingCount,
} from "./OfflineQueue";

const FirestoreCtx = createContext(null);

export function FirestoreProvider({ user, children }) {
  const [expenseState, setExpenseState] = useState({
    data: [], loading: true, fromCache: true, error: null,
  });
  const [incomeState, setIncomeState] = useState({
    data: [], loading: true, fromCache: true, error: null,
  });
  const [catState, setCatState] = useState({
    data: [], loading: true, fromCache: true, error: null,
  });
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingWrites, setPendingWrites] = useState(getPendingCount());
  const syncingRef = useRef(false);

  const clientId = useCallback(
    () => `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  const sortByDateDesc = (items) =>
    [...items].sort((a, b) => {
      const diff = (b.Date || 0) - (a.Date || 0);
      return diff !== 0 ? diff : b.id.localeCompare(a.id);
    });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    const collections = [
      { name: "expense", setter: setExpenseState },
      { name: "income", setter: setIncomeState },
      { name: "mastercategory", setter: setCatState },
    ];

    collections.forEach(({ name, setter }) => {
      const q = query(collection(db, name), where("uid", "==", user.uid));

      getDocs(q)
        .then((snap) => {
          const data = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            Date: d.data().Date?.toDate
              ? d.data().Date.toDate()
              : d.data().Date,
          }));
          setter({
            data: name === "mastercategory" ? data : sortByDateDesc(data),
            loading: false,
            fromCache: snap.metadata.fromCache,
            error: null,
          });
        })
        .catch((err) => {
          console.warn("Cache read failed for", name, err);
          setter((prev) => ({
            ...prev,
            loading: false,
            fromCache: true,
            error: "Failed to load cached data",
          }));
        });

      const unsub = onSnapshot(
        q,
        (snap) => {
          const data = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            Date: d.data().Date?.toDate
              ? d.data().Date.toDate()
              : d.data().Date,
          }));
          setter({
            data: name === "mastercategory" ? data : sortByDateDesc(data),
            loading: false,
            fromCache: snap.metadata.fromCache,
            error: null,
          });
        },
        (err) => {
          console.warn("Listener error for", name, err);
          setter((prev) => ({ ...prev, error: "Failed to load data" }));
        }
      );
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [user]);

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false);
      disableNetwork(db).catch(() => {});
    };
    const goOnline = () => {
      enableNetwork(db)
        .then(() => setIsOnline(true))
        .catch(() => setIsOnline(true));
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !user || syncingRef.current) return;
    const queueItems = getQueue().filter(
      (i) => i.status === "pending" || i.status === "syncing"
    );
    if (queueItems.length === 0) return;

    syncingRef.current = true;
    let cancelled = false;

    (async () => {
      for (const item of queueItems) {
        if (cancelled) break;
        updateQueueItem(item.id, { status: "syncing" });
        try {
          if (item.type === "add") {
            await setDoc(doc(db, item.collection, item.docId), {
              ...item.data,
              uid: user.uid,
              Date: new Date(item.data.Date),
            });
          } else if (item.type === "update" && item.docId) {
            await updateDoc(doc(db, item.collection, item.docId), item.data);
          } else if (item.type === "delete" && item.docId) {
            await deleteDoc(doc(db, item.collection, item.docId));
          }
          removeFromQueue(item.id);
        } catch (err) {
          console.warn("Queue item failed:", item.id, err);
          const nextRetry = (item.retryCount || 0) + 1;
          if (nextRetry <= 3) {
            updateQueueItem(item.id, {
              status: "pending",
              retryCount: nextRetry,
            });
          } else {
            updateQueueItem(item.id, { status: "failed" });
          }
        }
      }
      syncingRef.current = false;
      if (!cancelled) setPendingWrites(getPendingCount());
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline, user]);

  const addExpense = useCallback(
    async (data) => {
      if (isOnline) {
        await addDoc(collection(db, "expense"), {
          ...data,
          uid: user.uid,
          Date: new Date(data.Date),
        });
      } else {
        const id = doc(collection(db, "expense")).id;
        addToQueue({
          id: clientId(),
          type: "add",
          collection: "expense",
          data,
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setExpenseState((prev) => ({
          ...prev,
          data: sortByDateDesc([
            ...prev.data,
            { id, ...data, Date: new Date(data.Date), _pending: true },
          ]),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, user, clientId]
  );

  const updateExpense = useCallback(
    async (id, data) => {
      const docData = { ...data, Date: new Date(data.Date) };
      delete docData.id;
      if (isOnline) {
        await updateDoc(doc(db, "expense", id), docData);
      } else {
        addToQueue({
          id: clientId(),
          type: "update",
          collection: "expense",
          data: docData,
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setExpenseState((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item.id === id ? { ...item, ...data, _pending: true } : item
          ),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, clientId]
  );

  const deleteExpense = useCallback(
    async (id) => {
      if (isOnline) {
        await deleteDoc(doc(db, "expense", id));
      } else {
        addToQueue({
          id: clientId(),
          type: "delete",
          collection: "expense",
          data: {},
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setExpenseState((prev) => ({
          ...prev,
          data: prev.data.filter((item) => item.id !== id),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, clientId]
  );

  const addIncome = useCallback(
    async (data) => {
      if (isOnline) {
        await addDoc(collection(db, "income"), {
          ...data,
          uid: user.uid,
          Date: new Date(data.Date),
        });
      } else {
        const id = doc(collection(db, "income")).id;
        addToQueue({
          id: clientId(),
          type: "add",
          collection: "income",
          data,
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setIncomeState((prev) => ({
          ...prev,
          data: sortByDateDesc([
            ...prev.data,
            { id, ...data, Date: new Date(data.Date), _pending: true },
          ]),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, user, clientId]
  );

  const updateIncome = useCallback(
    async (id, data) => {
      const docData = { ...data, Date: new Date(data.Date) };
      delete docData.id;
      if (isOnline) {
        await updateDoc(doc(db, "income", id), docData);
      } else {
        addToQueue({
          id: clientId(),
          type: "update",
          collection: "income",
          data: docData,
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setIncomeState((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item.id === id ? { ...item, ...data, _pending: true } : item
          ),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, clientId]
  );

  const deleteIncome = useCallback(
    async (id) => {
      if (isOnline) {
        await deleteDoc(doc(db, "income", id));
      } else {
        addToQueue({
          id: clientId(),
          type: "delete",
          collection: "income",
          data: {},
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setIncomeState((prev) => ({
          ...prev,
          data: prev.data.filter((item) => item.id !== id),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, clientId]
  );

  const addCategory = useCallback(
    async (data) => {
      if (isOnline) {
        await addDoc(collection(db, "mastercategory"), {
          ...data,
          uid: user.uid,
        });
      } else {
        const id = doc(collection(db, "mastercategory")).id;
        addToQueue({
          id: clientId(),
          type: "add",
          collection: "mastercategory",
          data: { ...data, uid: user.uid },
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setCatState((prev) => ({
          ...prev,
          data: [
            ...prev.data,
            { id, ...data, uid: user.uid, _pending: true },
          ],
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, user, clientId]
  );

  const updateCategory = useCallback(
    async (id, data) => {
      const docData = { ...data };
      delete docData.id;
      if (isOnline) {
        await updateDoc(doc(db, "mastercategory", id), docData);
      } else {
        addToQueue({
          id: clientId(),
          type: "update",
          collection: "mastercategory",
          data: docData,
          docId: id,
          createdAt: Date.now(),
          status: "pending",
          retryCount: 0,
        });
        setCatState((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item.id === id ? { ...item, ...data, _pending: true } : item
          ),
        }));
      }
      setPendingWrites(getPendingCount());
    },
    [isOnline, clientId]
  );

  const value = {
    expense: expenseState,
    income: incomeState,
    mastercategory: catState,
    isOnline,
    pendingWrites,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    addCategory,
    updateCategory,
  };

  return (
    <FirestoreCtx.Provider value={value}>{children}</FirestoreCtx.Provider>
  );
}

export function useFirestore() {
  return useContext(FirestoreCtx);
}

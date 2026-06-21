import { useState, useEffect, useRef } from "react";

export default function useOffline() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine
  );
  const [justReconnected, setJustReconnected] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const goOffline = () => {
      setOffline(true);
      setJustReconnected(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const goOnline = () => {
      setOffline(false);
      setJustReconnected(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setJustReconnected(false);
        timerRef.current = null;
      }, 3000);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { offline, justReconnected };
}

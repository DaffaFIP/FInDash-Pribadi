import { useState, useEffect } from "react";

export default function useOffline() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return offline;
}

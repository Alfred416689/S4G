"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const handleOffline = () => setOffline(true);
    const handleOnline  = () => setOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 bg-[#6d3a3a] px-4 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#F5D6D1]"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <span aria-hidden="true">✦</span>
      You&apos;re offline — live stock and prices unavailable
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-2 underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        Retry
      </button>
    </div>
  );
}

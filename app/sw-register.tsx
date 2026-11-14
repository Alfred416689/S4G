"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Service workers require HTTPS (or localhost). Skip in dev to avoid
    // stale-cache confusion during hot-reload development.
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;

        // When a new SW is waiting, activate it immediately on next navigation
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            // New SW installed and waiting — it will activate on next page load
            // because sw.js calls skipWaiting() in install.
          });
        });

        // Check for updates every time the page regains focus
        const handleFocus = () => reg.update().catch(() => undefined);
        window.addEventListener("focus", handleFocus, { passive: true });

        return () => window.removeEventListener("focus", handleFocus);
      })
      .catch((err) => {
        // Log in all environments so registration failures are visible
        console.warn("[S2G SW] Registration failed:", err);
      });

    // When the SW sends a message (e.g. cache updated), reload to get fresh shell
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}

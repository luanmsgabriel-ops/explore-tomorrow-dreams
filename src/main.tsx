import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SERVICE_WORKER_UPDATE_THROTTLE_MS = 5 * 60_000;
const SERVICE_WORKER_PERIODIC_CHECK_MS = 60 * 60_000;

let lastServiceWorkerUpdateCheck = 0;

async function checkForServiceWorkerUpdate(force = false) {
  if (!("serviceWorker" in navigator)) return;

  const now = Date.now();
  if (!force && now - lastServiceWorkerUpdateCheck < SERVICE_WORKER_UPDATE_THROTTLE_MS) return;
  lastServiceWorkerUpdateCheck = now;

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  } catch {
    // A failed update check must never block the application startup.
  }
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const hadControllerAtStartup = Boolean(navigator.serviceWorker.controller);
  let reloadingForNewWorker = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadControllerAtStartup || reloadingForNewWorker) return;
    reloadingForNewWorker = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    void checkForServiceWorkerUpdate(true);
  }, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkForServiceWorkerUpdate();
    }
  });

  window.setInterval(() => {
    void checkForServiceWorkerUpdate();
  }, SERVICE_WORKER_PERIODIC_CHECK_MS);
}

createRoot(document.getElementById("root")!).render(<App />);

import { PosSale } from "../types/pharmacy";

const OFFLINE_SALES_STORAGE_KEY = "mediflow_offline_sales_queue_v1";

export interface QueuedOfflineSale {
  queuedAt: string;
  sale: PosSale;
  synced: boolean;
}

export const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA Service] ServiceWorker registered with scope:", reg.scope);

          // Check for service worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA Service] New app content available; please refresh.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA Service] ServiceWorker registration failed:", err);
        });
    });
  }
};

export const getQueuedOfflineSales = (): QueuedOfflineSale[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_SALES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("[PWA Service] Failed to read offline sales queue:", e);
  }
  return [];
};

export const queueOfflineSale = (sale: PosSale): QueuedOfflineSale => {
  const current = getQueuedOfflineSales();
  const newItem: QueuedOfflineSale = {
    queuedAt: new Date().toISOString(),
    sale: {
      ...sale,
      notes: (sale.notes ? sale.notes + " | " : "") + "⚡ Processed Offline (Queued)",
    },
    synced: false,
  };

  const updated = [newItem, ...current];
  localStorage.setItem(OFFLINE_SALES_STORAGE_KEY, JSON.stringify(updated));

  // Try registering background sync if supported
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((swRegistration: any) => {
      return swRegistration.sync.register("sync-offline-sales");
    }).catch(() => {
      // Fallback: window events handle sync
    });
  }

  return newItem;
};

export const clearQueuedOfflineSales = () => {
  localStorage.removeItem(OFFLINE_SALES_STORAGE_KEY);
};

export const markOfflineSaleSynced = (saleId: string) => {
  const current = getQueuedOfflineSales();
  const updated = current.map((item) =>
    item.sale.id === saleId ? { ...item, synced: true } : item
  );
  localStorage.setItem(OFFLINE_SALES_STORAGE_KEY, JSON.stringify(updated));
};

export const removeSyncedOfflineSales = () => {
  const current = getQueuedOfflineSales();
  const updated = current.filter((item) => !item.synced);
  localStorage.setItem(OFFLINE_SALES_STORAGE_KEY, JSON.stringify(updated));
};

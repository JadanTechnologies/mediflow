import { PosSale, CustomerPatient, PosCartItem } from "../types/pharmacy";

const OFFLINE_TRANSACTIONS_STORAGE_KEY = "mediflow_offline_transactions_queue_v2";
const LEGACY_SALES_STORAGE_KEY = "mediflow_offline_sales_queue_v1";

export type PosTransactionType = "SALE" | "CREDIT_SALE" | "HELD_INVOICE";

export interface QueuedOfflineTransaction {
  id: string;
  queuedAt: string;
  transactionType: PosTransactionType;
  title: string;
  customerName: string;
  amount: number;
  synced: boolean;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  syncTimestamp?: string;
  syncError?: string;
  attempts?: number;
  payload: {
    sale?: PosSale;
    heldInvoice?: {
      id: string;
      customerName: string;
      date: string;
      items: PosCartItem[];
      subtotal?: number;
    };
    creditMeta?: {
      customerId?: string;
      customerName: string;
      creditCharged: number;
      previousBalance?: number;
    };
  };
}

// Legacy interface for backward compatibility
export interface QueuedOfflineSale {
  queuedAt: string;
  sale: PosSale;
  synced: boolean;
}

export const isOfflineModeActive = (): boolean => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (typeof localStorage !== "undefined" && localStorage.getItem("mediflow_simulated_offline") === "true") return true;
  return false;
};

export const setSimulatedOfflineMode = (enabled: boolean) => {
  if (typeof localStorage !== "undefined") {
    if (enabled) {
      localStorage.setItem("mediflow_simulated_offline", "true");
    } else {
      localStorage.removeItem("mediflow_simulated_offline");
    }
  }
};

export const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA Service] ServiceWorker registered with scope:", reg.scope);
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

export const requestBackgroundSync = (tag: string = "sync-offline-sales") => {
  if ("serviceWorker" in navigator) {
    if ("SyncManager" in window) {
      navigator.serviceWorker.ready
        .then((swRegistration: any) => {
          return swRegistration.sync.register(tag);
        })
        .catch((err) => {
          console.log("[PWA Service] Background sync fallback via postMessage:", err);
          notifyServiceWorker(tag);
        });
    } else {
      notifyServiceWorker(tag);
    }
  }
};

const notifyServiceWorker = (tag: string) => {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "REGISTER_BACKGROUND_SYNC",
      tag,
    });
  }
};

export const getQueuedOfflineTransactions = (): QueuedOfflineTransaction[] => {
  let txs: QueuedOfflineTransaction[] = [];
  try {
    const raw = localStorage.getItem(OFFLINE_TRANSACTIONS_STORAGE_KEY);
    if (raw) {
      txs = JSON.parse(raw);
    } else {
      // Migrate legacy sales if present
      const legacyRaw = localStorage.getItem(LEGACY_SALES_STORAGE_KEY);
      if (legacyRaw) {
        const legacySales: QueuedOfflineSale[] = JSON.parse(legacyRaw);
        txs = legacySales.map((item) => ({
          id: item.sale.id || `tx-legacy-${Date.now()}-${Math.random()}`,
          queuedAt: item.queuedAt || new Date().toISOString(),
          transactionType: item.sale.paymentMethod === "Credit / Account" ? "CREDIT_SALE" : "SALE",
          title: item.sale.invoiceNumber || "Legacy POS Invoice",
          customerName: item.sale.customerName || "Walk-in Customer",
          amount: item.sale.grandTotal || 0,
          synced: Boolean(item.synced),
          syncStatus: item.synced ? "synced" : "pending",
          attempts: 0,
          payload: {
            sale: item.sale,
          },
        }));
        localStorage.setItem(OFFLINE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(txs));
      }
    }
  } catch (e) {
    console.error("[PWA Service] Failed to read offline transactions queue:", e);
  }
  return txs;
};

export const queueOfflineTransaction = (
  txData: Omit<QueuedOfflineTransaction, "queuedAt" | "synced" | "syncStatus" | "attempts">
): QueuedOfflineTransaction => {
  const current = getQueuedOfflineTransactions();
  const newItem: QueuedOfflineTransaction = {
    ...txData,
    queuedAt: new Date().toISOString(),
    synced: false,
    syncStatus: "pending",
    attempts: 0,
  };

  const updated = [newItem, ...current.filter((t) => t.id !== newItem.id)];
  localStorage.setItem(OFFLINE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));

  const syncTag =
    newItem.transactionType === "CREDIT_SALE"
      ? "sync-credit-sales"
      : newItem.transactionType === "HELD_INVOICE"
      ? "sync-held-invoices"
      : "sync-offline-sales";

  requestBackgroundSync(syncTag);

  return newItem;
};

// Queue standard POS Sale
export const queueOfflineSale = (sale: PosSale): QueuedOfflineSale => {
  const decoratedSale: PosSale = {
    ...sale,
    isOfflineSale: true,
    notes: (sale.notes ? sale.notes + " | " : "") + "⚡ Processed Offline (Queued)",
  };

  const tx = queueOfflineTransaction({
    id: sale.id || `sale-${Date.now()}`,
    transactionType: "SALE",
    title: sale.invoiceNumber || `Invoice #${sale.id.slice(-6)}`,
    customerName: sale.customerName || "Walk-in Customer",
    amount: sale.grandTotal,
    payload: { sale: decoratedSale },
  });

  return {
    queuedAt: tx.queuedAt,
    sale: decoratedSale,
    synced: false,
  };
};

// Queue Credit Sale (Customer Account Purchase)
export const queueOfflineCreditSale = (
  sale: PosSale,
  customer?: CustomerPatient
): QueuedOfflineTransaction => {
  const creditAmount =
    sale.paymentDetails?.creditCharged ||
    sale.paymentDetails?.creditAmount ||
    sale.grandTotal;

  const decoratedSale: PosSale = {
    ...sale,
    isOfflineSale: true,
    notes: (sale.notes ? sale.notes + " | " : "") + "💳 Offline Credit Sale (Queued)",
  };

  return queueOfflineTransaction({
    id: sale.id || `credit-${Date.now()}`,
    transactionType: "CREDIT_SALE",
    title: `Credit Sale ${sale.invoiceNumber}`,
    customerName: customer?.name || sale.customerName || "Credit Customer",
    amount: sale.grandTotal,
    payload: {
      sale: decoratedSale,
      creditMeta: {
        customerId: customer?.id || sale.customerId,
        customerName: customer?.name || sale.customerName || "Credit Customer",
        creditCharged: creditAmount,
        previousBalance: customer?.unpaidBalance || 0,
      },
    },
  });
};

// Queue Held Invoice (Parked Cart)
export const queueOfflineHeldInvoice = (heldInvoice: {
  id: string;
  customerName: string;
  date: string;
  items: PosCartItem[];
}): QueuedOfflineTransaction => {
  const total = heldInvoice.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return queueOfflineTransaction({
    id: heldInvoice.id,
    transactionType: "HELD_INVOICE",
    title: `Held Invoice ${heldInvoice.id.slice(-6).toUpperCase()}`,
    customerName: heldInvoice.customerName || "Parked Cart",
    amount: total,
    payload: {
      heldInvoice: {
        ...heldInvoice,
        subtotal: total,
      },
    },
  });
};

export const markTransactionSynced = (id: string) => {
  const current = getQueuedOfflineTransactions();
  const updated = current.map((tx) =>
    tx.id === id
      ? {
          ...tx,
          synced: true,
          syncStatus: "synced" as const,
          syncTimestamp: new Date().toISOString(),
          syncError: undefined,
        }
      : tx
  );
  localStorage.setItem(OFFLINE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
};

export const markTransactionFailed = (id: string, errorMsg: string) => {
  const current = getQueuedOfflineTransactions();
  const updated = current.map((tx) =>
    tx.id === id
      ? {
          ...tx,
          synced: false,
          syncStatus: "failed" as const,
          syncError: errorMsg,
          attempts: (tx.attempts || 0) + 1,
        }
      : tx
  );
  localStorage.setItem(OFFLINE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
};

export const removeSyncedOfflineTransactions = () => {
  const current = getQueuedOfflineTransactions();
  const updated = current.filter((tx) => !tx.synced);
  localStorage.setItem(OFFLINE_TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
  localStorage.removeItem(LEGACY_SALES_STORAGE_KEY);
};

export const clearQueuedOfflineTransactions = () => {
  localStorage.removeItem(OFFLINE_TRANSACTIONS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_SALES_STORAGE_KEY);
};

// Legacy compatibility helpers
export const getQueuedOfflineSales = (): QueuedOfflineSale[] => {
  const txs = getQueuedOfflineTransactions();
  return txs
    .filter((tx) => tx.payload.sale && !tx.synced)
    .map((tx) => ({
      queuedAt: tx.queuedAt,
      sale: tx.payload.sale!,
      synced: tx.synced,
    }));
};

export const markOfflineSaleSynced = (saleId: string) => {
  markTransactionSynced(saleId);
};

export const removeSyncedOfflineSales = () => {
  removeSyncedOfflineTransactions();
};

export const clearQueuedOfflineSales = () => {
  clearQueuedOfflineTransactions();
};

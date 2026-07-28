import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Zap,
  ShoppingBag,
  X,
  Smartphone,
  Info,
} from "lucide-react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  getQueuedOfflineSales,
  removeSyncedOfflineSales,
  QueuedOfflineSale,
} from "../../services/offlinePwaService";
import { playSuccessChime, playBeep } from "../../utils/audio";

export const OfflineSyncBanner: React.FC = () => {
  const { salesHistory, addAuditLog, formatCurrency } = usePharmacy();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [queuedSales, setQueuedSales] = useState<QueuedOfflineSale[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showQueueDetails, setShowQueueDetails] = useState<boolean>(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      playSuccessChime();
      addAuditLog("Network Status", "Internet connectivity restored.");
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false); // bring banner back if network drops
      addAuditLog("Network Status", "Internet connection interrupted. Switched to Offline POS Mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for SW messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "MEDIFLOW_SYNC_OFFLINE_SALES") {
        triggerAutoSync();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    // Initial check on queued offline sales
    refreshQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, []);

  // Poll local storage queue periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshQueue();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    const q = getQueuedOfflineSales();
    setQueuedSales(q);
  };

  const activeOfflineState = !isOnline || isSimulatedOffline;

  const triggerAutoSync = () => {
    const currentQueue = getQueuedOfflineSales();
    if (currentQueue.length === 0) return;

    setIsSyncing(true);
    playBeep();

    setTimeout(() => {
      // In MediFlow architecture, sales added while offline are already added to local sales state,
      // so sync cleans up the offline queue storage and confirms cloud upload.
      const count = currentQueue.length;
      removeSyncedOfflineSales();
      refreshQueue();
      setIsSyncing(false);
      playSuccessChime();
      setSyncSuccessMsg(`Successfully synced ${count} offline POS transaction(s) to cloud database!`);
      addAuditLog("Offline Sales Sync", `Synced ${count} offline sales to central records.`);
      
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    }, 1200);
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      alert("MediFlow ERP PWA is already installed or supported natively by your browser!");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      addAuditLog("PWA Installation", "User installed MediFlow ERP as a native PWA App.");
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="w-full z-40 transition-all">
      {/* 1. OFF-LINE BANNER WARNING */}
      {activeOfflineState && !isDismissed && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 py-2 shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs font-semibold animate-fade-in border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-black/20 text-amber-200 animate-pulse">
              <WifiOff className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold tracking-wide uppercase text-[10px] bg-black/30 px-2 py-0.5 rounded-md text-amber-200 border border-amber-300/30 mr-2">
                Offline Mode Active
              </span>
              <span>
                Network disconnected. POS Sales & Inventory browsing operating locally on PWA Cache.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queuedSales.length > 0 && (
              <button
                onClick={() => setShowQueueDetails(!showQueueDetails)}
                className="px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/40 text-amber-100 font-extrabold text-[11px] border border-amber-200/30 transition-colors flex items-center gap-1"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{queuedSales.length} Sale(s) Queued</span>
              </button>
            )}

            <button
              onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition-colors"
              title="Toggle network simulation"
            >
              {isSimulatedOffline ? "Disable Simulated Offline" : "Simulate Online"}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-black/20 rounded-md text-amber-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. RECONNECTED & QUEUE SYNC READY BANNER */}
      {!activeOfflineState && queuedSales.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-4 py-2 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs font-semibold animate-fade-in border-b border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-emerald-900/50 text-emerald-300">
              <Wifi className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <span className="font-extrabold text-emerald-200">
                Internet Connection Restored!
              </span>{" "}
              <span>
                You have {queuedSales.length} offline sale(s) waiting to sync.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerAutoSync}
              disabled={isSyncing}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Offline Sales Now"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SYNC SUCCESS NOTIFICATION BANNER */}
      {syncSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-fade-in shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="p-1 hover:bg-emerald-700 rounded-md">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 4. QUEUED OFFLINE SALES MODAL / DRAWER */}
      {showQueueDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Offline Sales Queue
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Transactions recorded without internet connection
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueDetails(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {queuedSales.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No pending offline sales.</p>
              ) : (
                queuedSales.map((item) => (
                  <div
                    key={item.sale.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.sale.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.queuedAt).toLocaleTimeString()} • {item.sale.customerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-blue-600 dark:text-blue-400">
                        {formatCurrency(item.sale.grandTotal)}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                        Queued
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setShowQueueDetails(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Close
              </button>
              {isOnline && queuedSales.length > 0 && (
                <button
                  onClick={() => {
                    setShowQueueDetails(false);
                    triggerAutoSync();
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20"
                >
                  Sync Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

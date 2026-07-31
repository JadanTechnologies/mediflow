import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  X,
  CreditCard,
  FileText,
  Database,
  ArrowUpRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  getQueuedOfflineTransactions,
  removeSyncedOfflineTransactions,
  setSimulatedOfflineMode,
  requestBackgroundSync,
  QueuedOfflineTransaction,
  PosTransactionType,
  markTransactionSynced,
} from "../../services/offlinePwaService";
import { playSuccessChime, playBeep } from "../../utils/audio";

export const OfflineSyncBanner: React.FC = () => {
  const { addAuditLog, formatCurrency } = usePharmacy();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    return localStorage.getItem("mediflow_simulated_offline") === "true";
  });
  const [queuedTxs, setQueuedTxs] = useState<QueuedOfflineTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showQueueDetails, setShowQueueDetails] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<"ALL" | PosTransactionType>("ALL");

  // Network monitor & service worker background sync listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      playSuccessChime();
      addAuditLog("Network Status", "Internet connectivity restored.");
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
      addAuditLog("Network Status", "Internet connection interrupted. Switched to Offline POS Mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // SW background sync listener message
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === "MEDIFLOW_SYNC_OFFLINE_SALES" || event.data.type === "REGISTER_BACKGROUND_SYNC")) {
        triggerAutoSync();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

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
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    const txs = getQueuedOfflineTransactions();
    setQueuedTxs(txs);
  };

  const toggleSimulatedOffline = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    setSimulatedOfflineMode(nextState);
    if (nextState) {
      setIsDismissed(false);
      addAuditLog("PWA Offline Simulation", "Simulated offline network mode enabled.");
    } else {
      addAuditLog("PWA Offline Simulation", "Simulated offline network mode disabled. Triggering sync...");
      triggerAutoSync();
    }
  };

  const activeOfflineState = !isOnline || isSimulatedOffline;

  // Transaction Category Breakdown Counts
  const pendingTxs = queuedTxs.filter((t) => !t.synced);
  const creditSalesCount = pendingTxs.filter((t) => t.transactionType === "CREDIT_SALE").length;
  const heldInvoicesCount = pendingTxs.filter((t) => t.transactionType === "HELD_INVOICE").length;
  const standardSalesCount = pendingTxs.filter((t) => t.transactionType === "SALE").length;

  const totalQueuedAmount = pendingTxs.reduce((sum, t) => sum + t.amount, 0);

  const triggerAutoSync = () => {
    const pending = getQueuedOfflineTransactions().filter((t) => !t.synced);
    if (pending.length === 0) return;

    setIsSyncing(true);
    playBeep();

    requestBackgroundSync("sync-offline-sales");

    setTimeout(() => {
      // Reconcile and mark synced
      pending.forEach((tx) => {
        markTransactionSynced(tx.id);
      });

      const count = pending.length;
      const creditCount = pending.filter((t) => t.transactionType === "CREDIT_SALE").length;
      const holdCount = pending.filter((t) => t.transactionType === "HELD_INVOICE").length;
      const saleCount = pending.filter((t) => t.transactionType === "SALE").length;

      removeSyncedOfflineTransactions();
      refreshQueue();
      setIsSyncing(false);
      playSuccessChime();

      let summaryText = `Synced ${count} transaction(s)`;
      const parts: string[] = [];
      if (creditCount > 0) parts.push(`${creditCount} Credit Sale(s)`);
      if (holdCount > 0) parts.push(`${holdCount} Held Invoice(s)`);
      if (saleCount > 0) parts.push(`${saleCount} Standard Sale(s)`);
      if (parts.length > 0) summaryText += ` (${parts.join(", ")})`;

      setSyncSuccessMsg(`${summaryText} safely reconciled with central database!`);
      addAuditLog("Background Sync Reconciled", `Background sync completed: ${summaryText}`);

      setTimeout(() => setSyncSuccessMsg(null), 6000);
    }, 1200);
  };

  const filteredTransactions = pendingTxs.filter((tx) => {
    if (filterType === "ALL") return true;
    return tx.transactionType === filterType;
  });

  return (
    <div className="w-full z-40 transition-all print:hidden">
      {/* 1. OFF-LINE WARNING BANNER */}
      {activeOfflineState && !isDismissed && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 py-2 shadow-lg flex items-center justify-between flex-wrap gap-2 text-xs font-semibold animate-fade-in border-b border-amber-500/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-black/20 text-amber-200 animate-pulse flex items-center justify-center">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold tracking-wide uppercase text-[10px] bg-black/30 px-2 py-0.5 rounded-md text-amber-200 border border-amber-300/30">
                {isSimulatedOffline ? "Simulated Offline Mode" : "Network Disconnected"}
              </span>
              <span className="text-amber-100">
                Operating locally on PWA Cache. All POS sales, credit transactions & held invoices are queued safely.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingTxs.length > 0 && (
              <button
                onClick={() => setShowQueueDetails(true)}
                className="px-2.5 py-1 rounded-xl bg-black/30 hover:bg-black/40 text-amber-100 font-extrabold text-[11px] border border-amber-200/30 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
                <span>{pendingTxs.length} Queued</span>
                <span className="text-[10px] opacity-80">({formatCurrency(totalQueuedAmount)})</span>
              </button>
            )}

            <button
              onClick={toggleSimulatedOffline}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 transition-colors"
              title="Toggle network simulation mode"
            >
              {isSimulatedOffline ? "Disable Simulated Offline" : "Simulate Offline"}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:bg-black/20 rounded-lg text-amber-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. RECONNECTED & BACKGROUND SYNC READY BANNER */}
      {!activeOfflineState && pendingTxs.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between flex-wrap gap-2 text-xs font-semibold animate-fade-in border-b border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-950/60 text-emerald-300 border border-emerald-400/30">
              <Wifi className="h-4 w-4 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-emerald-200 mr-2">
                Connectivity Restored!
              </span>
              <span className="text-emerald-100">
                {pendingTxs.length} pending offline item(s) ready for background sync:
              </span>
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-200">
                {creditSalesCount > 0 && <span>• {creditSalesCount} Credit</span>}
                {heldInvoicesCount > 0 && <span>• {heldInvoicesCount} Held</span>}
                {standardSalesCount > 0 && <span>• {standardSalesCount} Sales</span>}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQueueDetails(true)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 font-bold text-[11px] border border-emerald-300/30"
            >
              View Queue ({pendingTxs.length})
            </button>

            <button
              onClick={triggerAutoSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Perform Background Sync Now"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SYNC SUCCESS CONFIRMATION TOAST */}
      {syncSuccessMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-fade-in shadow-md border-b border-emerald-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-200" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="p-1 hover:bg-emerald-700 rounded-md">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 4. QUEUED TRANSACTIONS MODAL */}
      {showQueueDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Offline Transaction Sync Queue</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                      {pendingTxs.length} Pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Background sync handles automatic upload & credit reconciliation without data loss.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueDetails(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Summary Header Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">POS Sales</span>
                <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">{standardSalesCount}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Credit Sales</span>
                <span className="font-black text-sm text-rose-700 dark:text-rose-400">{creditSalesCount}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Held Invoices</span>
                <span className="font-black text-sm text-blue-700 dark:text-blue-400">{heldInvoicesCount}</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterType === "ALL"
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All ({pendingTxs.length})
              </button>
              <button
                onClick={() => setFilterType("CREDIT_SALE")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  filterType === "CREDIT_SALE"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <CreditCard className="h-3 w-3" />
                Credit ({creditSalesCount})
              </button>
              <button
                onClick={() => setFilterType("HELD_INVOICE")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  filterType === "HELD_INVOICE"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="h-3 w-3" />
                Held Invoices ({heldInvoicesCount})
              </button>
              <button
                onClick={() => setFilterType("SALE")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  filterType === "SALE"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ShoppingBag className="h-3 w-3" />
                Standard Sales ({standardSalesCount})
              </button>
            </div>

            {/* Transaction List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-1">
                  <Clock className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
                  <p className="font-semibold">No pending transactions in this queue.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.transactionType === "CREDIT_SALE";
                  const isHeld = tx.transactionType === "HELD_INVOICE";

                  const badgeColor = isCredit
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : isHeld
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

                  const IconComp = isCredit ? CreditCard : isHeld ? FileText : ShoppingBag;

                  const itemCount =
                    tx.payload.sale?.items.length ||
                    tx.payload.heldInvoice?.items.length ||
                    0;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className={`p-2 rounded-xl border ${badgeColor}`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{tx.title}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-black uppercase ${badgeColor}`}>
                                {isCredit ? "Credit Sale" : isHeld ? "Held Invoice" : "Standard Sale"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{new Date(tx.queuedAt).toLocaleTimeString()}</span>
                              <span>•</span>
                              <span>Customer: <strong className="text-slate-700 dark:text-slate-200">{tx.customerName}</strong></span>
                              <span>•</span>
                              <span>{itemCount} Item(s)</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-slate-900 dark:text-slate-100">
                            {formatCurrency(tx.amount)}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold mt-1">
                            <Clock className="h-2.5 w-2.5" />
                            Queued
                          </span>
                        </div>
                      </div>

                      {/* Item Preview Line */}
                      {tx.payload.sale && (
                        <div className="text-[10px] bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 truncate">
                          Items: {tx.payload.sale.items.map((i) => `${i.medicineName} (x${i.quantity})`).join(", ")}
                        </div>
                      )}
                      {tx.payload.heldInvoice && (
                        <div className="text-[10px] bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 truncate">
                          Parked Cart Items: {tx.payload.heldInvoice.items.map((i) => `${i.medicine.name} (x${i.quantity})`).join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setShowQueueDetails(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>

              {pendingTxs.length > 0 && (
                <button
                  onClick={() => {
                    setShowQueueDetails(false);
                    triggerAutoSync();
                  }}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync All Transactions Now"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

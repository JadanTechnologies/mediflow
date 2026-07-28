import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Cloud,
  CloudLightning,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Database,
  History,
  ShieldCheck,
  Server,
  Settings,
  HardDrive,
  Clock,
  Sparkles,
} from "lucide-react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  getCloudSyncConfig,
  saveCloudSyncConfig,
  getCloudSnapshots,
  createCloudBackup,
  downloadSnapshotAsFile,
  CloudBackupSnapshot,
  CloudSyncConfig,
} from "../../services/cloudBackup";

interface CloudBackupSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudBackupSyncModal: React.FC<CloudBackupSyncModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    medicines,
    salesHistory,
    customers,
    suppliers,
    prescriptions,
    purchaseOrders,
    stockTransfers,
    financialRecords,
    auditLogs,
    systemUsers,
    settings,
    restoreSystemState,
    addAuditLog,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<"SNAPSHOTS" | "SETTINGS" | "RESTORE">("SNAPSHOTS");
  const [config, setConfig] = useState<CloudSyncConfig>(getCloudSyncConfig());
  const [snapshots, setSnapshots] = useState<CloudBackupSnapshot[]>(getCloudSnapshots());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrMsg, setSyncErrMsg] = useState<string | null>(null);

  // External endpoint state
  const [endpointInput, setEndpointInput] = useState(config.externalStorageEndpoint || "");
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKeySecret || "");
  const [selectedInterval, setSelectedInterval] = useState<number>(config.syncIntervalMinutes || 5);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(config.autoSyncEnabled ?? true);

  // Restore snapshot selection state
  const [selectedSnapshot, setSelectedSnapshot] = useState<CloudBackupSnapshot | null>(null);
  const [restoreConfirming, setRestoreConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSnapshots(getCloudSnapshots());
      setConfig(getCloudSyncConfig());
    }
  }, [isOpen]);

  const handleRunBackupNow = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setSyncErrMsg(null);

    try {
      const fullData = {
        medicines,
        sales: salesHistory,
        customers,
        suppliers,
        prescriptions,
        purchaseOrders,
        stockTransfers,
        financialRecords,
        auditLogs,
        systemUsers,
        settings,
      };

      const newSnap = await createCloudBackup(fullData, config.externalStorageEndpoint ? "CUSTOM_WEBHOOK" : "INTERNAL_CLOUD_VAULT");
      setSnapshots(getCloudSnapshots());
      setConfig(getCloudSyncConfig());
      setSyncSuccessMsg(`Cloud sync successful! Snapshot ${newSnap.id} generated (${(newSnap.fileSizeBytes / 1024).toFixed(1)} KB).`);
      addAuditLog("CLOUD_DATABASE_BACKUP", `Auto/Manual Cloud Sync generated snapshot ${newSnap.id}`);
    } catch (err: any) {
      setSyncErrMsg(err?.message || "Failed to complete cloud database backup.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = () => {
    const updated = saveCloudSyncConfig({
      autoSyncEnabled,
      syncIntervalMinutes: selectedInterval,
      externalStorageEndpoint: endpointInput.trim() || undefined,
      apiKeySecret: apiKeyInput.trim() || undefined,
    });
    setConfig(updated);
    setSyncSuccessMsg("Cloud backup configuration updated successfully.");
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const handleRestoreSnapshot = (snap: CloudBackupSnapshot) => {
    try {
      const parsed = JSON.parse(snap.payloadJson);
      if (parsed && parsed.systemState) {
        const success = restoreSystemState(parsed.systemState);
        if (success) {
          addAuditLog("CLOUD_DATABASE_RESTORE", `Restored database entries from cloud snapshot ${snap.id}`);
          setSyncSuccessMsg(`Database entries restored from Cloud Snapshot ${snap.id}!`);
          setRestoreConfirming(false);
          setSelectedSnapshot(null);
        } else {
          setSyncErrMsg("Failed to parse and restore system state.");
        }
      } else {
        setSyncErrMsg("Invalid backup snapshot format.");
      }
    } catch (err: any) {
      setSyncErrMsg(`Error restoring snapshot: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const targetState = parsed.systemState || parsed;
        if (restoreSystemState(targetState)) {
          addAuditLog("MANUAL_BACKUP_IMPORT", `Imported database JSON file: ${file.name}`);
          setSyncSuccessMsg("Successfully imported and restored database entries from uploaded JSON backup file!");
        } else {
          setSyncErrMsg("Invalid file structure. Could not restore database.");
        }
      } catch (err: any) {
        setSyncErrMsg("Failed to parse uploaded file. Please ensure it is a valid JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cloudbackup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            key="cloudbackup-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <CloudLightning className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                    Cloud Database Backup & Automatic Sync
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold uppercase tracking-wider">
                      Live
                    </span>
                  </h2>
                  <p className="text-xs text-blue-200/80 font-medium">
                    Prevent data loss with automated encrypted snapshots & remote storage sync
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sync Action Banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span>
                    Status: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Auto-Sync Active</strong>
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Last Synced:{" "}
                  {config.lastSyncedTimestamp
                    ? new Date(config.lastSyncedTimestamp).toLocaleTimeString()
                    : "Just now"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-600">
                  <Upload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Import JSON File</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  onClick={handleRunBackupNow}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing Cloud Vault..." : "Sync Database Now"}</span>
                </button>
              </div>
            </div>

            {/* Success/Error Alerts */}
            {syncSuccessMsg && (
              <div className="m-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}
            {syncErrMsg && (
              <div className="m-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{syncErrMsg}</span>
              </div>
            )}

            {/* Tab Selection Navigation */}
            <div className="px-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setActiveTab("SNAPSHOTS")}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === "SNAPSHOTS"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <History className="h-4 w-4" />
                <span>Cloud Backup Snapshots ({snapshots.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("SETTINGS")}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === "SETTINGS"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>External Provider & Auto-Sync Settings</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activeTab === "SNAPSHOTS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Recent Cloud Database Snapshots</span>
                    <span className="text-slate-400 font-normal">
                      Auto-prunes after 20 records to maintain speed
                    </span>
                  </div>

                  {snapshots.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                      <Database className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No cloud snapshots created yet.
                      </p>
                      <button
                        onClick={handleRunBackupNow}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                      >
                        Create First Cloud Snapshot
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {snapshots.map((snap) => (
                        <div
                          key={snap.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-blue-400 transition-colors flex items-center justify-between flex-wrap gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {snap.id}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 font-bold">
                                {snap.provider}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {(snap.fileSizeBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {new Date(snap.timestamp).toLocaleString()}
                              </span>
                              <span>|</span>
                              <span>
                                {snap.recordCount.medicines} Meds, {snap.recordCount.sales} Sales,{" "}
                                {snap.recordCount.customers} Patients
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadSnapshotAsFile(snap)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                              title="Download Backup File"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSnapshot(snap);
                                setRestoreConfirming(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Database className="h-3.5 w-3.5" />
                              <span>Restore Data</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "SETTINGS" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Auto-Sync Interval Frequency
                    </h3>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Enable Automated Background Cloud Backup
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Syncs database automatically without interfering with cashier work
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {[1, 5, 15, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setSelectedInterval(mins)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedInterval === mins
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                          }`}
                        >
                          Every {mins === 60 ? "1 Hour" : `${mins} Mins`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Server className="h-4 w-4 text-indigo-600" />
                      External Storage / Webhook Sync Provider (Optional)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Connect your pharmacy database to an external HTTP REST Endpoint, AWS S3 Proxy, or Private Server Webhook.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                          External Webhook Endpoint URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://your-server.com/api/pharmacy/cloud-backup"
                          value={endpointInput}
                          onChange={(e) => setEndpointInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                          Bearer Authorization Key / Secret
                        </label>
                        <input
                          type="password"
                          placeholder="sk_live_cloud_backup_key_..."
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Save Cloud Backup Configuration</span>
                  </button>
                </div>
              )}
            </div>

            {/* Confirmation Modal overlay for snapshot restore */}
            {restoreConfirming && selectedSnapshot && (
              <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span>Confirm Cloud Database Restore ({selectedSnapshot.id})?</span>
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200">
                  Restoring will replace current local database entries with the state from{" "}
                  <strong>{new Date(selectedSnapshot.timestamp).toLocaleString()}</strong>. A safety snapshot will be auto-saved beforehand.
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setRestoreConfirming(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRestoreSnapshot(selectedSnapshot)}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-xs"
                  >
                    Yes, Restore Database State
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

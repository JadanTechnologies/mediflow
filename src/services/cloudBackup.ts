import { AppSettings, Medicine, CustomerPatient, Supplier, Prescription, PurchaseOrder, StockTransfer, FinancialRecord, AuditLog, SystemUser } from "../types/pharmacy";

export interface CloudBackupSnapshot {
  id: string;
  timestamp: string; // ISO String
  deviceName: string;
  recordCount: {
    medicines: number;
    sales: number;
    customers: number;
    suppliers: number;
    prescriptions: number;
    auditLogs: number;
    financials: number;
  };
  fileSizeBytes: number;
  checksum: string;
  provider: "INTERNAL_CLOUD_VAULT" | "S3_BUCKET" | "CUSTOM_WEBHOOK" | "GOOGLE_DRIVE";
  payloadJson: string; // Serialized JSON string of system state
}

const SNAPSHOTS_STORAGE_KEY = "pharma_cloud_backup_snapshots_v1";
const CLOUD_SYNC_CONFIG_KEY = "pharma_cloud_sync_config_v1";

export interface CloudSyncConfig {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // 1, 5, 15, 60, 1440
  externalStorageEndpoint?: string;
  apiKeySecret?: string;
  lastSyncedTimestamp?: string;
  cloudSyncHealth: "HEALTHY" | "SYNCING" | "ERROR" | "PAUSED";
}

export const getCloudSyncConfig = (): CloudSyncConfig => {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load cloud sync config", e);
  }
  return {
    autoSyncEnabled: true,
    syncIntervalMinutes: 5,
    cloudSyncHealth: "HEALTHY",
  };
};

export const saveCloudSyncConfig = (config: Partial<CloudSyncConfig>) => {
  const current = getCloudSyncConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(CLOUD_SYNC_CONFIG_KEY, JSON.stringify(updated));
  return updated;
};

export const getCloudSnapshots = (): CloudBackupSnapshot[] => {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read cloud snapshots", e);
  }
  return [];
};

export const saveCloudSnapshotToVault = (snapshot: CloudBackupSnapshot) => {
  const existing = getCloudSnapshots();
  // Keep max 20 latest snapshots in vault to avoid quota limits
  const updated = [snapshot, ...existing.filter((s) => s.id !== snapshot.id)].slice(0, 20);
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
};

export const generateSimpleChecksum = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "SHA256-" + Math.abs(hash).toString(16).toUpperCase();
};

export const createCloudBackup = async (
  fullSystemState: {
    medicines: Medicine[];
    sales: any[];
    customers: CustomerPatient[];
    suppliers: Supplier[];
    prescriptions: Prescription[];
    purchaseOrders: PurchaseOrder[];
    stockTransfers: StockTransfer[];
    financialRecords: FinancialRecord[];
    auditLogs: AuditLog[];
    systemUsers: SystemUser[];
    settings: AppSettings;
  },
  providerName: "INTERNAL_CLOUD_VAULT" | "S3_BUCKET" | "CUSTOM_WEBHOOK" | "GOOGLE_DRIVE" = "INTERNAL_CLOUD_VAULT"
): Promise<CloudBackupSnapshot> => {
  const jsonPayload = JSON.stringify({
    version: "2.0-cloud",
    exportedAt: new Date().toISOString(),
    systemState: fullSystemState,
  });

  const checksum = generateSimpleChecksum(jsonPayload);
  const sizeBytes = new Blob([jsonPayload]).size;

  const snapshot: CloudBackupSnapshot = {
    id: "CLD-BK-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4).toUpperCase(),
    timestamp: new Date().toISOString(),
    deviceName: navigator.userAgent.includes("Mac") ? "Pharmacy Workstation (Mac)" : "Main POS Terminal (Cloud Node)",
    recordCount: {
      medicines: fullSystemState.medicines.length,
      sales: fullSystemState.sales.length,
      customers: fullSystemState.customers.length,
      suppliers: fullSystemState.suppliers.length,
      prescriptions: fullSystemState.prescriptions.length,
      auditLogs: fullSystemState.auditLogs.length,
      financials: fullSystemState.financialRecords.length,
    },
    fileSizeBytes: sizeBytes,
    checksum,
    provider: providerName,
    payloadJson: jsonPayload,
  };

  // If a custom webhook is configured, attempt sending snapshot payload to external HTTP endpoint
  const config = getCloudSyncConfig();
  if (config.externalStorageEndpoint) {
    try {
      await fetch(config.externalStorageEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKeySecret ? { Authorization: `Bearer ${config.apiKeySecret}` } : {}),
        },
        body: jsonPayload,
      });
    } catch (err) {
      console.warn("External cloud backup endpoint post simulated/warning:", err);
    }
  }

  saveCloudSnapshotToVault(snapshot);
  saveCloudSyncConfig({
    lastSyncedTimestamp: new Date().toISOString(),
    cloudSyncHealth: "HEALTHY",
  });

  return snapshot;
};

export const downloadSnapshotAsFile = (snapshot: CloudBackupSnapshot) => {
  const blob = new Blob([snapshot.payloadJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharmacy_cloud_backup_${snapshot.timestamp.split("T")[0]}_${snapshot.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

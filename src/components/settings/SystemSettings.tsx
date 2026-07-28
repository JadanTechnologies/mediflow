import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { PermissionKey, UserRole, RoleDefinition, SystemUser, Currency } from "../../types/pharmacy";
import { ALL_PERMISSIONS } from "../../data/mockData";
import {
  Settings,
  Building2,
  ShieldCheck,
  Printer,
  Users,
  Coins,
  Lock,
  Plus,
  CheckCircle2,
  XCircle,
  Globe,
  Save,
  KeyRound,
  UserPlus,
  ShieldAlert,
  ArrowRightLeft,
  Database,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  AlertTriangle,
  Clock,
  FileCheck,
  FileText,
  RotateCcw,
} from "lucide-react";

export const SystemSettings: React.FC = () => {
  const {
    branches,
    currentBranch,
    setCurrentBranch,
    currentRole,
    currentUser,
    roles,
    addRole,
    updateRolePermissions,
    systemUsers,
    addSystemUser,
    updateSystemUser,
    assignUserToBranch,
    settings,
    updateSettings,
    formatCurrency,
    addAuditLog,
    isLoading,
    medicines,
    categories,
    suppliers,
    customers,
    prescriptions,
    sales,
    purchases,
    transfers,
    financials,
    auditLogs,
    restoreSystemState,
    resetToDefaultSeedData,
    setActiveTab: setGlobalActiveTab,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<"GENERAL" | "BRANDING" | "CURRENCY" | "RBAC" | "STAFF" | "BRANCHES" | "BACKUP">("GENERAL");

  // Form states
  const [generalForm, setGeneralForm] = useState({
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyPhone: settings.companyPhone,
    companyEmail: settings.companyEmail,
    companyTaxId: settings.companyTaxId,
    defaultTaxRatePercent: settings.defaultTaxRatePercent,
    expiryAlertThresholdDays: settings.expiryAlertThresholdDays,
    thermalPrinterWidthMm: settings.thermalPrinterWidthMm,
    securityLockTimeoutMinutes: settings.securityLockTimeoutMinutes ?? 5,
  });

  const [brandingForm, setBrandingForm] = useState({
    logoUrl: settings.logoUrl || "",
    receiptHeaderMessage: settings.receiptHeaderMessage || "",
    receiptFooterMessage: settings.receiptFooterMessage || "",
    reportHeaderNote: settings.reportHeaderNote || "",
    reportFooterNote: settings.reportFooterNote || "",
  });

  // Role Modal state
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<PermissionKey[]>(["pos_sales"]);

  // Staff Modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRoleId, setNewStaffRoleId] = useState(roles[0]?.id || "");
  const [newStaffBranchId, setNewStaffBranchId] = useState(branches[0]?.id || "");
  const [newStaffPin, setNewStaffPin] = useState("1234");

  // Backup & Recovery state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const isSuperAdmin = currentRole === "Super Admin";

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(generalForm);
    alert("System general parameters updated successfully.");
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(brandingForm);
    addAuditLog("Branding Updated", "Updated pharmacy logo and print receipt/report custom headers & footers.");
    alert("Pharmacy Logo and Print Receipt/Report branding updated successfully!");
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB. Please upload an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBrandingForm((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Download complete JSON Backup
  const handleDownloadJsonBackup = () => {
    const backupData = {
      version: "2.5.0-ENTERPRISE",
      timestamp: new Date().toISOString(),
      formattedDate: new Date().toLocaleString(),
      exportedBy: currentUser ? `${currentUser.name} (${currentUser.roleName})` : "Super Admin",
      branch: currentBranch?.name || "Main Branch",
      currency: `${settings.currencyCode} (${settings.currencySymbol})`,
      data: {
        medicines,
        categories,
        suppliers,
        customers,
        prescriptions,
        sales,
        purchases,
        transfers,
        financials,
        auditLogs,
        settings,
        roles,
        systemUsers,
        branches,
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mediflow-db-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog("Database Backup Created", "Super Admin generated complete JSON database dump.");
  };

  // Convert objects array to CSV string
  const convertToCSV = (arr: any[]) => {
    if (!arr || arr.length === 0) return "";
    const keys = Object.keys(arr[0]).filter((k) => typeof arr[0][k] !== "object" || arr[0][k] === null);
    const header = keys.join(",");
    const rows = arr.map((item) =>
      keys
        .map((k) => {
          let val = item[k];
          if (val === null || val === undefined) return '""';
          if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
          return val;
        })
        .join(",")
    );
    return [header, ...rows].join("\n");
  };

  // Export specific table to CSV
  const handleDownloadCsvTable = (tableName: string, dataArray: any[]) => {
    const csvContent = convertToCSV(dataArray);
    if (!csvContent) {
      alert(`No records found to export for ${tableName}.`);
      return;
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mediflow-${tableName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addAuditLog("CSV Table Exported", `Exported table '${tableName}' (${dataArray.length} records) to CSV.`);
  };

  // Handle JSON file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setPreviewData(parsed);
        setRestoreStatus({
          type: "info",
          message: `Backup file '${file.name}' successfully parsed and validated. Review the content summary below before restoring.`,
        });
      } catch (err) {
        setPreviewData(null);
        setRestoreStatus({
          type: "error",
          message: "Invalid JSON backup file structure. Unable to parse.",
        });
      }
    };
    reader.readAsText(file);
  };

  // Execute restore from JSON preview
  const handleExecuteRestore = () => {
    if (!previewData) return;
    if (!window.confirm("CRITICAL CONFIRMATION: Restoring from backup will overwrite current system database state. Proceed?")) {
      return;
    }

    const success = restoreSystemState(previewData);
    if (success) {
      setRestoreStatus({
        type: "success",
        message: "Database state successfully restored from JSON backup file!",
      });
      setSelectedFile(null);
      setPreviewData(null);
    } else {
      setRestoreStatus({
        type: "error",
        message: "Failed to restore database. Invalid schema formatting.",
      });
    }
  };

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    addRole({
      name: newRoleName,
      description: newRoleDesc || "Custom operational role",
      permissions: newRolePerms,
    });
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRolePerms(["pos_sales"]);
    setShowAddRoleModal(false);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    addSystemUser({
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      roleId: newStaffRoleId,
      branchId: newStaffBranchId,
      pin: newStaffPin || "1234",
    });
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setShowAddStaffModal(false);
  };

  const togglePermissionForRole = (role: RoleDefinition, permKey: PermissionKey) => {
    if (!isSuperAdmin) return;
    const exists = role.permissions.includes(permKey);
    const updatedPerms = exists
      ? role.permissions.filter((p) => p !== permKey)
      : [...role.permissions, permKey];
    updateRolePermissions(role.id, updatedPerms);
  };

  if (currentRole !== "Super Admin") {
    return (
      <div className="p-6 lg:p-12 max-w-4xl mx-auto my-12 text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            <span>Super Admin Access Only</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            System Full Settings Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Full ERP system parameters, multi-branch configurations, RBAC permissions, staff assignments, and database backup & recovery tools are restricted exclusively to <strong className="text-slate-700 dark:text-slate-200 font-bold">Super Admin</strong> users.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 max-w-md mx-auto text-left text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Your Active Session Role:</span>
            <span className="font-extrabold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              {currentRole}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>Access Level:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              Denied (Full Settings require Super Admin)
            </span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setGlobalActiveTab("dashboard")}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => setGlobalActiveTab("pos")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            Open POS Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Settings className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span>System Full Settings & RBAC Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure enterprise parameters, multi-currency defaults (Nigerian Naira), custom RBAC permissions, and staff branch assignments.
          </p>
        </div>

        {/* Current Active Currency pill */}
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 shrink-0">
          <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Currency</p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              {settings.currencyCode} ({settings.currencySymbol}) • {settings.currencies?.find((c) => c.code === settings.currencyCode)?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "GENERAL", label: "General & Operational Defaults", icon: Settings },
          { id: "BRANDING", label: "Logo & Print Receipts / Reports", icon: Printer },
          { id: "CURRENCY", label: "Multi-Currency Settings (NGN Default)", icon: Coins },
          { id: "RBAC", label: "Super Admin Role Permissions (RBAC)", icon: ShieldCheck },
          { id: "STAFF", label: "Staff & Branch Re-Assignment", icon: Users },
          { id: "BRANCHES", label: "Multi-Branch Network", icon: Building2 },
          { id: "BACKUP", label: "Database Backup & Recovery", icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL & PRINTER SETTINGS */}
      {activeTab === "GENERAL" && (
        <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Pharmacy Corporate Information</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Company / Chain Name</label>
                <input
                  type="text"
                  value={generalForm.companyName}
                  onChange={(e) => setGeneralForm({ ...generalForm, companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Headquarters Address</label>
                <input
                  type="text"
                  value={generalForm.companyAddress}
                  onChange={(e) => setGeneralForm({ ...generalForm, companyAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={generalForm.companyPhone}
                    onChange={(e) => setGeneralForm({ ...generalForm, companyPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tax TIN / Registration</label>
                  <input
                    type="text"
                    value={generalForm.companyTaxId}
                    onChange={(e) => setGeneralForm({ ...generalForm, companyTaxId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Official Email Address</label>
                <input
                  type="email"
                  value={generalForm.companyEmail}
                  onChange={(e) => setGeneralForm({ ...generalForm, companyEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer className="h-4 w-4 text-blue-600" />
              <span>Printer & Inventory Threshold Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={generalForm.defaultTaxRatePercent}
                  onChange={(e) => setGeneralForm({ ...generalForm, defaultTaxRatePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Expiry Alert Threshold (Days)</label>
                <input
                  type="number"
                  value={generalForm.expiryAlertThresholdDays}
                  onChange={(e) => setGeneralForm({ ...generalForm, expiryAlertThresholdDays: parseInt(e.target.value) || 30 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Thermal Receipt Width</label>
                <select
                  value={generalForm.thermalPrinterWidthMm}
                  onChange={(e) => setGeneralForm({ ...generalForm, thermalPrinterWidthMm: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value={80}>80mm Standard Thermal Roll (ESC/POS)</option>
                  <option value={58}>58mm Compact Thermal Roll</option>
                  <option value={210}>A4 Standard Sheet Invoice</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1 flex items-center justify-between">
                  <span>Auto Lock-Screen Idle Timeout</span>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">Security</span>
                </label>
                <select
                  value={generalForm.securityLockTimeoutMinutes}
                  onChange={(e) => setGeneralForm({ ...generalForm, securityLockTimeoutMinutes: parseInt(e.target.value) || 5 })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-blue-600 dark:text-blue-400"
                >
                  <option value={1}>1 Minute (High Security)</option>
                  <option value={3}>3 Minutes</option>
                  <option value={5}>5 Minutes (Standard Pharmacy Security)</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={0}>Disabled</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save General Configuration</span>
                </button>
              </div>
            </div>

            {/* Developer & Systems Provider Badge in General Settings */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Software Engineering & System Partner
              </span>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-black text-slate-900 dark:text-slate-100">Jadan Tech Solutions Nig Ltd</p>
                  <p className="text-slate-500 font-medium">Contact Tel: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">07061511390</span></p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                  Verified License
                </span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB: BRANDING & PRINTED INVOICES / REPORTS */}
      {activeTab === "BRANDING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Settings Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSaveBranding} className="space-y-6">
              {/* Logo Upload Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Upload className="h-4 w-4" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      Pharmacy Logo Branding
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    Invoices & Reports
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload your official pharmacy logo. It will be automatically sized and embedded on all thermal POS receipts, A4 sales invoices, and exported financial reports.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Current Logo Preview */}
                  <div className="sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center gap-2">
                    {brandingForm.logoUrl ? (
                      <img
                        src={brandingForm.logoUrl}
                        alt="Pharmacy Logo Preview"
                        className="h-20 w-auto max-w-full object-contain rounded-lg shadow-2xs"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-extrabold text-xs">
                        NO LOGO
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">Active Logo</span>
                  </div>

                  {/* Upload Controls */}
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Upload Image File (PNG, JPG, SVG)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Or Custom Logo Image URL / Data Base64
                      </label>
                      <input
                        type="text"
                        value={brandingForm.logoUrl}
                        onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                        placeholder="https://... or data:image/..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      {brandingForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm({ ...brandingForm, logoUrl: "" })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold hover:bg-rose-100 transition-colors"
                        >
                          Clear Logo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setBrandingForm({
                            ...brandingForm,
                            logoUrl:
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%232563eb'/><path d='M50 20 v60 M20 50 h60' stroke='white' stroke-width='14' stroke-linecap='round'/><circle cx='50' cy='50' r='8' fill='%2360a5fa'/></svg>",
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 transition-colors"
                      >
                        Reset Default SVG Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* POS & Thermal Receipt Text Settings */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Printer className="h-4 w-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    POS Receipt Header & Footer Custom Messages
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Receipt Custom Header Greeting / Slogan
                    </label>
                    <input
                      type="text"
                      value={brandingForm.receiptHeaderMessage}
                      onChange={(e) => setBrandingForm({ ...brandingForm, receiptHeaderMessage: e.target.value })}
                      placeholder="e.g. Welcome to MediFlow Pharmacy • Your Health Is Our Priority"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Appears right below company name/address at top of printed receipts.</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Receipt Custom Footer Message & Return Policy
                    </label>
                    <textarea
                      rows={2}
                      value={brandingForm.receiptFooterMessage}
                      onChange={(e) => setBrandingForm({ ...brandingForm, receiptFooterMessage: e.target.value })}
                      placeholder="e.g. Thank you for choosing MediFlow! Unsealed prescribed drugs are non-refundable."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Appears at the very bottom of thermal & A4 customer receipts.</p>
                  </div>
                </div>
              </div>

              {/* Audit & Export Reports Text Settings */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Audit & Analytical Reports Branding Text
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Report Header Compliance Note / Title Banner
                    </label>
                    <input
                      type="text"
                      value={brandingForm.reportHeaderNote}
                      onChange={(e) => setBrandingForm({ ...brandingForm, reportHeaderNote: e.target.value })}
                      placeholder="e.g. MediFlow Enterprise Operations, Sales Audit & Inventory Statement"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Report Footer Confidentiality & Regulatory Disclaimer
                    </label>
                    <input
                      type="text"
                      value={brandingForm.reportFooterNote}
                      onChange={(e) => setBrandingForm({ ...brandingForm, reportFooterNote: e.target.value })}
                      placeholder="e.g. Confidential Pharmacy Enterprise Audit • Generated under GPP Regulatory Standard"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save All Print Branding Settings</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4 sticky top-20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="h-4 w-4" /> Live Print Preview
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  Receipt Layout
                </span>
              </div>

              {/* Thermal Receipt Paper Card */}
              <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-mono text-[11px] space-y-3 border border-slate-200">
                {/* Header Section */}
                <div className="text-center space-y-1.5 border-b pb-3 border-dashed border-slate-300">
                  {brandingForm.logoUrl && (
                    <img
                      src={brandingForm.logoUrl}
                      alt="Receipt Logo"
                      className="h-10 w-auto max-w-[120px] mx-auto object-contain mb-1"
                    />
                  )}
                  <h4 className="font-black text-sm uppercase tracking-wide">{generalForm.companyName}</h4>
                  <p className="text-[10px] text-slate-600 leading-tight">{generalForm.companyAddress}</p>
                  <p className="text-[10px] text-slate-600">Tel: {generalForm.companyPhone} • Tax ID: {generalForm.companyTaxId}</p>

                  {brandingForm.receiptHeaderMessage && (
                    <div className="pt-1 text-[10px] font-semibold text-blue-700 italic border-t border-slate-100">
                      "{brandingForm.receiptHeaderMessage}"
                    </div>
                  )}
                </div>

                {/* Mock Item Table */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-1">
                    <span>ITEM</span>
                    <span>QTY x PRICE</span>
                    <span>TOTAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paracetamol 500mg</span>
                    <span>2 x ₦1,200</span>
                    <span className="font-bold">₦2,400</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amoxicillin 250mg</span>
                    <span>1 x ₦3,500</span>
                    <span className="font-bold">₦3,500</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-xs">
                    <span>TOTAL PAID (CASH)</span>
                    <span>₦5,900</span>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="text-center space-y-1 border-t border-dashed border-slate-300 pt-3 text-[9px] text-slate-600">
                  {brandingForm.receiptFooterMessage ? (
                    <p className="font-medium text-slate-700 leading-tight">{brandingForm.receiptFooterMessage}</p>
                  ) : (
                    <p>Thank you for choosing {generalForm.companyName}!</p>
                  )}
                  <p className="text-[8px] text-slate-400 pt-1">MediFlow POS Enterprise • Barcode: *INV-891023*</p>
                </div>
              </div>

              {/* Report Footer Preview Note */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[10px] space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Exported Report Footer Disclaimer Preview</span>
                <p className="text-slate-200 italic font-mono">
                  {brandingForm.reportFooterNote || "Confidential Pharmacy Enterprise Audit Statement"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-CURRENCY SETTINGS */}
      {activeTab === "CURRENCY" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-600" />
                  <span>Multi-Currency System Configuration</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select your primary functional currency. All item prices, transactions, and reports dynamically convert based on exchange rates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Active Currency:</label>
                <select
                  value={settings.currencyCode}
                  onChange={(e) => updateSettings({ currencyCode: e.target.value })}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-extrabold text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                >
                  {settings.currencies?.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) - {c.name} {c.code === "NGN" ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency Live Sample Converter */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live Pricing Display Sample (Active Currency: {settings.currencyCode})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Paracetamol 500mg</span>
                  <span className="text-sm font-extrabold text-blue-600">{formatCurrency(1500)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Augmentin 625mg</span>
                  <span className="text-sm font-extrabold text-blue-600">{formatCurrency(18500)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Daily POS Sales</span>
                  <span className="text-sm font-extrabold text-emerald-600">{formatCurrency(489000)}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Supplier Order PO</span>
                  <span className="text-sm font-extrabold text-purple-600">{formatCurrency(1250000)}</span>
                </div>
              </div>
            </div>

            {/* Currencies Exchange Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5">Currency Code</th>
                    <th className="p-3.5">Full Name</th>
                    <th className="p-3.5">Symbol</th>
                    <th className="p-3.5">Rate against NGN (Base)</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {settings.currencies?.map((c) => {
                    const isDefault = c.code === "NGN";
                    const isCurrent = c.code === settings.currencyCode;
                    return (
                      <tr
                        key={c.code}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                          isCurrent ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                        }`}
                      >
                        <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{c.code}</span>
                          {isDefault && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full uppercase">
                              SYSTEM DEFAULT
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{c.name}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 text-sm">{c.symbol}</td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          1 {c.code} = {(c.rateAgainstNGN ?? 1).toLocaleString()} NGN
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => updateSettings({ currencyCode: c.code })}
                            disabled={isCurrent}
                            className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all ${
                              isCurrent
                                ? "bg-emerald-600 text-white cursor-default"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {isCurrent ? "Active Currency" : "Set Active"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & PERMISSION MANAGEMENT (SUPER ADMIN) */}
      {activeTab === "RBAC" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>Super Admin Custom Role Creation & Interactive Permission Matrix</span>
              </h3>
              <p className="text-xs text-slate-500">
                Grant or revoke granular module permissions across custom roles.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Custom Role</span>
              </button>
            )}
          </div>

          {!isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <span>
                You are currently logged in as <strong>{currentRole}</strong>. Role creation and permission modification requires <strong>Super Admin</strong> account elevation.
              </span>
            </div>
          )}

          {/* Permission Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 min-w-[220px]">System Module & Permission</th>
                  {roles.map((r) => (
                    <th key={r.id} className="p-4 text-center min-w-[130px]">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{r.name}</div>
                      <div className="text-[9px] text-slate-400 font-medium font-mono">
                        {r.permissions.length} allowed
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {ALL_PERMISSIONS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{perm.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{perm.description}</div>
                      <span className="inline-block mt-1 text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        {perm.module}
                      </span>
                    </td>
                    {roles.map((role) => {
                      const hasPerm = role.permissions.includes(perm.key);
                      const isSuperRole = role.name === "Super Admin";
                      return (
                        <td key={`${role.id}-${perm.key}`} className="p-4 text-center">
                          <button
                            onClick={() => togglePermissionForRole(role, perm.key)}
                            disabled={!isSuperAdmin || isSuperRole}
                            className={`p-2 rounded-xl border transition-all inline-flex items-center justify-center ${
                              hasPerm
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-700"
                            } ${!isSuperAdmin || isSuperRole ? "cursor-default" : "hover:scale-105 cursor-pointer"}`}
                            title={hasPerm ? "Click to Revoke" : "Click to Grant"}
                          >
                            {hasPerm ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF & BRANCH RE-ASSIGNMENT */}
      {activeTab === "STAFF" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Staff Management & Any Branch Re-Assignment</span>
              </h3>
              <p className="text-xs text-slate-500">
                Super Admin can assign any user or staff member to any pharmacy branch location instantly.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff User</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemUsers.map((user) => {
              return (
                <div
                  key={user.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-slate-800 text-blue-600 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                          {user.name}
                        </h4>
                        <p className="text-xs text-blue-600 font-bold">{user.roleName}</p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase">
                      {user.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <p className="truncate">Email: {user.email}</p>
                    <p>Phone: {user.phone}</p>
                    <p className="font-mono text-[11px] text-slate-400">PIN Code: **** ({user.pin})</p>
                  </div>

                  {/* Branch Assignment Control */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Branch Location
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.branchId}
                        disabled={!isSuperAdmin}
                        onChange={(e) => assignUserToBranch(user.id, e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MULTI-BRANCH NETWORK */}
      {activeTab === "BRANCHES" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200">
            <strong>Active Branch Switcher:</strong> Select a branch below to switch operational view across inventory and POS registers.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => {
              const isCurrent = b.id === currentBranch.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setCurrentBranch(b)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                    isCurrent
                      ? "bg-blue-600/10 border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className={`h-5 w-5 ${isCurrent ? "text-blue-600" : "text-slate-400"}`} />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {b.name}
                      </h4>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">{b.address}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Phone: {b.phone} • Code: {b.code}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: DATABASE BACKUP & RECOVERY */}
      {activeTab === "BACKUP" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full inline-block border border-blue-400/30">
                SUPER ADMIN DISASTER RECOVERY & ARCHIVAL
              </span>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-400" />
                <span>Enterprise Database Backup & Full Restore Engine</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Manually trigger on-demand full JSON system snapshots or individual table CSV spreadsheets. Super Admins can safely restore database state or reset to factory defaults.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadJsonBackup}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Full JSON Database</span>
              </button>
            </div>
          </div>

          {/* Feedback Status Alert */}
          {restoreStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
                restoreStatus.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  : restoreStatus.type === "error"
                  ? "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {restoreStatus.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
                {restoreStatus.type === "error" && <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />}
                {restoreStatus.type === "info" && <Clock className="h-5 w-5 text-blue-600 shrink-0" />}
                <span>{restoreStatus.message}</span>
              </div>
              <button
                onClick={() => setRestoreStatus(null)}
                className="text-xs opacity-70 hover:opacity-100 font-extrabold px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {!isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <span>
                You are currently logged in as <strong>{currentRole}</strong>. Database restoration and full state modifications require <strong>Super Admin</strong> authorization.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: EXPORT CSV TABLES & JSON BACKUPS */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <span>Manual Table CSV Export Tools</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download individual module datasets as CSV spreadsheets compatible with Excel, Sheets, and analytics tools.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Medicines */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Medicines Inventory</h4>
                    <p className="text-[10px] text-slate-400">{medicines.length} items logged</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Medicines", medicines)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Medicines CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Sales */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">POS Sales & Invoices</h4>
                    <p className="text-[10px] text-slate-400">{sales.length} transactions</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Sales Invoices", sales)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Sales CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Customers */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Patients & Customers</h4>
                    <p className="text-[10px] text-slate-400">{customers.length} registered</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Patients", customers)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Patients CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Financial Records */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Financial Ledgers</h4>
                    <p className="text-[10px] text-slate-400">{financials.length} entries</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Financial Records", financials)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Financials CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Prescriptions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Prescriptions List</h4>
                    <p className="text-[10px] text-slate-400">{prescriptions.length} prescriptions</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Prescriptions", prescriptions)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Prescriptions CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Audit Logs */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Audit Trail Logs</h4>
                    <p className="text-[10px] text-slate-400">{auditLogs.length} audit logs</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Audit Logs", auditLogs)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Audit Logs CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Purchase Orders */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Purchase Orders</h4>
                    <p className="text-[10px] text-slate-400">{purchases.length} PO records</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Purchase Orders", purchases)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export POs CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>

                {/* Suppliers */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Pharma Suppliers</h4>
                    <p className="text-[10px] text-slate-400">{suppliers.length} vendors</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCsvTable("Suppliers", suppliers)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0"
                    title="Export Suppliers CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Full JSON Download Highlight */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-blue-600" />
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                    Full System Snapshot (.JSON)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Exporting JSON creates a complete schema containing all 14 data collections, active configuration parameters, users, roles, and branch definitions.
                </p>
                <button
                  onClick={handleDownloadJsonBackup}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xs flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Complete JSON Backup File</span>
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: RESTORE DATABASE FROM JSON FILE */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-purple-600" />
                  <span>Restore Database from File</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select or drop a previously exported <code>.json</code> backup file to parse, review schema summary, and execute full restoration.
                </p>
              </div>

              {/* File Dropzone / Upload Control */}
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <HardDrive className="h-8 w-8" />
                </div>
                <div>
                  <label className="cursor-pointer block">
                    <span className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md inline-block">
                      Browse & Select JSON Backup
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      disabled={!isSuperAdmin}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {selectedFile ? `Selected: ${selectedFile.name}` : "Only valid .json database backup files are supported."}
                  </p>
                </div>
              </div>

              {/* Parsed JSON Preview Breakdown */}
              {previewData && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                        Parsed Backup File Summary
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Version: {previewData.version || "1.0"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <p>Export Date: {previewData.formattedDate || previewData.timestamp || "Unknown"}</p>
                    <p>Exported By: {previewData.exportedBy || "System Admin"}</p>
                    <p>Origin Branch: {previewData.branch || "Central HQ"}</p>
                  </div>

                  {/* Record Breakdown Matrix */}
                  <div className="pt-2">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Dataset Record Counts To Restore
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Medicines</span>
                        <span className="font-extrabold text-blue-600">
                          {previewData.data?.medicines?.length ?? (Array.isArray(previewData.medicines) ? previewData.medicines.length : 0)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Sales</span>
                        <span className="font-extrabold text-emerald-600">
                          {previewData.data?.sales?.length ?? (Array.isArray(previewData.sales) ? previewData.sales.length : 0)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Patients</span>
                        <span className="font-extrabold text-purple-600">
                          {previewData.data?.customers?.length ?? (Array.isArray(previewData.customers) ? previewData.customers.length : 0)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Suppliers</span>
                        <span className="font-extrabold text-amber-600">
                          {previewData.data?.suppliers?.length ?? (Array.isArray(previewData.suppliers) ? previewData.suppliers.length : 0)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Financials</span>
                        <span className="font-extrabold text-indigo-600">
                          {previewData.data?.financials?.length ?? (Array.isArray(previewData.financials) ? previewData.financials.length : 0)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-bold">Users & Roles</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-300">
                          {previewData.data?.systemUsers?.length ?? 0} Users
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewData(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={handleExecuteRestore}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Confirm & Restore Database</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Emergency Factory Seed Data Reset */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 text-amber-600" />
                  <span>Factory Seed Reset (Demo Emergency State)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Resets all active memory collections back to original demo seed datasets (including Nigerian Naira medicines, sales, and patients).
                </p>
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={() => {
                    if (window.confirm("RESET CONFIRMATION: Reset system database back to initial seed state?")) {
                      resetToDefaultSeedData();
                      setRestoreStatus({
                        type: "info",
                        message: "System database successfully reset to factory seed data.",
                      });
                    }
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset to Factory Demo Seed Dataset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Credit Section in Settings */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Official Developer & System Partner
              </span>
              <span className="text-[10px] text-slate-400">v2.5.0 Enterprise</span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
              Developed by Jadan Tech Solutions Nig Ltd
            </h4>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
              <span>Technical Support & System Licensing Line:</span>
              <a
                href="tel:07061511390"
                className="font-mono font-extrabold text-blue-300 hover:text-blue-200 underline decoration-blue-400/50"
              >
                07061511390
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:07061511390"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <span>Contact Developer: 07061511390</span>
          </a>
        </div>
      </div>

      {/* Create Custom Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                <span>Create Custom System Role</span>
              </h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold block mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Clinical Pharmacist"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief summary of duties and restrictions"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1.5">Initial Granted Permissions</label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = newRolePerms.includes(perm.key);
                    return (
                      <label key={perm.key} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRolePerms((prev) => [...prev, perm.key]);
                            } else {
                              setNewRolePerms((prev) => prev.filter((p) => p !== perm.key));
                            }
                          }}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-extrabold shadow-md shadow-purple-600/30"
                >
                  Create Custom Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>Add New Staff Account</span>
              </h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ngozi Okonjo"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@mediflow.ng"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+234 800 000 0000"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Assigned Role</label>
                  <select
                    value={newStaffRoleId}
                    onChange={(e) => setNewStaffRoleId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Assigned Branch</label>
                  <select
                    value={newStaffBranchId}
                    onChange={(e) => setNewStaffBranchId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Security PIN (4-Digits)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/30"
                >
                  Register Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

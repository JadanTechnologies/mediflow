import React, { useState, useMemo } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { StockAdjustment, StockAdjustmentType } from "../../types/pharmacy";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import {
  ClipboardList,
  X,
  Search,
  Filter,
  Download,
  Plus,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Building2,
  Calendar,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Package,
} from "lucide-react";
import { StockAdjustmentModal } from "./StockAdjustmentModal";

interface StockAdjustmentLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilteredMedicineId?: string;
}

const TYPE_CONFIG: Record<
  StockAdjustmentType,
  { label: string; badgeClass: string; icon: string }
> = {
  PHYSICAL_COUNT_CORRECTION: {
    label: "Physical Count",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: "📋",
  },
  EXPIRED_DISCARD: {
    label: "Expired Discard",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: "⏳",
  },
  DAMAGED_TRANSIT: {
    label: "Damaged Stock",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    icon: "💔",
  },
  WASTAGE_SPILLAGE: {
    label: "Lab Wastage",
    badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    icon: "🧪",
  },
  THEFT_DISCREPANCY: {
    label: "Unaccounted Loss",
    badgeClass: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800",
    icon: "🔍",
  },
  RETURN_TO_SUPPLIER: {
    label: "Supplier Return",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: "🚚",
  },
  MANUAL_ADDITION: {
    label: "Manual Addition",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: "➕",
  },
  OTHER: {
    label: "Custom Adjustment",
    badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    icon: "📝",
  },
};

export const StockAdjustmentLogModal: React.FC<StockAdjustmentLogModalProps> = ({
  isOpen,
  onClose,
  prefilteredMedicineId,
}) => {
  const { stockAdjustments, medicines, currentBranch, formatCurrency } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedMedicineFilter, setSelectedMedicineFilter] = useState<string>(prefilteredMedicineId || "ALL");
  const [showNewAdjustModal, setShowNewAdjustModal] = useState(false);
  const [activeSlipRecord, setActiveSlipRecord] = useState<StockAdjustment | null>(null);

  if (!isOpen) return null;

  // Filtered adjustments
  const filteredAdjustments = stockAdjustments.filter((record) => {
    // Medicine Filter
    if (selectedMedicineFilter !== "ALL" && record.medicineId !== selectedMedicineFilter) {
      return false;
    }

    // Type Filter
    if (selectedType !== "ALL" && record.adjustmentType !== selectedType) {
      return false;
    }

    // Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchMed = record.medicineName.toLowerCase().includes(q);
      const matchBatch = record.batchNumber?.toLowerCase().includes(q);
      const matchReason = record.reason.toLowerCase().includes(q);
      const matchUser = record.performedBy.toLowerCase().includes(q);
      const matchRef = record.referenceNumber?.toLowerCase().includes(q);
      return matchMed || matchBatch || matchReason || matchUser || matchRef;
    }

    return true;
  });

  // Calculate Metrics
  const totalAdjustmentsCount = stockAdjustments.length;
  const totalDeductions = stockAdjustments.filter((a) => a.adjustedQuantity < 0).length;
  const totalAdditions = stockAdjustments.filter((a) => a.adjustedQuantity > 0).length;
  const totalWastageExpired = stockAdjustments.filter(
    (a) => a.adjustmentType === "EXPIRED_DISCARD" || a.adjustmentType === "DAMAGED_TRANSIT" || a.adjustmentType === "WASTAGE_SPILLAGE"
  ).length;

  const handleExportCsv = () => {
    if (filteredAdjustments.length === 0) return;

    const headers = [
      "Adjustment Ref #",
      "Timestamp",
      "Medicine Name",
      "Generic Name",
      "Category",
      "Batch Number",
      "Adjustment Type",
      "Previous Stock",
      "Adjusted Qty",
      "New Stock",
      "Unit",
      "Reason Provided",
      "Performed By",
      "User Role",
      "Branch",
      "Notes",
    ];

    const rows = filteredAdjustments.map((r) => [
      `"${r.referenceNumber || r.id}"`,
      `"${r.timestamp}"`,
      `"${r.medicineName}"`,
      `"${r.genericName || ""}"`,
      `"${r.category || ""}"`,
      `"${r.batchNumber || "All"}"`,
      `"${r.adjustmentType}"`,
      r.previousStock,
      r.adjustedQuantity,
      r.newStock,
      `"${r.unit || ""}"`,
      `"${r.reason.replace(/"/g, '""')}"`,
      `"${r.performedBy}"`,
      `"${r.userRole}"`,
      `"${r.branchName || ""}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Medicine_Stock_Adjustment_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh] printable-modal-content">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black tracking-tight">Medicine Stock Adjustment Audit Log</h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {filteredAdjustments.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Detailed audit trail recording all manual stock overrides, physical counts, wastage, and authorized reasons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModalHeaderPrintButton variant="floating" size="sm" />
            <button
              onClick={() => setShowNewAdjustModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Record New Adjustment</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Audit Logged</span>
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalAdjustmentsCount}</p>
              <span className="text-[10px] font-bold text-slate-400">All recorded stock events</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider">Stock Deductions</span>
                <TrendingDown className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{totalDeductions}</p>
              <span className="text-[10px] font-bold text-rose-500/80">Wastage, expired, damage & audit reduction</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/60">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider">Stock Additions</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{totalAdditions}</p>
              <span className="text-[10px] font-bold text-emerald-500/80">Stocktake surplus & manual returns</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wider">Expired / Damaged</span>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{totalWastageExpired}</p>
              <span className="text-[10px] font-bold text-amber-500/80">Biohazard & transit loss events</span>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by medicine, batch #, reason, staff user, or ref #..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMedicineFilter}
                onChange={(e) => setSelectedMedicineFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold"
              >
                <option value="ALL">All Medicines</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold"
              >
                <option value="ALL">All Adjustment Types</option>
                <option value="PHYSICAL_COUNT_CORRECTION">Physical Count Correction</option>
                <option value="EXPIRED_DISCARD">Expired Drug Removal</option>
                <option value="DAMAGED_TRANSIT">Damaged Stock</option>
                <option value="WASTAGE_SPILLAGE">Lab Wastage & Spillage</option>
                <option value="THEFT_DISCREPANCY">Unaccounted Discrepancy</option>
                <option value="RETURN_TO_SUPPLIER">Supplier Return</option>
                <option value="MANUAL_ADDITION">Manual Addition</option>
                <option value="OTHER">Other Custom</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                title="Export audit log to Excel CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3">Timestamp / Ref #</th>
                    <th className="px-4 py-3">Medicine & Batch</th>
                    <th className="px-4 py-3">Type Classification</th>
                    <th className="px-4 py-3 text-center">Stock Shift</th>
                    <th className="px-4 py-3">Reason Provided</th>
                    <th className="px-4 py-3">Performed By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-slate-600 dark:text-slate-300">No stock adjustments match your filter.</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting search parameters or record a new adjustment.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((log) => {
                      const cfg = TYPE_CONFIG[log.adjustmentType] || TYPE_CONFIG.OTHER;
                      const isDeduct = log.adjustedQuantity < 0;

                      return (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{log.timestamp}</span>
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-extrabold">
                              {log.referenceNumber || log.id}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-black text-slate-900 dark:text-slate-100 block">{log.medicineName}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                {log.genericName}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                Batch #{log.batchNumber || "All"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${cfg.badgeClass}`}
                            >
                              <span>{cfg.icon}</span>
                              <span>{cfg.label}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                              <span className="font-bold text-slate-500">{log.previousStock}</span>
                              <span className="text-[10px] font-extrabold text-slate-400">➔</span>
                              <span
                                className={`font-black text-xs px-1.5 py-0.5 rounded ${
                                  isDeduct
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}
                              >
                                {isDeduct ? log.adjustedQuantity : `+${log.adjustedQuantity}`}
                              </span>
                              <span className="text-[10px] font-extrabold text-slate-400">=</span>
                              <span className="font-black text-slate-900 dark:text-slate-100">{log.newStock}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 max-w-xs">
                            <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{log.reason}</p>
                            {log.notes && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">
                                Note: {log.notes}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">{log.performedBy}</span>
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                              {log.userRole}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => setActiveSlipRecord(log)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-[11px] transition-all flex items-center gap-1 ml-auto"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* New Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showNewAdjustModal}
        onClose={() => setShowNewAdjustModal(false)}
        selectedMedicine={
          selectedMedicineFilter !== "ALL"
            ? medicines.find((m) => m.id === selectedMedicineFilter) || null
            : null
        }
      />

      {/* Stock Adjustment Slip Details Modal */}
      {activeSlipRecord && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Stock Adjustment Audit Slip
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono">Ref #: {activeSlipRecord.referenceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveSlipRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Medicine</span>
                  <span className="font-black text-slate-900 dark:text-slate-100">{activeSlipRecord.medicineName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Batch Lot</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {activeSlipRecord.batchNumber || "All Batches"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Adjustment Type</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{activeSlipRecord.adjustmentType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Timestamp</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{activeSlipRecord.timestamp}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Stock Variance Shift</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-extrabold text-slate-300">{activeSlipRecord.previousStock}</span>
                    <span className="text-xs font-bold text-slate-500">➔</span>
                    <span
                      className={`text-base font-black px-2 py-0.5 rounded ${
                        activeSlipRecord.adjustedQuantity < 0 ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {activeSlipRecord.adjustedQuantity < 0
                        ? activeSlipRecord.adjustedQuantity
                        : `+${activeSlipRecord.adjustedQuantity}`}
                    </span>
                    <span className="text-xs font-bold text-slate-500">=</span>
                    <span className="text-lg font-black text-emerald-400">{activeSlipRecord.newStock} {activeSlipRecord.unit}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">
                  Mandatory Reason Provided
                </span>
                <p className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
                  {activeSlipRecord.reason}
                </p>
              </div>

              {activeSlipRecord.notes && (
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block mb-1">Internal Notes</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 italic">
                    {activeSlipRecord.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block">Authorized Auditor:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    {activeSlipRecord.performedBy} ({activeSlipRecord.userRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Pharmacy Branch:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    {activeSlipRecord.branchName || currentBranch.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Audit Slip</span>
              </button>
              <button
                onClick={() => setActiveSlipRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

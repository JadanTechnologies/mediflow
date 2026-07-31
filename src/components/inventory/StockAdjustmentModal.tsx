import React, { useState, useEffect } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine, StockAdjustmentType } from "../../types/pharmacy";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import {
  SlidersHorizontal,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  FileText,
  UserCheck,
  Building2,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMedicine?: Medicine | null;
  onSuccess?: () => void;
}

const ADJUSTMENT_TYPES: {
  type: StockAdjustmentType;
  label: string;
  description: string;
  defaultDirection: "ADD" | "DEDUCT";
  colorClass: string;
  badgeBg: string;
}[] = [
  {
    type: "PHYSICAL_COUNT_CORRECTION",
    label: "Physical Inventory Count Correction",
    description: "Adjust stock following periodic physical stocktake audit",
    defaultDirection: "DEDUCT",
    colorClass: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-50 dark:bg-blue-950/40",
    badgeBg: "bg-blue-600",
  },
  {
    type: "EXPIRED_DISCARD",
    label: "Expired Drug Removal & Disposal",
    description: "Remove expired lot batches for official biohazard disposal",
    defaultDirection: "DEDUCT",
    colorClass: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-950/40",
    badgeBg: "bg-amber-600",
  },
  {
    type: "DAMAGED_TRANSIT",
    label: "Damaged Packaging / Broken Container",
    description: "Stock rendered unusable due to packaging breach or drops",
    defaultDirection: "DEDUCT",
    colorClass: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-950/40",
    badgeBg: "bg-rose-600",
  },
  {
    type: "WASTAGE_SPILLAGE",
    label: "Lab Spillage / Dispensing Wastage",
    description: "Accidental spillage during compounding or liquid transfer",
    defaultDirection: "DEDUCT",
    colorClass: "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-50 dark:bg-orange-950/40",
    badgeBg: "bg-orange-600",
  },
  {
    type: "THEFT_DISCREPANCY",
    label: "Unaccounted Loss / Discrepancy",
    description: "Unexplained variance between system ledger and shelf stock",
    defaultDirection: "DEDUCT",
    colorClass: "text-red-700 dark:text-red-400 border-red-500/30 bg-red-50 dark:bg-red-950/40",
    badgeBg: "bg-red-700",
  },
  {
    type: "RETURN_TO_SUPPLIER",
    label: "Supplier Return / Defective Batch",
    description: "Goods returned to vendor due to recall or short-expiry delivery",
    defaultDirection: "DEDUCT",
    colorClass: "text-purple-600 dark:text-purple-400 border-purple-500/30 bg-purple-50 dark:bg-purple-950/40",
    badgeBg: "bg-purple-600",
  },
  {
    type: "MANUAL_ADDITION",
    label: "Manual Addition / Unrecorded Goods",
    description: "Add unrecorded stock, promotional rep samples, or client returns",
    defaultDirection: "ADD",
    colorClass: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40",
    badgeBg: "bg-emerald-600",
  },
  {
    type: "OTHER",
    label: "Other Custom Adjustment",
    description: "General manual override with mandatory written explanation",
    defaultDirection: "DEDUCT",
    colorClass: "text-slate-600 dark:text-slate-400 border-slate-500/30 bg-slate-50 dark:bg-slate-900/40",
    badgeBg: "bg-slate-600",
  },
];

const PRESET_REASONS: Record<StockAdjustmentType, string[]> = {
  PHYSICAL_COUNT_CORRECTION: [
    "Quarterly stocktake audit count correction",
    "Found misplaced unit tray during shelf re-organization",
    "Correction after barcode scan discrepancy",
    "Annual regulatory inventory verification audit",
  ],
  EXPIRED_DISCARD: [
    "Batch reached expiry date; discarded per biohazard protocol",
    "Cold chain failure rendered vaccine/biologic expired",
    "Quarantined expired stock sealed for incineration",
  ],
  DAMAGED_TRANSIT: [
    "Outer blister pack damaged during shelf handling",
    "Glass ampoule broken during stock movement",
    "Liquid bottle seal broken during delivery unpacking",
  ],
  WASTAGE_SPILLAGE: [
    "Liquid syrup spilled during pediatric compounding",
    "Reconstitution wastage during customer preparation",
    "Ointment tube burst during dispensing",
  ],
  THEFT_DISCREPANCY: [
    "Unexplained inventory shortage during shift count audit",
    "Shrinkage logged during security audit check",
    "Discrepancy between POS register and physical shelf",
  ],
  RETURN_TO_SUPPLIER: [
    "Defective factory packaging returned under RMA ticket",
    "Supplier recall notification response batch return",
    "Delivered with short expiry date (<3 months shelf life)",
  ],
  MANUAL_ADDITION: [
    "Unrecorded promotional bonus samples added to shelf",
    "Stock return accepted from customer unopened",
    "Found uncounted backup stock in storage room B",
  ],
  OTHER: [
    "Special clinical trail sample allocation",
    "Internal pharmacy emergency transfer adjustment",
    "Custom manual adjustment per manager authorization",
  ],
};

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  selectedMedicine: initialMed,
  onSuccess,
}) => {
  const { medicines, adjustStock, currentBranch, currentUser, currentRole } = usePharmacy();

  const [medicineId, setMedicineId] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>("PHYSICAL_COUNT_CORRECTION");
  const [direction, setDirection] = useState<"ADD" | "DEDUCT">("DEDUCT");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [reason, setReason] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state when modal opens or initialMed changes
  useEffect(() => {
    if (isOpen) {
      const activeMed = initialMed || medicines[0];
      if (activeMed) {
        setMedicineId(activeMed.id);
        if (activeMed.batches && activeMed.batches.length > 0) {
          setSelectedBatch(activeMed.batches[0].batchNumber);
        } else {
          setSelectedBatch("ALL");
        }
      }
      setAdjustmentType("PHYSICAL_COUNT_CORRECTION");
      setDirection("DEDUCT");
      setQuantity(1);
      setReason(PRESET_REASONS.PHYSICAL_COUNT_CORRECTION[0]);
      setReferenceNumber(`ADJ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setNotes("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMed, medicines]);

  if (!isOpen) return null;

  const currentMedicine = medicines.find((m) => m.id === medicineId) || initialMed || medicines[0];

  // Calculate batch or base stock
  const getSelectedStock = (): number => {
    if (!currentMedicine) return 0;
    if (selectedBatch === "ALL" || !currentMedicine.batches || currentMedicine.batches.length === 0) {
      return currentMedicine.stock;
    }
    const matchedBatch = currentMedicine.batches.find(
      (b) => b.batchNumber.toLowerCase() === selectedBatch.toLowerCase()
    );
    return matchedBatch ? matchedBatch.quantity : currentMedicine.stock;
  };

  const currentStock = getSelectedStock();
  const numericQty = typeof quantity === "number" ? Math.abs(quantity) : 0;
  const delta = direction === "DEDUCT" ? -numericQty : numericQty;
  const calculatedNewStock = Math.max(0, currentStock + delta);

  const handleTypeChange = (newType: StockAdjustmentType) => {
    setAdjustmentType(newType);
    const config = ADJUSTMENT_TYPES.find((t) => t.type === newType);
    if (config) {
      setDirection(config.defaultDirection);
    }
    const presets = PRESET_REASONS[newType];
    if (presets && presets.length > 0) {
      setReason(presets[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentMedicine) {
      setErrorMessage("Please select a medicine.");
      return;
    }

    if (!numericQty || numericQty <= 0) {
      setErrorMessage("Please enter a valid non-zero adjustment quantity.");
      return;
    }

    if (direction === "DEDUCT" && numericQty > currentStock) {
      setErrorMessage(
        `Deduction of ${numericQty} exceeds current available stock (${currentStock} ${currentMedicine.dosageForm || "units"}). System prevents negative physical stock unless authorized.`
      );
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage("Please provide a specific reason for this stock adjustment (at least 5 characters).");
      return;
    }

    try {
      const adjustmentRecord = adjustStock({
        medicineId: currentMedicine.id,
        medicineName: currentMedicine.name,
        genericName: currentMedicine.genericName,
        category: currentMedicine.category,
        batchNumber: selectedBatch === "ALL" ? "All Batches" : selectedBatch,
        adjustmentType: adjustmentType,
        adjustedQuantity: delta,
        unit: currentMedicine.dosageForm || "Unit",
        reason: reason.trim(),
        performedBy: currentUser ? currentUser.name : `${currentRole} User`,
        userRole: currentRole,
        branchId: currentBranch.id,
        branchName: currentBranch.name,
        referenceNumber: referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`,
        notes: notes.trim(),
        customPreviousStock: currentStock,
      });

      setSuccessMessage(
        `Stock adjustment recorded successfully! Reference #${adjustmentRecord.referenceNumber}. Stock updated from ${currentStock} to ${calculatedNewStock} ${currentMedicine.dosageForm || "units"}.`
      );

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      setErrorMessage("An error occurred while saving the stock adjustment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 printable-modal-content">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Manual Stock Adjustment</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wide">
                  Audit Logged
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Record manual inventory adjustments, stocktake corrections, or wastage with mandatory audit reasons
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModalHeaderPrintButton variant="floating" size="sm" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Adjustment Blocked</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Medicine & Batch Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-blue-600" />
                <span>Target Medicine</span>
              </label>
              <select
                value={medicineId}
                onChange={(e) => {
                  setMedicineId(e.target.value);
                  const newM = medicines.find((m) => m.id === e.target.value);
                  if (newM && newM.batches && newM.batches.length > 0) {
                    setSelectedBatch(newM.batches[0].batchNumber);
                  } else {
                    setSelectedBatch("ALL");
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-blue-500"
              >
                {medicines.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name} ({med.genericName}) - Stock: {med.stock} {med.dosageForm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>Select Batch Lot</span>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Batches (Global Base Stock)</option>
                {currentMedicine?.batches?.map((b) => (
                  <option key={b.batchNumber} value={b.batchNumber}>
                    Batch #{b.batchNumber} (Qty: {b.quantity}, Exp: {b.expiryDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Adjustment Reason Category */}
          <div>
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              <span>Adjustment Type & Classification</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ADJUSTMENT_TYPES.map((t) => {
                const isSelected = adjustmentType === t.type;
                return (
                  <button
                    type="button"
                    key={t.type}
                    onClick={() => handleTypeChange(t.type)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? `${t.colorClass} shadow-xs ring-2 ring-blue-500/50`
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs">{t.label}</span>
                      <span
                        className={`text-[9px] font-black uppercase text-white px-2 py-0.5 rounded-full ${t.badgeBg}`}
                      >
                        {t.defaultDirection === "DEDUCT" ? "- Deduct" : "+ Add"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction Toggle & Quantity Input */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1">
                  Adjustment Operation
                </label>
                <div className="flex rounded-xl bg-slate-200 dark:bg-slate-700 p-1">
                  <button
                    type="button"
                    onClick={() => setDirection("DEDUCT")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      direction === "DEDUCT"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span>Deduct (-)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("ADD")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
                      direction === "ADD"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Add (+)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1">
                  Adjustment Quantity ({currentMedicine?.dosageForm || "Units"})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-black text-sm text-center focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Calculated Stock Impact Card */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
                  Calculated Stock Impact
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-500">{currentStock}</span>
                  <span className="text-xs font-extrabold text-slate-400">➔</span>
                  <span
                    className={`text-xs font-black px-1.5 py-0.5 rounded ${
                      direction === "DEDUCT" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {direction === "DEDUCT" ? `-${numericQty}` : `+${numericQty}`}
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">=</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    {calculatedNewStock}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Provided (With Preset Quick Buttons) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Reason Provided for Adjustment (Required)</span>
              </label>
              <span className="text-[10px] font-bold text-slate-400">Min 5 characters</span>
            </div>

            {/* Quick Preset Reason Buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_REASONS[adjustmentType]?.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setReason(preset)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    reason === preset
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide explicit audit justification (e.g. Quarterly stocktake discrepancy, damaged vial, or sample addition)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User Verification & Audit Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Logged By (Staff Auditor)
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {currentUser ? currentUser.name : `${currentRole} User`}{" "}
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
                    ({currentRole})
                  </span>
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Active Operational Branch
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{currentBranch.name}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Audit Slip Ref # (Optional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="ADJ-2026-XXXX"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Additional Internal Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Shelf location tray B-4, pending disposal invoice"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Confirm & Log Stock Adjustment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

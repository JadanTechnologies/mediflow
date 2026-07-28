import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine, Supplier } from "../../types/pharmacy";
import {
  X,
  PackagePlus,
  RefreshCw,
  Truck,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Receipt,
  Sparkles,
} from "lucide-react";

interface RestockReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMedicine?: Medicine | null;
  mode?: "RESTOCK" | "REORDER";
}

export const RestockReorderModal: React.FC<RestockReorderModalProps> = ({
  isOpen,
  onClose,
  selectedMedicine = null,
  mode = "RESTOCK",
}) => {
  const { medicines, suppliers, restockMedicine, addPurchaseOrder, formatCurrency, currentBranch, currentUser } = usePharmacy();

  const [activeTab, setActiveTab] = useState<"RESTOCK" | "REORDER">(mode);
  const [medicineId, setMedicineId] = useState<string>("");
  
  // Restock Form Fields
  const [quantityAdded, setQuantityAdded] = useState<number>(50);
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [mfgDate, setMfgDate] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [supplierId, setSupplierId] = useState<string>("");
  const [recordAsExpense, setRecordAsExpense] = useState<boolean>(true);
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<string>("Bank Transfer");
  
  // Reorder Purchase Order Form Fields
  const [reorderQty, setReorderQty] = useState<number>(100);
  const [reorderNotes, setReorderNotes] = useState<string>("");
  
  // Success toast state
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  useEffect(() => {
    if (selectedMedicine) {
      setMedicineId(selectedMedicine.id);
      setPurchasePrice(selectedMedicine.purchasePrice || 0);
      setSellingPrice(selectedMedicine.sellingPrice || 0);
      setSupplierId(selectedMedicine.supplierId || (suppliers[0]?.id || "sup-1"));
      
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setBatchNumber(`BCH-${new Date().getFullYear()}-${randomSuffix}`);
      
      // Default expiry date 1 year from now
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 1);
      setExpiryDate(defaultExp.toISOString().split("T")[0]);

      // Default mfg date today
      setMfgDate(new Date().toISOString().split("T")[0]);
    } else if (medicines.length > 0) {
      setMedicineId(medicines[0].id);
      setPurchasePrice(medicines[0].purchasePrice || 0);
      setSellingPrice(medicines[0].sellingPrice || 0);
      setSupplierId(medicines[0].supplierId || (suppliers[0]?.id || "sup-1"));
      setBatchNumber(`BCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 1);
      setExpiryDate(defaultExp.toISOString().split("T")[0]);
      setMfgDate(new Date().toISOString().split("T")[0]);
    }
  }, [selectedMedicine, medicines, suppliers]);

  // Handle changing selected medicine
  const handleMedicineChange = (id: string) => {
    setMedicineId(id);
    const found = medicines.find((m) => m.id === id);
    if (found) {
      setPurchasePrice(found.purchasePrice || 0);
      setSellingPrice(found.sellingPrice || 0);
      setSupplierId(found.supplierId || (suppliers[0]?.id || "sup-1"));
    }
  };

  const currentMedicine = medicines.find((m) => m.id === medicineId);
  const selectedSupplierObj = suppliers.find((s) => s.id === supplierId);

  const totalRestockExpense = purchasePrice * quantityAdded;

  // Submit Restock
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || quantityAdded <= 0 || !batchNumber.trim() || !expiryDate) return;

    restockMedicine(
      medicineId,
      quantityAdded,
      {
        batchNumber: batchNumber.trim(),
        expiryDate: expiryDate,
        mfgDate: mfgDate,
        purchasePrice: purchasePrice,
        sellingPrice: sellingPrice,
        supplierId: supplierId,
        supplierName: selectedSupplierObj?.name,
        location: currentMedicine?.location,
      },
      recordAsExpense,
      expensePaymentMethod
    );

    setSuccessMessage(`Successfully restocked +${quantityAdded} units of ${currentMedicine?.name}! Batch #${batchNumber} logged.`);
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 1200);
  };

  // Submit Reorder PO
  const handleReorderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId || reorderQty <= 0) return;

    const totalCost = purchasePrice * reorderQty;
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    addPurchaseOrder({
      poNumber: poNumber,
      supplierId: supplierId || "sup-1",
      supplierName: selectedSupplierObj?.name || "Global Pharma Supplies",
      branchId: currentBranch?.id || "br-1",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      status: "Pending",
      totalCost: totalCost,
      notes: reorderNotes || `Auto reorder for ${currentMedicine?.name}`,
      items: [
        {
          medicineName: currentMedicine?.name || "Medicine",
          quantity: reorderQty,
          unitCost: purchasePrice,
          totalCost: totalCost,
        },
      ],
    });

    setSuccessMessage(`Purchase Order #${poNumber} created for ${reorderQty} units of ${currentMedicine?.name}. Sent to ${selectedSupplierObj?.name || "Supplier"}.`);
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 1200);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="restock-backdrop"
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
            key="restock-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold shadow-inner">
                  {activeTab === "RESTOCK" ? <PackagePlus className="h-5 w-5" /> : <RefreshCw className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{activeTab === "RESTOCK" ? "Restock Medication Batch" : "Create Supplier Reorder (P.O.)"}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTab === "RESTOCK"
                      ? "Instantly add received stock batch, update pricing, and log expense"
                      : "Issue an official purchase order to supplier for low-stock replenishment"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveTab("RESTOCK")}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "RESTOCK"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <PackagePlus className="h-4 w-4" />
                <span>Instant Stock Restock</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("REORDER")}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "REORDER"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Truck className="h-4 w-4" />
                <span>Supplier Purchase Order (Reorder)</span>
              </button>
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Selected Product Card Summary */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-slate-800/50 border border-blue-200/60 dark:border-slate-700/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Medication / Product
                  </label>
                  <select
                    value={medicineId}
                    onChange={(e) => handleMedicineChange(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-slate-100"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.strength}) • Current Stock: {m.stock} {m.packagingUnit} {m.stock <= m.minStock ? "⚠️ LOW" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {currentMedicine && (
                  <div className="flex gap-4 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-4 pt-2 sm:pt-0 shrink-0 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Current Stock</span>
                      <span className={`font-mono font-extrabold text-sm ${currentMedicine.stock <= currentMedicine.minStock ? "text-rose-600" : "text-emerald-600"}`}>
                        {currentMedicine.stock} {currentMedicine.packagingUnit}s
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Cost / Selling</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {formatCurrency(currentMedicine.purchasePrice)} / {formatCurrency(currentMedicine.sellingPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RESTOCK FORM */}
            {activeTab === "RESTOCK" && (
              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Quantity Received / Added (+ Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantityAdded}
                      onChange={(e) => setQuantityAdded(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 dark:text-blue-400 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Batch Number / Lot Code
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BCH-2026-8802"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Batch Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Manufacturing Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Unit Purchase Cost Price (₦)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Unit Retail Selling Price (₦)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Supplier / Distributor
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.contactPerson}) • {s.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expense Logging Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recordAsExpense}
                        onChange={(e) => setRecordAsExpense(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Log Total Restock Expense in Financial Ledger
                      </span>
                    </label>

                    <span className="font-mono font-extrabold text-xs text-rose-600 dark:text-rose-400">
                      Total Cost: {formatCurrency(totalRestockExpense)}
                    </span>
                  </div>

                  {recordAsExpense && (
                    <div className="flex items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-500 font-bold shrink-0">Payment Method:</span>
                      <div className="flex gap-2 flex-wrap">
                        {["Bank Transfer", "Cash", "POS Card", "Credit Ledger"].map((pm) => (
                          <button
                            key={pm}
                            type="button"
                            onClick={() => setExpensePaymentMethod(pm)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              expensePaymentMethod === pm
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {pm}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <PackagePlus className="h-4 w-4" />
                    <span>Confirm & Restock Stock</span>
                  </button>
                </div>
              </form>
            )}

            {/* REORDER FORM */}
            {activeTab === "REORDER" && (
              <form onSubmit={handleReorderSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reorder Quantity (Units)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={reorderQty}
                      onChange={(e) => setReorderQty(parseInt(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-blue-600 dark:text-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Target Supplier
                    </label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.contactPerson}) • {s.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Purchase Order Notes / Delivery Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={reorderNotes}
                      onChange={(e) => setReorderNotes(e.target.value)}
                      placeholder="e.g. Urgent stock replenishment for Lagos branch. Require NAFDAC certificate of analysis."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">Estimated Purchase Order Value</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      {reorderQty} units x {formatCurrency(purchasePrice)}
                    </p>
                  </div>
                  <span className="font-mono font-black text-base text-amber-900 dark:text-amber-200">
                    {formatCurrency(purchasePrice * reorderQty)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Issue Purchase Order (P.O.)</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

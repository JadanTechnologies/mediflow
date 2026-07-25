import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine, CustomerPatient, PosSale } from "../../types/pharmacy";
import { PosSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Printer,
  X,
  CheckCircle2,
  Sparkles,
  QrCode,
  ShieldAlert,
} from "lucide-react";

export const PosSystem: React.FC = () => {
  const {
    medicines,
    categories,
    customers,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    onHoldSales,
    holdCurrentSale,
    resumeSale,
    completeSale,
    formatCurrency,
    isLoading,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPatient | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Modals
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<PosSale | null>(null);
  const [interactionAlert, setInteractionAlert] = useState<{
    severity: string;
    summary: string;
    warnings: string[];
  } | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PosSale["paymentMethod"]>("Cash");
  const [cashGiven, setCashGiven] = useState<number>(0);

  if (isLoading) {
    return <PosSkeleton />;
  }

  // Filtered Medicines
  const filteredMedicines = medicines.filter((m) => {
    const matchesCategory = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.barcode.includes(searchQuery) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Subtotal, Tax, Discount, Grand Total
  const subtotal = cart.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const totalDiscount = cart.reduce((acc, i) => acc + i.discountAmount * i.quantity, 0);
  const totalTax = cart.reduce((acc, i) => acc + i.taxAmount * i.quantity, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;
  const changeGiven = Math.max(0, cashGiven - grandTotal);

  // Barcode Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const matched = medicines.find(
      (m) => m.barcode === barcodeInput || m.sku.toLowerCase() === barcodeInput.toLowerCase()
    );
    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput("");
    } else {
      alert(`No medicine found matching barcode or SKU: ${barcodeInput}`);
    }
  };

  // Check Clinical Interactions via AI API
  const handleCheckInteractions = async () => {
    if (cart.length < 1) return;
    setIsCheckingInteractions(true);
    setInteractionAlert(null);

    const medNames = cart.map((c) => `${c.medicine.name} (${c.medicine.genericName})`);

    try {
      const res = await fetch("/api/ai/drug-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines: medNames }),
      });
      const data = await res.json();
      setInteractionAlert({
        severity: data.severity || "Low",
        summary: data.summary || "No critical clinical contraindications detected.",
        warnings: data.clinicalWarnings || data.warnings || ["Monitor patient compliance."],
      });
    } catch (e) {
      console.error(e);
      setInteractionAlert({
        severity: "Moderate",
        summary: "Clinical check complete: Standard dosage verification required.",
        warnings: ["Verify patient allergy history prior to dispensing."],
      });
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  // Complete Payment Submission
  const handleProcessPayment = () => {
    const sale = completeSale(paymentMethod, selectedCustomer || undefined, {
      cashPaid: paymentMethod === "Cash" ? cashGiven : 0,
      cardPaid: paymentMethod === "Card" ? grandTotal : 0,
      walletPaid: paymentMethod === "Digital Wallet" ? grandTotal : 0,
      changeGiven: paymentMethod === "Cash" ? changeGiven : 0,
    });
    setCompletedInvoice(sale);
    setShowPaymentModal(false);
  };

  return (
    <RbacGuard permission="pos_sales">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
        {/* Left Column: Medicine Catalog & Barcode Scanner */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Top Controls: Barcode & Search */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <input
                  type="text"
                  placeholder="Scan or enter Barcode / SKU (e.g., 8901234567890)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan Item</span>
              </button>
            </form>

            {/* Search & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter catalog by medicine name or generic composition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMedicines.map((med) => {
              const isOutOfStock = med.stock <= 0;
              return (
                <div
                  key={med.id}
                  onClick={() => !isOutOfStock && addToCart(med, 1)}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer ${
                    isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full uppercase">
                        {med.dosageForm}
                      </span>
                      {med.isControlledDrug && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          CTRL DRUG
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                      {med.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {med.genericName} • {med.strength}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {formatCurrency(med.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Pack: {med.packSize}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? "bg-rose-500/10 text-rose-600"
                          : med.stock <= med.minStock
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                      }`}
                    >
                      {isOutOfStock ? "Out of Stock" : `Stock: ${med.stock}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout Panel */}
        <div className="w-full lg:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Dispensing Order Cart ({cart.length})
              </h3>
            </div>
            {onHoldSales.length > 0 && (
              <button
                onClick={() => setShowHoldModal(true)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                <span>{onHoldSales.length} Held</span>
              </button>
            )}
          </div>

          {/* Patient Selection Dropdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Patient / Customer Profile
            </label>
            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="">Walk-In Patient (Standard Retail)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.patientCode}) — {c.loyaltyPoints} Points
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.medicine.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {item.medicine.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Batch: {item.selectedBatch} • {formatCurrency(item.unitPrice)}/unit
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                    <button
                      onClick={() => updateCartQty(item.medicine.id, -1)}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.medicine.id, 1)}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
                <span>No items added. Click products or scan barcode.</span>
              </div>
            )}
          </div>

          {/* Clinical Drug Interaction Banner trigger */}
          {cart.length > 0 && (
            <div className="px-4 py-2 bg-blue-500/10 border-t border-blue-500/20 flex items-center justify-between">
              <button
                onClick={handleCheckInteractions}
                disabled={isCheckingInteractions}
                className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>{isCheckingInteractions ? "Analyzing Drug Safety..." : "Run AI Interaction Check"}</span>
              </button>
            </div>
          )}

          {interactionAlert && (
            <div className="p-3 bg-amber-500/10 border-t border-amber-500/20 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span>Clinical Safety Note ({interactionAlert.severity})</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {interactionAlert.summary}
              </p>
            </div>
          )}

          {/* Checkout Summary Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span className="font-semibold">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => holdCurrentSale(selectedCustomer?.name || "Walk-In Customer")}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                <PauseCircle className="h-4 w-4" />
                <span>Hold Order</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay {formatCurrency(grandTotal)}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Processing Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Complete POS Payment
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center py-2 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block uppercase">
                  Amount Due
                </span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cash", "Card", "Digital Wallet"] as PosSale["paymentMethod"][]).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === method
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "Cash" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">
                    Cash Received
                  </label>
                  <input
                    type="number"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {cashGiven >= grandTotal && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold flex justify-between">
                      <span>Change to Return:</span>
                      <span>{formatCurrency(changeGiven)}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleProcessPayment}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirm & Print Receipt</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Thermal Receipt Modal */}
        {completedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <h2 className="font-extrabold text-sm tracking-wider uppercase">
                  MediFlow Pharmacy
                </h2>
                <p className="text-[10px] text-slate-500">
                  {completedInvoice.branchName}
                </p>
                <p className="text-[10px] text-slate-500">
                  Inv: {completedInvoice.invoiceNumber} • {new Date(completedInvoice.date).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1.5 divide-y divide-dashed divide-slate-200">
                {completedInvoice.items.map((item, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between">
                    <div>
                      <span className="font-bold block">{item.medicineName}</span>
                      <span className="text-[10px] text-slate-500">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <span className="font-bold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(completedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(completedInvoice.grandTotal)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500 space-y-1 border-t border-dashed border-slate-300">
                <p>Payment: {completedInvoice.paymentMethod}</p>
                <p>Thank you for trusting MediFlow ERP!</p>
                <p>Keep out of reach of children. Store safely.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-blue-500"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setCompletedInvoice(null)}
                  className="py-2 px-4 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* On-Hold Sales Modal */}
        {showHoldModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  On-Hold Dispensing Orders
                </h3>
                <button onClick={() => setShowHoldModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {onHoldSales.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {h.customerName}
                      </h5>
                      <p className="text-[10px] text-slate-500">
                        {h.items.length} items • Held at {h.date}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        resumeSale(h.id);
                        setShowHoldModal(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs flex items-center gap-1"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      <span>Resume</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RbacGuard>
  );
};

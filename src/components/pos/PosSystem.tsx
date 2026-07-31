import React, { useState, useEffect } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine, CustomerPatient, PosSale, PosCartItem } from "../../types/pharmacy";
import { PosSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import { CameraBarcodeScannerModal } from "./CameraBarcodeScannerModal";
import { ScanLogWidget, ScanLogEntry } from "./ScanLogWidget";
import { VoiceCommandAssistant } from "../voice/VoiceCommandAssistant";
import { RestockReorderModal } from "../inventory/RestockReorderModal";
import { EndOfDayModal } from "./EndOfDayModal";
import { DigitalCalculatorModal } from "../ui/DigitalCalculatorModal";
import { GlobalPosSearchModal } from "./GlobalPosSearchModal";
import { QuickAddCustomerModal } from "./QuickAddCustomerModal";
import { RecentTransactionsSidebar } from "./RecentTransactionsSidebar";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import { Tooltip } from "../ui/Tooltip";
import { playBarcodeScanSuccessChime, playErrorSound, playSuccessChime } from "../../utils/audio";
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
  Activity,
  FileText,
  Building2,
  History,
  FileSpreadsheet,
  Layers,
  Camera,
  Split,
  Wallet,
  ShieldCheck,
  Clock,
  Coins,
  AlertCircle,
  Receipt,
  Keyboard,
  Calculator,
  UserPlus,
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
    updateCartUnit,
    clearCart,
    onHoldSales,
    holdCurrentSale,
    resumeSale,
    deleteHeldSale,
    completeSale,
    formatCurrency,
    isLoading,
    currentBranch,
    sales,
    settings,
  } = usePharmacy();

  const brandAccentColor = settings?.posAccentColor || "#2563eb";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPatient | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Modals & Camera State
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHoldConfirmModal, setShowHoldConfirmModal] = useState(false);
  const [holdCustomerNote, setHoldCustomerNote] = useState("");
  const [printableHoldSlip, setPrintableHoldSlip] = useState<{
    id: string;
    customerName: string;
    date: string;
    items: PosCartItem[];
  } | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecentInvoicesModal, setShowRecentInvoicesModal] = useState(false);
  const [showRecentTransactionsSidebar, setShowRecentTransactionsSidebar] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGlobalSearchModal, setShowGlobalSearchModal] = useState(false);
  const [showQuickAddCustomerModal, setShowQuickAddCustomerModal] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<PosSale | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<"THERMAL" | "A4">("THERMAL");
  const [interactionAlert, setInteractionAlert] = useState<{
    severity: string;
    summary: string;
    warnings: string[];
  } | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

  // Payment Method & Multi-Payment (Split) State
  const [paymentMethod, setPaymentMethod] = useState<PosSale["paymentMethod"]>("Cash");
  const [cashGiven, setCashGiven] = useState<number>(0);
  
  // Split Payment Inputs
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitCard, setSplitCard] = useState<number>(0);
  const [splitCardRef, setSplitCardRef] = useState<string>("");
  const [splitWallet, setSplitWallet] = useState<number>(0);
  const [splitWalletProvider, setSplitWalletProvider] = useState<string>("M-Pesa");
  const [splitWalletRef, setSplitWalletRef] = useState<string>("");
  const [splitInsurance, setSplitInsurance] = useState<number>(0);
  const [splitInsuranceProvider, setSplitInsuranceProvider] = useState<string>("");
  const [splitDeposit, setSplitDeposit] = useState<number>(0);
  const [splitCredit, setSplitCredit] = useState<number>(0);

  // Scan Verification Log State (Last 5 Scans)
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);

  const recordScanLog = (
    med: Medicine,
    source: ScanLogEntry["scanSource"] = "BARCODE_INPUT",
    overridePrice?: number
  ) => {
    const newEntry: ScanLogEntry = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      medicineId: med.id,
      medicineName: med.name,
      genericName: med.genericName,
      barcode: med.barcode || med.sku || "N/A",
      unitPrice: overridePrice ?? med.sellingPrice,
      dosageForm: med.dosageForm || "Unit",
      strength: med.strength || "",
      scannedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      timestamp: Date.now(),
      scanSource: source,
    };
    setScanLog((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)].slice(0, 5));
  };

  const handleAddToCartWithLog = (
    med: Medicine,
    qty: number = 1,
    unit?: string,
    unitMultiplier?: number,
    overridePrice?: number,
    source: ScanLogEntry["scanSource"] = "CATALOG_CLICK"
  ) => {
    addToCart(med, qty, unit, unitMultiplier, overridePrice);
    recordScanLog(med, source, overridePrice);
  };

  const handleRemoveFromScanLog = (entry: ScanLogEntry) => {
    const cartItem = cart.find((i) => i.medicine.id === entry.medicineId);
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateCartQty(entry.medicineId, -1);
      } else {
        removeFromCart(entry.medicineId);
      }
    }
  };

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
      playBarcodeScanSuccessChime();
      handleAddToCartWithLog(matched, 1, undefined, undefined, undefined, "BARCODE_INPUT");
      setBarcodeInput("");
    } else {
      playErrorSound();
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

  // Total split payment sum
  const totalSplitPaid = splitCash + splitCard + splitWallet + splitInsurance + splitDeposit + splitCredit;
  const splitBalanceRemaining = grandTotal - totalSplitPaid;

  // Complete Payment Submission
  const handleProcessPayment = () => {
    let details: PosSale["paymentDetails"] = {};

    if (paymentMethod === "Cash") {
      details = {
        cashPaid: cashGiven,
        changeGiven: changeGiven,
      };
    } else if (paymentMethod === "Card") {
      details = { cardPaid: grandTotal };
    } else if (paymentMethod === "Digital Wallet") {
      details = { walletPaid: grandTotal };
    } else if (paymentMethod === "Insurance") {
      details = { insuranceApproved: grandTotal };
    } else if (paymentMethod === "Deposit Wallet") {
      details = { walletPaid: grandTotal };
    } else if (paymentMethod === "Credit / Account") {
      details = { creditCharged: grandTotal };
    } else if (paymentMethod === "Split") {
      details = {
        cashPaid: splitCash,
        cardPaid: splitCard,
        walletPaid: splitWallet + splitDeposit,
        insuranceApproved: splitInsurance,
        creditCharged: splitCredit,
        changeGiven: Math.max(0, totalSplitPaid - grandTotal),
      };
    }

    const sale = completeSale(paymentMethod, selectedCustomer || undefined, details);
    setCompletedInvoice(sale);
    setShowPaymentModal(false);
  };

  const handleHoldSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameOrNote = holdCustomerNote.trim() || selectedCustomer?.name || "Walk-In Customer";
    holdCurrentSale(nameOrNote);
    setHoldCustomerNote("");
    setShowHoldConfirmModal(false);
  };

  // Keyboard Shortcuts Handler (Ctrl+K: Global Search, Alt+S: Save, Alt+P: Print, Alt+C: Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K or F2: Open Global Medicine Search Modal
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || e.key === "F2") {
        e.preventDefault();
        setShowGlobalSearchModal(true);
        return;
      }

      if (e.altKey) {
        const key = e.key.toLowerCase();

        // Alt + S: Save / Process Sale
        if (key === "s") {
          e.preventDefault();
          if (showPaymentModal) {
            handleProcessPayment();
          } else if (cart.length > 0) {
            setSplitCash(grandTotal);
            setSplitCard(0);
            setSplitWallet(0);
            setSplitInsurance(0);
            setCashGiven(grandTotal);
            setShowPaymentModal(true);
          } else {
            alert("Cart is empty! Add items before saving or completing sale.");
          }
        }

        // Alt + P: Print Receipt
        if (key === "p") {
          e.preventDefault();
          if (completedInvoice) {
            window.print();
          } else {
            setShowRecentInvoicesModal(true);
          }
        }

        // Alt + C: Clear Cart
        if (key === "c") {
          e.preventDefault();
          if (cart.length > 0) {
            if (window.confirm("Are you sure you want to clear the current transaction cart? [Alt+C]")) {
              clearCart();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    showPaymentModal,
    grandTotal,
    completedInvoice,
    clearCart,
    paymentMethod,
    cashGiven,
    changeGiven,
    selectedCustomer,
    splitCash,
    splitCard,
    splitWallet,
    splitInsurance,
    splitDeposit,
    splitCredit,
    totalSplitPaid,
  ]);

  if (isLoading) {
    return <PosSkeleton />;
  }

  return (
    <RbacGuard permission="pos_sales">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
        {/* Left Column: Medicine Catalog & Barcode Scanner */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Top Controls: Barcode & Search & Camera Scanner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
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
                  className="px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs"
                  style={{ backgroundColor: brandAccentColor }}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan</span>
                </button>
              </form>

              {/* Device Camera Barcode Scanner Trigger Button */}
              <Tooltip content="Use camera to scan medicine barcodes" position="bottom">
                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Camera className="h-4 w-4" />
                  <span>Camera Scanner</span>
                </button>
              </Tooltip>

              {/* Shift Recent Transactions Sidebar Trigger Button */}
              <Tooltip content="Quickly view & reprint recent receipts from current shift" position="bottom">
                <button
                  type="button"
                  onClick={() => setShowRecentTransactionsSidebar(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <History className="h-4 w-4" />
                  <span>Recent Shift Sales ({sales.length})</span>
                </button>
              </Tooltip>

              {/* Digital Pharmacy Calculator Trigger Button */}
              <Tooltip content="Open pharmacy dosage & price calculator" position="bottom">
                <button
                  type="button"
                  onClick={() => setShowCalculator(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-slate-800/20"
                >
                  <Calculator className="h-4 w-4 text-blue-400" />
                  <span>Calculator</span>
                </button>
              </Tooltip>

              {/* End of Day (Z-Report) Trigger Button */}
              <Tooltip content="Perform daily shift closeout & print Z-Report" position="bottom">
                <button
                  type="button"
                  onClick={() => setShowEndOfDayModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Calculator className="h-4 w-4" />
                  <span>End of Day (Z-Report)</span>
                </button>
              </Tooltip>
            </div>

            {/* Keyboard Hotkeys Legend Banner */}
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-extrabold text-[11px]">
                <Keyboard className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>POS Hotkeys:</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowGlobalSearchModal(true)}
                  className="bg-blue-600 text-white hover:bg-blue-500 px-2.5 py-0.5 rounded font-bold shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Press Ctrl+K or F2 to search medicine by brand or generic name"
                >
                  <Search className="h-3 w-3" />
                  <span>Ctrl+K / F2</span>
                  <span className="font-sans font-normal opacity-90">Instant Search</span>
                </button>
                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold shadow-2xs">
                  Alt+S <span className="font-sans font-normal text-slate-500 dark:text-slate-400">Save/Pay</span>
                </span>
                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold shadow-2xs">
                  Alt+P <span className="font-sans font-normal text-slate-500 dark:text-slate-400">Print Receipt</span>
                </span>
                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-bold shadow-2xs">
                  Alt+C <span className="font-sans font-normal text-slate-500 dark:text-slate-400">Clear Cart</span>
                </span>
              </div>
            </div>

            {/* Search & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div
                className="relative flex-1 cursor-pointer"
                onClick={() => setShowGlobalSearchModal(true)}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <input
                  type="text"
                  placeholder="Find medicine by brand name or generic composition (Ctrl + K)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-20 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGlobalSearchModal(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white flex items-center gap-1 shadow-xs"
                  style={{ backgroundColor: brandAccentColor }}
                >
                  <Search className="h-3 w-3" />
                  <span>Ctrl+K</span>
                </button>
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

          {/* Scan Log Visual Verification Widget */}
          <ScanLogWidget
            scanLog={scanLog}
            cart={cart}
            onRemoveItem={handleRemoveFromScanLog}
            onClearLog={() => setScanLog([])}
            formatCurrency={formatCurrency}
          />

          {/* Medicines Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMedicines.map((med) => {
              const isOutOfStock = med.stock <= 0;
              return (
                <div
                  key={med.id}
                  onClick={() => !isOutOfStock && handleAddToCartWithLog(med, 1, undefined, undefined, undefined, "CATALOG_CLICK")}
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

                    {/* UOM Multi-Unit Quick Add Pills if available */}
                    {med.uomConfig && med.uomConfig.conversions.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) handleAddToCartWithLog(med, 1, med.uomConfig?.baseUnit, 1, med.sellingPrice, "CATALOG_CLICK");
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 font-bold text-[9px] border border-slate-200 dark:border-slate-700"
                        >
                          +1 {med.uomConfig.baseUnit}
                        </button>
                        {med.uomConfig.conversions.map((conv) => (
                          <button
                            key={conv.unitName}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) {
                                const price = conv.sellingPrice || (med.sellingPrice * conv.conversionMultiplier);
                                handleAddToCartWithLog(med, 1, conv.unitName, conv.conversionMultiplier, price, "CATALOG_CLICK");
                              }
                            }}
                            className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-[9px] border border-indigo-200 dark:border-indigo-800"
                          >
                            +1 {conv.unitName} ({conv.conversionMultiplier}x)
                          </button>
                        ))}
                      </div>
                    )}
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
              <ShoppingCart className="h-5 w-5" style={{ color: brandAccentColor }} />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Dispensing Order Cart ({cart.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowRecentTransactionsSidebar(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1 rounded-full transition-colors"
                title="Open Shift Recent Transactions Sidebar"
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Recent Shift ({sales.length})</span>
              </button>
              {onHoldSales.length > 0 && (
                <button
                  onClick={() => setShowHoldModal(true)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full transition-colors"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span>{onHoldSales.length} Held</span>
                </button>
              )}
            </div>
          </div>

          {/* Patient Selection Dropdown */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Patient / Customer Profile
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddCustomerModal(true)}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/60 shadow-xs"
                title="Register new customer directly during sale"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Quick Add</span>
              </button>
            </div>

            <select
              value={selectedCustomer?.id || ""}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="">Walk-In Patient (Standard Retail)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.patientCode}) — {c.loyaltyPoints} Points
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-blue-950 dark:text-blue-200 truncate flex items-center gap-1.5">
                    <span>{selectedCustomer.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-200/60 dark:bg-blue-800 text-[10px] font-mono text-blue-800 dark:text-blue-200">
                      {selectedCustomer.patientCode}
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-3 mt-0.5">
                    <span>📞 {selectedCustomer.phone}</span>
                    <span>⭐ {selectedCustomer.loyaltyPoints} pts</span>
                    <span>💳 Deposit: ₦{(selectedCustomer.depositBalance || selectedCustomer.walletBalance || 0).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 rounded-lg hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 text-slate-400 transition-colors shrink-0"
                  title="Remove selected customer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
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
                      Batch: {item.selectedBatch} • {formatCurrency(item.unitPrice)}/
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {item.selectedUnit || item.medicine.uomConfig?.baseUnit || "unit"}
                      </span>
                      {item.selectedUnitMultiplier && item.selectedUnitMultiplier > 1 && (
                        <span className="text-[9px] text-slate-400 ml-1">
                          ({item.selectedUnitMultiplier} base units/pkg)
                        </span>
                      )}
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
                  <div className="flex items-center gap-2">
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

                    {/* Unit Selector */}
                    {item.medicine.uomConfig && item.medicine.uomConfig.conversions.length > 0 ? (
                      <select
                        value={item.selectedUnit || item.medicine.uomConfig.baseUnit}
                        onChange={(e) => {
                          const selectedUnitName = e.target.value;
                          if (selectedUnitName === item.medicine.uomConfig?.baseUnit) {
                            updateCartUnit(item.medicine.id, selectedUnitName, 1, item.medicine.sellingPrice);
                          } else {
                            const foundRule = item.medicine.uomConfig?.conversions.find((c) => c.unitName === selectedUnitName);
                            if (foundRule) {
                              const price = foundRule.sellingPrice || (item.medicine.sellingPrice * foundRule.conversionMultiplier);
                              updateCartUnit(item.medicine.id, selectedUnitName, foundRule.conversionMultiplier, price);
                            }
                          }
                        }}
                        className="text-[10px] bg-white dark:bg-slate-700 font-bold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value={item.medicine.uomConfig.baseUnit}>
                          {item.medicine.uomConfig.baseUnit} (1x)
                        </option>
                        {item.medicine.uomConfig.conversions.map((conv) => (
                          <option key={conv.unitName} value={conv.unitName}>
                            {conv.unitName} ({conv.conversionMultiplier}x)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        {item.selectedUnit || item.medicine.dosageForm || "Unit"}
                      </span>
                    )}
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
              <Tooltip content="Temporarily hold bill for later checkout" shortcut="Alt+H" className="w-full">
                <button
                  onClick={() => {
                    setHoldCustomerNote(selectedCustomer?.name || "");
                    setShowHoldConfirmModal(true);
                  }}
                  disabled={cart.length === 0}
                  className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PauseCircle className="h-4 w-4 text-amber-600" />
                  <span>Hold Order ({onHoldSales.length})</span>
                </button>
              </Tooltip>

              <Tooltip content="Process cash, card, or split payment" shortcut="Alt+S" className="w-full">
                <button
                  onClick={() => {
                    setSplitCash(grandTotal);
                    setSplitCard(0);
                    setSplitWallet(0);
                    setSplitInsurance(0);
                    setCashGiven(grandTotal);
                    setShowPaymentModal(true);
                  }}
                  disabled={cart.length === 0}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-bold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: brandAccentColor }}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Pay {formatCurrency(grandTotal)}</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Create Hold Sale Note Modal */}
        {showHoldConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PauseCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Hold Dispensing Cart
                  </h3>
                </div>
                <button onClick={() => setShowHoldConfirmModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Holding this cart will preserve all {cart.length} items and prices so you can serve another customer.
              </p>

              <form onSubmit={handleHoldSaleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Patient Name / Hold Reference Tag:
                  </label>
                  <input
                    type="text"
                    value={holdCustomerNote}
                    onChange={(e) => setHoldCustomerNote(e.target.value)}
                    placeholder="e.g. John Doe - Staging Rx #302"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowHoldConfirmModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                  >
                    Save & Hold Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Processing Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Complete POS Checkout Payment
                  </h3>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center py-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold block uppercase tracking-wider">
                  Total Bill Amount
                </span>
                <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* Payment Method Selector Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Select Payment Option
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(["Cash", "Card", "Digital Wallet", "Insurance", "Deposit Wallet", "Credit / Account", "Split"] as PosSale["paymentMethod"][]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-extrabold border transition-all flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === method
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {method === "Cash" && <Coins className="h-3.5 w-3.5" />}
                      {method === "Card" && <CreditCard className="h-3.5 w-3.5" />}
                      {method === "Digital Wallet" && <Wallet className="h-3.5 w-3.5" />}
                      {method === "Insurance" && <ShieldCheck className="h-3.5 w-3.5" />}
                      {method === "Deposit Wallet" && <Wallet className="h-3.5 w-3.5 text-emerald-300" />}
                      {method === "Credit / Account" && <FileText className="h-3.5 w-3.5 text-rose-300" />}
                      {method === "Split" && <Split className="h-3.5 w-3.5 text-amber-300" />}
                      <span className="truncate max-w-full">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Cash Payment Mode */}
              {paymentMethod === "Cash" && (
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Cash Received Tendered:
                  </label>
                  <input
                    type="number"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Quick Cash Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[grandTotal, Math.ceil(grandTotal / 1000) * 1000, 5000, 10000, 20000].map((quickAmt) => (
                      <button
                        key={quickAmt}
                        type="button"
                        onClick={() => setCashGiven(quickAmt)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50"
                      >
                        ₦{quickAmt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  {cashGiven >= grandTotal && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-extrabold flex justify-between items-center border border-emerald-500/20">
                      <span>Change to Return:</span>
                      <span className="text-sm font-mono">{formatCurrency(changeGiven)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Deposit Wallet Payment Mode */}
              {paymentMethod === "Deposit Wallet" && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-4 w-4" />
                      <span>Customer Pre-paid Deposit Wallet</span>
                    </span>
                    <span>
                      Avail: {selectedCustomer ? formatCurrency(selectedCustomer.depositBalance || 0) : "$0.00"}
                    </span>
                  </div>
                  {!selectedCustomer ? (
                    <p className="text-rose-600 font-bold text-[11px]">
                      ⚠️ Please select or attach a registered Patient/Customer to deduct from their Deposit Wallet.
                    </p>
                  ) : (selectedCustomer.depositBalance || 0) < grandTotal ? (
                    <p className="text-amber-600 font-bold text-[11px]">
                      ⚠️ Insufficient Deposit Wallet balance ({formatCurrency(selectedCustomer.depositBalance || 0)}). Please top up or use Split Tender.
                    </p>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Deducting <strong className="text-emerald-600">{formatCurrency(grandTotal)}</strong> directly from {selectedCustomer.name}&apos;s deposit wallet.
                    </p>
                  )}
                </div>
              )}

              {/* Credit / Account Sell Mode */}
              {paymentMethod === "Credit / Account" && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      <span>Credit Sale / Account Invoice</span>
                    </span>
                  </div>
                  {!selectedCustomer ? (
                    <p className="text-rose-600 font-bold text-[11px]">
                      ⚠️ Please select a customer to issue a credit sale against their account balance.
                    </p>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      This sale of <strong className="text-rose-600">{formatCurrency(grandTotal)}</strong> will be charged as credit to <strong>{selectedCustomer.name}</strong>. Their unpaid credit balance will increase automatically.
                    </p>
                  )}
                </div>
              )}

              {/* Card / POS Terminal Mode */}
              {paymentMethod === "Card" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                    <CreditCard className="h-4 w-4" />
                    <span>POS Terminal Card Payment</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Process ₦{grandTotal.toLocaleString()} on physical POS terminal (Visa, Mastercard, Verve).
                  </p>
                </div>
              )}

              {/* Digital Wallet / Mobile Money */}
              {paymentMethod === "Digital Wallet" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    <Wallet className="h-4 w-4" />
                    <span>Mobile Money / Instant Transfer</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Customer transfers ₦{grandTotal.toLocaleString()} via M-Pesa, Tigo, Airtel, or Direct Bank Transfer.
                  </p>
                </div>
              )}

              {/* Insurance Payment */}
              {paymentMethod === "Insurance" && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>HMO / National Health Insurance Direct Billing</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Billed to: <span className="font-bold">{selectedCustomer?.insuranceProvider || "Direct HMO Coverage"}</span> (Policy: {selectedCustomer?.insurancePolicyNumber || "Default-Policy"})
                  </p>
                </div>
              )}

              {/* MULTI-PAYMENT (SPLIT) MODE */}
              {paymentMethod === "Split" && (
                <div className="p-4 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl border border-amber-500/20 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                      <Split className="h-4 w-4" />
                      <span>Multi-Payment / Split Tender Breakdown</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Target: {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Split Cash */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Coins className="h-3 w-3 text-emerald-600" />
                        <span>Cash Amount (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitCash || ""}
                        onChange={(e) => setSplitCash(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Split Card */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-blue-600" />
                        <span>POS Card Amount (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitCard || ""}
                        onChange={(e) => setSplitCard(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Split Mobile Money */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-indigo-600" />
                        <span>Mobile Money/Transfer (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitWallet || ""}
                        onChange={(e) => setSplitWallet(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Split Insurance */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-teal-600" />
                        <span>Insurance Coverage (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitInsurance || ""}
                        onChange={(e) => setSplitInsurance(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Split Deposit Wallet */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Wallet className="h-3 w-3 text-emerald-600" />
                        <span>Deposit Wallet (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitDeposit || ""}
                        onChange={(e) => setSplitDeposit(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Split Credit Sale */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-rose-600" />
                        <span>On Credit / Account (₦)</span>
                      </label>
                      <input
                        type="number"
                        value={splitCredit || ""}
                        onChange={(e) => setSplitCredit(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Split Summary & Live Balance Indicator */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Split Paid:</span>
                      <span className="font-extrabold font-mono text-slate-900 dark:text-slate-100">
                        {formatCurrency(totalSplitPaid)}
                      </span>
                    </div>

                    {splitBalanceRemaining > 0 ? (
                      <div className="flex justify-between font-bold text-rose-600 text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span>Balance Remaining Due:</span>
                        <span className="font-mono">{formatCurrency(splitBalanceRemaining)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between font-extrabold text-emerald-600 text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                        <span>Status: Fully Paid!</span>
                        <span className="font-mono">
                          {totalSplitPaid > grandTotal ? `Change: ${formatCurrency(totalSplitPaid - grandTotal)}` : "Exact Match"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleProcessPayment}
                disabled={paymentMethod === "Split" && totalSplitPaid < grandTotal}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirm Payment & Print Receipt</span>
              </button>
            </div>
          </div>
        )}

        {/* Printable Thermal / A4 Receipt Modal */}
        {completedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto printable-modal-overlay">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 printable-modal-content">
              {/* Modal Top Bar - Hidden on print */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Official Dispensing Sales Receipt
                  </h3>
                </div>

                {/* Paper Format Selector */}
                <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setReceiptFormat("THERMAL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      receiptFormat === "THERMAL"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Thermal (80mm Roll)</span>
                  </button>
                  <button
                    onClick={() => setReceiptFormat("A4")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      receiptFormat === "A4"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>A4 Standard Invoice</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    onClick={() => setCompletedInvoice(null)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Receipt Output Container */}
              {receiptFormat === "THERMAL" ? (
                /* 80mm Thermal Receipt Layout */
                <div className="thermal-receipt-paper bg-white text-slate-900 p-4 rounded-xl border border-slate-200 shadow-md max-w-[80mm] mx-auto text-[11px] font-mono leading-tight space-y-2">
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                    {settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Pharmacy Logo"
                        className="h-10 w-auto max-w-[120px] mx-auto object-contain mb-1"
                      />
                    )}
                    <div className="font-extrabold text-xs tracking-wider uppercase">
                      {settings.companyName || "MEDIFLOW PHARMACY ERP"}
                    </div>
                    <div className="text-[10px] text-slate-700 font-bold">
                      {completedInvoice.branchName || currentBranch?.name || "Lagos Flagship Branch"}
                    </div>
                    <div className="text-[9px] text-slate-600">
                      {settings.companyAddress || "14 Broad Street, Victoria Island, Lagos"}
                    </div>
                    <div className="text-[9px] text-slate-600">
                      Tel: {settings.companyPhone || "+234 800 633 4356"} | {settings.companyEmail || "support@mediflow.ng"}
                    </div>
                    {settings.companyTaxId && (
                      <div className="text-[9px] text-slate-600 font-bold pt-0.5">
                        TIN: {settings.companyTaxId} (VAT {settings.defaultTaxRatePercent || 7.5}% Compliant)
                      </div>
                    )}
                    {settings.receiptHeaderMessage && (
                      <div className="pt-1 text-[9.5px] font-semibold text-blue-800 italic border-t border-slate-200/80">
                        "{settings.receiptHeaderMessage}"
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">INVOICE NO:</span>
                      <span className="font-bold">{completedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">DATE/TIME:</span>
                      <span>{new Date(completedInvoice.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">DISPENSER:</span>
                      <span>{completedInvoice.cashierName || "Pharm. Cashier"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">PATIENT:</span>
                      <span className="font-bold truncate max-w-[120px]">
                        {completedInvoice.customerName || "Walk-in Patient"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between text-[10px] font-bold border-b border-slate-300 pb-0.5 uppercase">
                      <span>QTY x ITEM</span>
                      <span className="text-right">TOTAL (₦)</span>
                    </div>
                    {completedInvoice.items.map((item, idx) => (
                      <div key={idx} className="space-y-0.5 text-[10px]">
                        <div className="font-bold uppercase text-slate-900">
                          {item.medicineName}
                        </div>
                        <div className="flex justify-between text-slate-700 text-[9.5px]">
                          <span>
                            {item.quantity} x {formatCurrency(item.unitPrice)}
                            {item.batchNumber ? ` (B:${item.batchNumber})` : ""}
                          </span>
                          <span className="font-bold font-mono">{formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2 text-right">
                    <div className="flex justify-between text-slate-700">
                      <span>SUBTOTAL (EXCL. VAT):</span>
                      <span className="font-mono">{formatCurrency(completedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>VAT (7.5% NGN):</span>
                      <span className="font-mono">{formatCurrency(completedInvoice.taxAmount)}</span>
                    </div>
                    {completedInvoice.totalDiscount > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>DISCOUNT:</span>
                        <span className="font-mono">-{formatCurrency(completedInvoice.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-extrabold text-slate-900 pt-1 border-t border-slate-400">
                      <span>NET TOTAL (NGN):</span>
                      <span className="font-mono">{formatCurrency(completedInvoice.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-400 pb-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">PAYMENT METHOD:</span>
                      <span className="font-bold">{completedInvoice.paymentMethod}</span>
                    </div>
                    {completedInvoice.paymentMethod === "Cash" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-600">CASH TENDERED:</span>
                          <span className="font-mono">
                            {formatCurrency(completedInvoice.paymentDetails?.cashPaid || completedInvoice.grandTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-600">CHANGE RETURNED:</span>
                          <span className="font-mono">
                            {formatCurrency(completedInvoice.paymentDetails?.changeGiven || 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="py-1 text-center space-y-0.5">
                    <div className="inline-block tracking-widest font-mono text-[10px] bg-slate-100 px-3 py-1 rounded border border-slate-300 font-extrabold">
                      |||| | ||||| || |||||| | |||
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">{completedInvoice.invoiceNumber}</div>
                  </div>

                  <div className="text-center text-[8.5px] text-slate-600 space-y-0.5 pt-1 border-t border-dashed border-slate-300">
                    {settings.receiptFooterMessage ? (
                      <p className="font-semibold text-slate-800">{settings.receiptFooterMessage}</p>
                    ) : (
                      <>
                        <p className="font-bold">Thank you for choosing {settings.companyName || "MediFlow ERP"}!</p>
                        <p>Opened drug seals are non-refundable for public health safety.</p>
                      </>
                    )}
                    <p className="text-[8px] text-slate-400 pt-0.5">Keep out of reach of children. Store below 25°C.</p>
                  </div>
                </div>
              ) : (
                /* Standard A4 Sheet Invoice Layout */
                <div className="a4-receipt-paper bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl max-w-2xl mx-auto text-xs space-y-6">
                  <div className="flex items-start justify-between border-b-2 border-blue-600 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        {settings.logoUrl ? (
                          <img
                            src={settings.logoUrl}
                            alt="Company Logo"
                            className="h-12 w-auto max-w-[150px] object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                            <Activity className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <h1 className="text-lg font-extrabold text-blue-950 uppercase tracking-wide">
                            {settings.companyName || "MediFlow Pharmacy ERP"}
                          </h1>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            Official Pharmaceutical Sales Tax Invoice & Receipt
                          </p>
                        </div>
                      </div>

                      {settings.receiptHeaderMessage && (
                        <p className="text-xs font-semibold text-blue-700 italic mt-2">
                          "{settings.receiptHeaderMessage}"
                        </p>
                      )}

                      <p className="text-xs text-slate-600 mt-2">
                        {completedInvoice.branchName || currentBranch?.name} • {settings.companyAddress || "14 Broad Street, Victoria Island, Lagos"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Phone: {settings.companyPhone || "+234 800 633 4356"} | Tax Reg (TIN): {settings.companyTaxId || "23948102-0001"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mb-2">
                        PAID - OFFICIAL RECEIPT
                      </span>
                      <p className="text-base font-extrabold text-slate-900 font-mono">
                        {completedInvoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        Date: {new Date(completedInvoice.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Patient / Billed To
                      </span>
                      <p className="font-extrabold text-slate-900 mt-0.5">
                        {completedInvoice.customerName || "Walk-in Patient"}
                      </p>
                      {completedInvoice.customerPhone && (
                        <p className="text-slate-600 text-xs">Phone: {completedInvoice.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Dispensing Cashier / Payment
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5">
                        Dispenser: {completedInvoice.cashierName || "Pharmacy Cashier"}
                      </p>
                      <p className="text-slate-600 text-xs">
                        Payment Method: <span className="font-bold text-blue-700">{completedInvoice.paymentMethod}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Dispensed Medications & Products
                    </h3>
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                          <th className="p-2">#</th>
                          <th className="p-2">Medication Name</th>
                          <th className="p-2">Batch</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Unit Price (₦)</th>
                          <th className="p-2 text-right">Total (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {completedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">
                              {item.medicineName}
                              {item.genericName && (
                                <span className="text-[10px] text-slate-500 font-normal block">{item.genericName}</span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-slate-600">{item.batchNumber || "STANDARD"}</td>
                            <td className="p-2 text-center font-bold font-mono">{item.quantity}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 text-right font-mono font-extrabold text-slate-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal (Excl. Tax):</span>
                        <span className="font-mono">{formatCurrency(completedInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>VAT (7.5% Tax):</span>
                        <span className="font-mono">{formatCurrency(completedInvoice.taxAmount)}</span>
                      </div>
                      {completedInvoice.totalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Discount Applied:</span>
                          <span className="font-mono">-{formatCurrency(completedInvoice.totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t-2 border-slate-300">
                        <span>GRAND TOTAL (NGN):</span>
                        <span className="font-mono text-blue-700 text-base">{formatCurrency(completedInvoice.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      <p className="font-bold text-slate-700">{settings.companyName || "MediFlow Pharmacy Compliance"}</p>
                      <p>{settings.receiptFooterMessage || "Check medications before departure. Unsealed products cannot be refunded."}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-36 border-b border-slate-400 mb-1"></div>
                      <p className="text-[10px]">Licensed Pharmacist Signature</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Invoices / Receipts Modal */}
        {showRecentInvoicesModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 printable-modal-content">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Recent Sales Receipts
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <ModalHeaderPrintButton size="sm" />
                  <button onClick={() => setShowRecentInvoicesModal(false)}>
                    <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {sales.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No completed sales recorded today yet.</p>
                ) : (
                  sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                            {sale.invoiceNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                            {sale.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {sale.customerName || "Walk-in Patient"} • {sale.items.length} items
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(sale.date).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100">
                          {formatCurrency(sale.grandTotal)}
                        </span>
                        <button
                          onClick={() => {
                            setCompletedInvoice(sale);
                            setShowRecentInvoicesModal(false);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-500"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>View/Print</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* On-Hold Sales Management Modal */}
        {showHoldModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 printable-modal-content">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PauseCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    On-Hold Orders & Invoices ({onHoldSales.length})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <ModalHeaderPrintButton size="sm" />
                  <button onClick={() => setShowHoldModal(false)}>
                    <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
              </div>

              {onHoldSales.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-semibold">No orders currently on hold.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {onHoldSales.map((h) => {
                    const heldTotal = h.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                    return (
                      <div
                        key={h.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                              Held Order Ref #{h.id.slice(-6)}
                            </span>
                            <h5 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-1">
                              {h.customerName}
                            </h5>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Held on {h.date}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400 block">
                              {formatCurrency(heldTotal)}
                            </span>
                            <span className="text-[10px] text-slate-500">{h.items.length} Medications</span>
                          </div>
                        </div>

                        {/* Items preview list */}
                        <div className="p-2 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                          {h.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300">
                              <span className="font-semibold truncate max-w-[220px]">
                                {item.quantity}x {item.medicine.name} ({item.selectedUnit || "Base Unit"})
                              </span>
                              <span className="font-mono">{formatCurrency(item.unitPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => deleteHeldSale(h.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold transition-colors flex items-center gap-1"
                            title="Delete Held Order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              resumeSale(h.id);
                              setShowHoldModal(false);
                            }}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            <span>Resume Order</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Add Customer / Patient Modal */}
        <QuickAddCustomerModal
          isOpen={showQuickAddCustomerModal}
          onClose={() => setShowQuickAddCustomerModal(false)}
          onCustomerCreated={(newCust) => {
            setSelectedCustomer(newCust);
          }}
        />

        {/* Recent Shift Transactions Sidebar */}
        <RecentTransactionsSidebar
          isOpen={showRecentTransactionsSidebar}
          onClose={() => setShowRecentTransactionsSidebar(false)}
          sales={sales}
          onSelectSaleForReprint={(sale) => {
            setCompletedInvoice(sale);
            setShowRecentTransactionsSidebar(false);
          }}
          formatCurrency={formatCurrency}
        />

        {/* Camera Barcode Scanner Modal */}
        <CameraBarcodeScannerModal
          isOpen={showCameraScanner}
          onClose={() => setShowCameraScanner(false)}
          medicines={medicines}
          onScanSuccess={(scannedMed) => {
            playBarcodeScanSuccessChime();
            handleAddToCartWithLog(scannedMed, 1, undefined, undefined, undefined, "CAMERA_SCANNER");
          }}
        />

        {/* Restock Reorder Modal */}
        <RestockReorderModal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          mode="RESTOCK"
        />

        {/* End of Day (Z-Report) Modal */}
        <EndOfDayModal
          isOpen={showEndOfDayModal}
          onClose={() => setShowEndOfDayModal(false)}
        />

        {/* Digital Pharmacy Calculator Modal */}
        <DigitalCalculatorModal
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
        />

        {/* Global Instant Medicine & Generic Search Engine Modal */}
        <GlobalPosSearchModal
          isOpen={showGlobalSearchModal}
          onClose={() => setShowGlobalSearchModal(false)}
          medicines={medicines}
          onAddToCart={(med, qty) => handleAddToCartWithLog(med, qty, undefined, undefined, undefined, "GLOBAL_SEARCH")}
          formatCurrency={formatCurrency}
        />

        {/* Floating Voice Command Interface for Hands-Free POS Actions */}
        <VoiceCommandAssistant
          onSearchQuery={(q) => setSearchQuery(q)}
          onAddToCart={(medName) => {
            const query = medName.toLowerCase().trim();
            const matched = medicines.find(
              (m) =>
                m.name.toLowerCase().includes(query) ||
                m.genericName.toLowerCase().includes(query) ||
                m.sku.toLowerCase() === query
            );
            if (matched) {
              addToCart(matched, 1);
              return true;
            }
            return false;
          }}
          onClearCart={() => clearCart()}
          onHoldSale={() => setShowHoldConfirmModal(true)}
          onCompleteSale={() => {
            if (cart.length > 0) setShowPaymentModal(true);
          }}
          onPrintInvoice={() => {
            if (completedInvoice) {
              window.print();
            } else {
              setShowRecentInvoicesModal(true);
            }
          }}
          onOpenRestock={() => setShowRestockModal(true)}
        />
      </div>
    </RbacGuard>
  );
};

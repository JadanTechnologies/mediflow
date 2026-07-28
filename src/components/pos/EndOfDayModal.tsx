import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { usePharmacy } from "../../context/PharmacyContext";
import { EndOfDayReport } from "../../types/pharmacy";
import {
  X,
  Printer,
  FileText,
  DollarSign,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Coins,
  CreditCard,
  Wallet,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  History,
  TrendingUp,
  Download,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EndOfDayModal: React.FC<EndOfDayModalProps> = ({ isOpen, onClose }) => {
  const {
    sales,
    currentBranch,
    currentUser,
    formatCurrency,
    settings,
    saveEndOfDayReport,
    endOfDayReports,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<"NEW_RECONCILIATION" | "HISTORY">("NEW_RECONCILIATION");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Reconciliation Form Inputs
  const [openingFloat, setOpeningFloat] = useState<number>(10000); // default opening float e.g. 10,000 NGN
  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>("");
  const [completedReport, setCompletedReport] = useState<EndOfDayReport | null>(null);
  const [previewReport, setPreviewReport] = useState<EndOfDayReport | null>(null);
  const [printFormat, setPrintFormat] = useState<"THERMAL" | "A4">("THERMAL");

  // Filter sales for selected date and branch
  const dateSales = sales.filter((s) => {
    const sDate = new Date(s.date).toISOString().split("T")[0];
    const matchesBranch = !currentBranch || s.branchId === currentBranch.id;
    return sDate === selectedDate && matchesBranch && s.status === "Completed";
  });

  // Calculate Breakdown by Payment Method
  let totalCashSales = 0;
  let totalCardSales = 0;
  let totalWalletSales = 0;
  let totalInsuranceSales = 0;
  let totalCreditSales = 0;
  let totalSplitSales = 0;
  let totalGrossRevenue = 0;

  dateSales.forEach((s) => {
    totalGrossRevenue += s.grandTotal || 0;

    if (s.paymentMethod === "Cash") {
      totalCashSales += s.grandTotal || 0;
    } else if (s.paymentMethod === "Card") {
      totalCardSales += s.grandTotal || 0;
    } else if (s.paymentMethod === "Digital Wallet" || s.paymentMethod === "Deposit Wallet") {
      totalWalletSales += s.grandTotal || 0;
    } else if (s.paymentMethod === "Insurance") {
      totalInsuranceSales += s.grandTotal || 0;
    } else if (s.paymentMethod === "Credit / Account") {
      totalCreditSales += s.grandTotal || 0;
    } else if (s.paymentMethod === "Split") {
      totalSplitSales += s.grandTotal || 0;
      if (s.paymentDetails) {
        totalCashSales += s.paymentDetails.cashPaid || 0;
        totalCardSales += s.paymentDetails.cardPaid || 0;
        totalWalletSales += s.paymentDetails.walletPaid || 0;
        totalInsuranceSales += s.paymentDetails.insuranceApproved || 0;
        totalCreditSales += s.paymentDetails.creditCharged || 0;
      }
    }
  });

  const expectedCashInDrawer = openingFloat + totalCashSales;
  const cashDiscrepancy = actualCashCounted - expectedCashInDrawer;

  let status: "Balanced" | "Over" | "Short" = "Balanced";
  if (cashDiscrepancy > 0.01) status = "Over";
  else if (cashDiscrepancy < -0.01) status = "Short";

  const handleSubmitReconciliation = (e: React.FormEvent) => {
    e.preventDefault();

    const reportData = {
      date: selectedDate,
      branchId: currentBranch?.id || "main-001",
      branchName: currentBranch?.name || "Main Central Pharmacy",
      cashierId: currentUser?.id || "usr-001",
      cashierName: currentUser?.name || "Active Cashier",
      openingFloat,
      totalSalesCount: dateSales.length,
      totalGrossRevenue,
      totalCashSales,
      totalCardSales,
      totalWalletSales,
      totalInsuranceSales,
      totalCreditSales,
      totalSplitSales,
      expectedCashInDrawer,
      actualCashCounted,
      cashDiscrepancy,
      closingNotes,
      status,
    };

    const saved = saveEndOfDayReport(reportData);
    setCompletedReport(saved);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeReportToPrint = completedReport || previewReport;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="eod-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            key="eod-modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[90vh]"
          >
            {/* Top Header */}
            <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black tracking-tight text-white">
                      End of Day Reconciliation & Z-Report
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      POS Drawer Close
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentBranch?.name || "Main Central Pharmacy"} &bull; Date: {selectedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs">
                  <button
                    onClick={() => {
                      setActiveTab("NEW_RECONCILIATION");
                      setCompletedReport(null);
                      setPreviewReport(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                      activeTab === "NEW_RECONCILIATION"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Perform EOD
                  </button>
                  <button
                    onClick={() => setActiveTab("HISTORY")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                      activeTab === "HISTORY"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>EOD History ({endOfDayReports.length})</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeReportToPrint ? (
                /* Printable Z-Report Summary View */
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                          Z-Report Generated Successfully: {activeReportToPrint.reportNumber}
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Register session closed by {activeReportToPrint.cashierName} on{" "}
                          {new Date(activeReportToPrint.closedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex text-xs">
                        <button
                          type="button"
                          onClick={() => setPrintFormat("THERMAL")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            printFormat === "THERMAL"
                              ? "bg-blue-600 text-white"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Thermal 80mm
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintFormat("A4")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            printFormat === "A4"
                              ? "bg-blue-600 text-white"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          A4 Standard
                        </button>
                      </div>

                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Z-Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Z-Report Printable Paper Rendering */}
                  <div
                    className={`mx-auto bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-xl p-6 font-mono text-xs space-y-4 print:p-0 print:border-none print:shadow-none ${
                      printFormat === "THERMAL" ? "max-w-sm" : "max-w-2xl"
                    }`}
                  >
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                      <h3 className="font-black text-base uppercase tracking-wider">
                        {settings.companyName || "MEDIFLOW PHARMACY"}
                      </h3>
                      <p className="text-[11px] text-slate-600">{activeReportToPrint.branchName}</p>
                      <p className="text-[10px] text-slate-500">{settings.companyAddress}</p>
                      <p className="font-extrabold text-xs pt-1">*** END OF DAY Z-REPORT ***</p>
                      <p className="text-[10px]">Report No: {activeReportToPrint.reportNumber}</p>
                      <p className="text-[10px]">Date: {activeReportToPrint.date}</p>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span>Cashier Session:</span>
                        <span className="font-bold">{activeReportToPrint.cashierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed At:</span>
                        <span>{new Date(activeReportToPrint.closedAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-bold">{activeReportToPrint.totalSalesCount} Sales</span>
                      </div>
                    </div>

                    <div className="pt-2 pb-2 border-t border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                      <p className="font-extrabold uppercase tracking-wide text-slate-700 pb-1">
                        Revenue Breakdown
                      </p>
                      <div className="flex justify-between">
                        <span>Cash Sales:</span>
                        <span className="font-bold">{formatCurrency(activeReportToPrint.totalCashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Card / POS Sales:</span>
                        <span className="font-bold">{formatCurrency(activeReportToPrint.totalCardSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile Wallet Sales:</span>
                        <span className="font-bold">{formatCurrency(activeReportToPrint.totalWalletSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance Claims:</span>
                        <span className="font-bold">{formatCurrency(activeReportToPrint.totalInsuranceSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Accounts:</span>
                        <span className="font-bold">{formatCurrency(activeReportToPrint.totalCreditSales)}</span>
                      </div>
                      <div className="flex justify-between pt-1 font-black text-xs border-t border-slate-200">
                        <span>TOTAL GROSS REVENUE:</span>
                        <span className="text-blue-700">{formatCurrency(activeReportToPrint.totalGrossRevenue)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] pt-1">
                      <p className="font-extrabold uppercase tracking-wide text-slate-700 pb-1">
                        Cash Register Drawer Audit
                      </p>
                      <div className="flex justify-between">
                        <span>Opening Float:</span>
                        <span>{formatCurrency(activeReportToPrint.openingFloat)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Cash Sales Collected:</span>
                        <span>{formatCurrency(activeReportToPrint.totalCashSales)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                        <span>EXPECTED CASH IN DRAWER:</span>
                        <span>{formatCurrency(activeReportToPrint.expectedCashInDrawer)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>ACTUAL CASH COUNTED:</span>
                        <span>{formatCurrency(activeReportToPrint.actualCashCounted)}</span>
                      </div>
                      <div
                        className={`flex justify-between font-black text-xs p-1.5 rounded-md mt-1 ${
                          activeReportToPrint.status === "Balanced"
                            ? "bg-emerald-100 text-emerald-800"
                            : activeReportToPrint.status === "Over"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span>CASH DISCREPANCY:</span>
                        <span>
                          {formatCurrency(activeReportToPrint.cashDiscrepancy)} ({activeReportToPrint.status})
                        </span>
                      </div>
                    </div>

                    {activeReportToPrint.closingNotes && (
                      <div className="pt-2 border-t border-dashed border-slate-300 text-[10px]">
                        <p className="font-bold text-slate-700">Closing Notes:</p>
                        <p className="italic text-slate-600">{activeReportToPrint.closingNotes}</p>
                      </div>
                    )}

                    <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-300">
                      <p className="font-bold">Authorized Sign-off: {activeReportToPrint.cashierName}</p>
                      <p className="pt-1">Verified Audit Logged in ERP Vault</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setCompletedReport(null);
                        setPreviewReport(null);
                      }}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                    >
                      Close Print View
                    </button>
                  </div>
                </div>
              ) : activeTab === "NEW_RECONCILIATION" ? (
                /* Reconciliation Form View */
                <form onSubmit={handleSubmitReconciliation} className="space-y-6">
                  {/* Date & Branch Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>Reconciliation Date</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Active Branch Register</span>
                      </label>
                      <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        {currentBranch?.name || "Main Central Pharmacy"}
                      </div>
                    </div>
                  </div>

                  {/* Sales Summary Grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Sales Summary ({dateSales.length} Completed Invoices)</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                        Gross: {formatCurrency(totalGrossRevenue)}
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                          <span className="text-[10px] font-bold uppercase">Cash Sales</span>
                          <Coins className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-emerald-950 dark:text-emerald-200">
                          {formatCurrency(totalCashSales)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
                        <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                          <span className="text-[10px] font-bold uppercase">Card / POS</span>
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-blue-950 dark:text-blue-200">
                          {formatCurrency(totalCardSales)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-1">
                        <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                          <span className="text-[10px] font-bold uppercase">Mobile Wallet</span>
                          <Wallet className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-purple-950 dark:text-purple-200">
                          {formatCurrency(totalWalletSales)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                          <span className="text-[10px] font-bold uppercase">Insurance</span>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-amber-950 dark:text-amber-200">
                          {formatCurrency(totalInsuranceSales)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                        <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                          <span className="text-[10px] font-bold uppercase">Credit Accounts</span>
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-base font-black text-indigo-950 dark:text-indigo-200">
                          {formatCurrency(totalCreditSales)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cash Drawer Count & Discrepancy Calculation */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Coins className="h-5 w-5 text-emerald-600" />
                        <span>Cash Drawer Audit & Reconciliation</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        Calculated in real-time
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Opening Float Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Opening Cash Float
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={openingFloat || ""}
                            onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">Float at start of session</p>
                      </div>

                      {/* Expected Cash Display */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                          Expected Cash in Drawer
                        </span>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(expectedCashInDrawer)}
                        </p>
                        <p className="text-[10px] text-slate-400">Float + Cash Collected</p>
                      </div>

                      {/* Actual Cash Counted Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                          <span>Actual Cash Counted</span>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">Input</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={actualCashCounted || ""}
                          onChange={(e) => setActualCashCounted(parseFloat(e.target.value) || 0)}
                          placeholder="Enter counted cash..."
                          className="w-full px-3 py-2.5 bg-blue-50/50 dark:bg-slate-800 border-2 border-blue-500 rounded-xl text-lg font-black text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-slate-400">Physical count in register</p>
                      </div>
                    </div>

                    {/* Discrepancy Alert Card */}
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        status === "Balanced"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200"
                          : status === "Over"
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200"
                          : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {status === "Balanced" ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : status === "Over" ? (
                          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wider">
                            Reconciliation Status: {status}
                          </p>
                          <p className="text-sm font-black">
                            Cash Discrepancy: {formatCurrency(cashDiscrepancy)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          status === "Balanced"
                            ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                            : status === "Over"
                            ? "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                            : "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100"
                        }`}
                      >
                        {status === "Balanced"
                          ? "Perfect Match"
                          : status === "Over"
                          ? `Surplus +${formatCurrency(cashDiscrepancy)}`
                          : `Shortage ${formatCurrency(cashDiscrepancy)}`}
                      </span>
                    </div>
                  </div>

                  {/* Notes & Cashier Sign-off */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                      Cashier Closing Notes & Operational Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      placeholder="Note any discrepancies, damaged notes, or special register incidents during the shift..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">
                      Logged in as: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name}</strong>
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Complete EOD & Generate Z-Report</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* History View */
                <div className="space-y-4">
                  {endOfDayReports.length === 0 ? (
                    <div className="p-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <History className="h-10 w-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        No End of Day Z-Reports saved yet
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Complete your first EOD cash register reconciliation to archive permanent Z-Report audit logs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {endOfDayReports.map((rep) => (
                        <div
                          key={rep.id}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-500/50 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                                {rep.reportNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  rep.status === "Balanced"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : rep.status === "Over"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                              >
                                {rep.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Cashier: <strong className="text-slate-800 dark:text-slate-100">{rep.cashierName}</strong> &bull; Date: {rep.date} ({new Date(rep.closedAt).toLocaleTimeString()})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Gross Rev: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(rep.totalGrossRevenue)}</strong> &bull; Cash Discrepancy: {formatCurrency(rep.cashDiscrepancy)}
                            </p>
                          </div>

                          <button
                            onClick={() => setPreviewReport(rep)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>View / Print Z-Report</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

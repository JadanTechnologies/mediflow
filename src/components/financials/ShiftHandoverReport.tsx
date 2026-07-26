import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  Clock,
  User,
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Save,
  RotateCcw,
  Package,
  ArrowRightLeft,
  Calendar,
  FileText,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Receipt,
  Coins,
} from "lucide-react";

export const ShiftHandoverReport: React.FC = () => {
  const {
    sales,
    financials,
    auditLogs,
    systemUsers,
    currentUser,
    currentBranch,
    formatCurrency,
    addAuditLog,
    addFinancialRecord,
  } = usePharmacy();

  // Selected User for shift report
  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || systemUsers[0]?.id || "usr-1"
  );

  // Shift Window
  const [shiftPeriod, setShiftPeriod] = useState<"ACTIVE" | "MORNING" | "EVENING" | "NIGHT" | "FULL_DAY">("ACTIVE");

  // Cash Register State
  const [startingFloat, setStartingFloat] = useState<number>(5000);
  const [physicalCashInput, setPhysicalCashInput] = useState<string>("");
  const [showDenominations, setShowDenominations] = useState<boolean>(false);
  
  // Denomination counter state
  const [notes1000, setNotes1000] = useState<number>(0);
  const [notes500, setNotes500] = useState<number>(0);
  const [notes200, setNotes200] = useState<number>(0);
  const [notes100, setNotes100] = useState<number>(0);
  const [notes50, setNotes50] = useState<number>(0);
  const [smallCoins, setSmallCoins] = useState<number>(0);

  // Handover Memos and Verification
  const [handoverNotes, setHandoverNotes] = useState<string>("");
  const [receivingStaffId, setReceivingStaffId] = useState<string>(
    systemUsers.find((u) => u.id !== selectedUserId)?.id || systemUsers[0]?.id || ""
  );
  const [managerSignature, setManagerSignature] = useState<string>("");
  const [discrepancyReason, setDiscrepancyReason] = useState<string>("");

  // Handover Status
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  // Selected User Object
  const targetUser = systemUsers.find((u) => u.id === selectedUserId) || currentUser || systemUsers[0];
  const targetUserName = targetUser?.name || "Staff Member";

  // Filter Sales for selected user and shift
  const shiftSales = sales.filter((sale) => {
    // Match cashier name or user name
    const matchesUser =
      sale.cashierName.toLowerCase().includes(targetUserName.toLowerCase()) ||
      targetUserName.toLowerCase().includes(sale.cashierName.toLowerCase()) ||
      sale.branchId === currentBranch.id;

    if (!matchesUser) return false;

    // Filter by shift period timestamp if needed
    if (shiftPeriod === "ACTIVE" || shiftPeriod === "FULL_DAY") {
      return true; // Show all today's / active shift sales
    }

    return true;
  });

  // Shift Sales Breakdown
  const totalSalesCount = shiftSales.length;
  const grossSalesTotal = shiftSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);

  // Payment Breakdown
  const cashSales = shiftSales
    .filter((s) => s.paymentMethod === "Cash")
    .reduce((acc, s) => acc + (s.grandTotal || 0), 0);

  const cardSales = shiftSales
    .filter((s) => s.paymentMethod === "Card")
    .reduce((acc, s) => acc + (s.grandTotal || 0), 0);

  const walletSales = shiftSales
    .filter((s) => s.paymentMethod === "Digital Wallet")
    .reduce((acc, s) => acc + (s.grandTotal || 0), 0);

  const insuranceSales = shiftSales
    .filter((s) => s.paymentMethod === "Insurance")
    .reduce((acc, s) => acc + (s.grandTotal || 0), 0);

  const splitSales = shiftSales.filter((s) => s.paymentMethod === "Split");
  const splitCashPart = splitSales.reduce(
    (acc, s) => acc + (s.paymentDetails?.cashPaid || 0),
    0
  );
  const splitCardPart = splitSales.reduce(
    (acc, s) => acc + (s.paymentDetails?.cardPaid || 0),
    0
  );

  const totalCashCollected = cashSales + splitCashPart;
  const totalCardCollected = cardSales + splitCardPart;

  // Expenses recorded by this user in shift
  const shiftExpenses = financials.filter(
    (f) =>
      f.type === "Expense" || f.type === "Payroll" || f.type === "Refund"
  );
  const totalCashExpenses = shiftExpenses
    .filter((f) => f.paymentMethod.toLowerCase().includes("cash"))
    .reduce((acc, f) => acc + f.amount, 0);

  // Expected Cash Calculation
  const expectedCashInDrawer = startingFloat + totalCashCollected - totalCashExpenses;

  // Calculated physical cash from denomination counter if enabled
  const calculatedFromNotes =
    notes1000 * 1000 +
    notes500 * 500 +
    notes200 * 200 +
    notes100 * 100 +
    notes50 * 50 +
    smallCoins;

  const actualPhysicalCash = physicalCashInput !== ""
    ? parseFloat(physicalCashInput) || 0
    : calculatedFromNotes;

  const cashVariance = actualPhysicalCash - expectedCashInDrawer;

  // Items dispensed in shift
  const totalItemsDispensed = shiftSales.reduce((acc, s) => {
    return acc + (s.items?.reduce((iAcc, item) => iAcc + (item.quantity || 0), 0) || 0);
  }, 0);

  // Shift Audit Logs / Inventory Adjustments
  const shiftAuditLogs = auditLogs.filter(
    (log) =>
      log.userName.toLowerCase().includes(targetUserName.toLowerCase()) ||
      log.action.includes("Inventory") ||
      log.action.includes("Stock") ||
      log.action.includes("Controlled")
  );

  // Handle Note Counting Sync
  const applyDenominationTotal = () => {
    setPhysicalCashInput(calculatedFromNotes.toString());
  };

  const handleClearDenominations = () => {
    setNotes1000(0);
    setNotes500(0);
    setNotes200(0);
    setNotes100(0);
    setNotes50(0);
    setSmallCoins(0);
  };

  const handleSubmitHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleString();
    addAuditLog(
      "Shift Handover Closed",
      `User ${targetUserName} closed shift. Expected Cash: ${expectedCashInDrawer}, Actual Cash: ${actualPhysicalCash}, Variance: ${cashVariance}. Handover to: ${
        systemUsers.find((u) => u.id === receivingStaffId)?.name || "Staff"
      }`
    );

    setIsSubmitted(true);
    setSubmittedAt(timestamp);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Shift Handover & Register Reconciliation
                </h2>
                {isSubmitted ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Handover Submitted
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-extrabold flex items-center gap-1 border border-amber-500/20">
                    <Clock className="h-3 w-3" />
                    Shift Active (Open)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Summarize cash drawer totals, sales transactions, payment channels, and inventory adjustments before passing control.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="h-4 w-4 text-emerald-400" />
              <span>Print Handover Slip</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
              Select Shift Staff Member
            </label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setIsSubmitted(false);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 pr-8"
              >
                {systemUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.roleName}) - {user.branchName}
                  </option>
                ))}
              </select>
              <User className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
              Shift Time Window
            </label>
            <select
              value={shiftPeriod}
              onChange={(e) => setShiftPeriod(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="ACTIVE">Today Active Shift (Current Logged-in Session)</option>
              <option value="MORNING">Morning Shift (08:00 AM - 04:00 PM)</option>
              <option value="EVENING">Evening Shift (04:00 PM - 12:00 AM)</option>
              <option value="NIGHT">Night Shift (12:00 AM - 08:00 AM)</option>
              <option value="FULL_DAY">Full 24-Hour Cycle</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
              Pharmacy Terminal / Branch
            </label>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="truncate">{currentBranch.name}</span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md shrink-0">
                POS-01
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Status Banner */}
      {isSubmitted && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm">
                Shift Handover Successfully Signed Off & Submitted
              </p>
              <p className="text-[11px] opacity-90">
                Closed at {submittedAt} by {targetUserName}. Audit record generated.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-3 py-1.5 rounded-xl bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold text-[11px]"
          >
            Re-Open Shift View
          </button>
        </div>
      )}

      {/* KPI Cards Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shift Sales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Shift Revenue</span>
            <Receipt className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(grossSalesTotal)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            {totalSalesCount} Completed Invoices
          </div>
        </div>

        {/* Total Cash Collected */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Collected</span>
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCashCollected)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            From Cash & Split Cash Payments
          </div>
        </div>

        {/* Expected Cash in Drawer */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Expected Drawer Cash</span>
            <Calculator className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(expectedCashInDrawer)}
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Float ({formatCurrency(startingFloat)}) + Cash Net
          </div>
        </div>

        {/* Stock Movement */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Dispensed Units</span>
            <Package className="h-5 w-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {totalItemsDispensed} Units
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Across {totalSalesCount} customer orders
          </div>
        </div>
      </div>

      {/* Main Reconciliation & Payment Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Cash Drawer Reconciliation Form */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                Cash Drawer Physical Reconciliation
              </h3>
            </div>
            <button
              onClick={() => setShowDenominations(!showDenominations)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 print:hidden"
            >
              {showDenominations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{showDenominations ? "Hide Bill Counter" : "Open Bill Counter"}</span>
            </button>
          </div>

          {/* Cash Ledger Breakdown */}
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Starting Float (Opening Cash)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">+</span>
                  <input
                    type="number"
                    value={startingFloat}
                    onChange={(e) => setStartingFloat(parseFloat(e.target.value) || 0)}
                    className="w-28 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Cash Collected from Sales
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatCurrency(totalCashCollected)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  Cash Paid Out (Petty Expenses / Refunds)
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  - {formatCurrency(totalCashExpenses)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm font-extrabold">
                <span className="text-slate-900 dark:text-slate-100">
                  Expected Closing Cash in Drawer
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(expectedCashInDrawer)}
                </span>
              </div>
            </div>

            {/* Optional Currency Denomination Note Counter */}
            {showDenominations && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3 animate-in fade-in duration-200 print:hidden">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                    <Coins className="h-4 w-4" />
                    <span>Currency Note & Coin Counter</span>
                  </h4>
                  <button
                    onClick={handleClearDenominations}
                    className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Notes
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      1,000 Notes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={notes1000}
                      onChange={(e) => setNotes1000(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      500 Notes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={notes500}
                      onChange={(e) => setNotes500(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      200 Notes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={notes200}
                      onChange={(e) => setNotes200(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      100 Notes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={notes100}
                      onChange={(e) => setNotes100(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      50 Notes
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={notes50}
                      onChange={(e) => setNotes50(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Small Coins / Loose Change
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={smallCoins}
                      onChange={(e) => setSmallCoins(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-900">
                  <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                    Counted Bill Total: {formatCurrency(calculatedFromNotes)}
                  </span>
                  <button
                    type="button"
                    onClick={applyDenominationTotal}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                  >
                    Apply as Physical Count
                  </button>
                </div>
              </div>
            )}

            {/* Actual Physical Cash Counted Input */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-900 dark:text-slate-100 block">
                Actual Physical Cash Counted in Drawer
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder={`e.g. ${expectedCashInDrawer}`}
                  value={physicalCashInput}
                  onChange={(e) => setPhysicalCashInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-blue-600/40 focus:border-blue-600 rounded-2xl font-mono font-black text-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Cash Variance Box */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all ${
                cashVariance === 0
                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : cashVariance > 0
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                  : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {cashVariance === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : cashVariance > 0 ? (
                  <TrendingUp className="h-5 w-5 text-blue-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-extrabold text-sm">
                    {cashVariance === 0
                      ? "Register Balanced (Perfect Cash Match)"
                      : cashVariance > 0
                      ? `Excess Cash Surplus (+${formatCurrency(cashVariance)})`
                      : `Cash Discrepancy Shortage (-${formatCurrency(Math.abs(cashVariance))})`}
                  </div>
                  <p className="text-[11px] opacity-80 font-normal">
                    {cashVariance === 0
                      ? "Physical drawer match matches expected register total exactly."
                      : cashVariance > 0
                      ? "Physical cash exceeds calculated expectations."
                      : "Physical cash is less than expected sales calculation. Explanation required."}
                  </p>
                </div>
              </div>

              <div className="font-mono text-base font-black shrink-0">
                {cashVariance > 0 ? `+${formatCurrency(cashVariance)}` : formatCurrency(cashVariance)}
              </div>
            </div>

            {/* Discrepancy Note if Shortage or Surplus */}
            {cashVariance !== 0 && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Discrepancy Explanation Memo
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unrecorded change variance or unlogged refund..."
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Non-Cash Channels & Handover Sign-Off Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Payment Method Breakdown Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <span>Shift Payment Channels Breakdown</span>
            </h3>

            <div className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Cash Collections</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(totalCashCollected)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${grossSalesTotal > 0 ? Math.min(100, (totalCashCollected / grossSalesTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Card / POS Terminal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(totalCardCollected)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{
                      width: `${grossSalesTotal > 0 ? Math.min(100, (totalCardCollected / grossSalesTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Digital Wallet & Mobile</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(walletSales)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{
                      width: `${grossSalesTotal > 0 ? Math.min(100, (walletSales / grossSalesTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Health Insurance Claims</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(insuranceSales)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${grossSalesTotal > 0 ? Math.min(100, (insuranceSales / grossSalesTotal) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sign-Off & Verification Form */}
          <form
            onSubmit={handleSubmitHandover}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden"
          >
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Shift Handover Verification & Sign-off</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Receiving / Incoming Staff Member
                </label>
                <select
                  value={receivingStaffId}
                  onChange={(e) => setReceivingStaffId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Shift Handover Memos & Fridge Temp Verification
                </label>
                <textarea
                  rows={3}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. Vaccine cold chain checked at 3°C. 2 controlled drug prescriptions verified in safe ledger..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Supervisor Verification Signature / PIN
                </label>
                <input
                  type="password"
                  placeholder="Enter Manager PIN for sign-off..."
                  value={managerSignature}
                  onChange={(e) => setManagerSignature(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>Submit & Close Shift Handover</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Shift Sales Transactions & Inventory Adjustments Log Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Transactions in Shift */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <span>Shift Transactions ({shiftSales.length})</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              {formatCurrency(grossSalesTotal)}
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Items</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shiftSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No sales logged during this shift window.
                    </td>
                  </tr>
                ) : (
                  shiftSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {sale.invoiceNumber}
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {sale.items?.length || 0} items
                      </td>
                      <td className="p-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Adjustments & Stock Movement in Shift */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <span>Shift Inventory & Stock Adjustments</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">Audit Trail</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
            {shiftAuditLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No special inventory adjustments logged during this shift.
              </div>
            ) : (
              shiftAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SHIFT HANDOVER THERMAL / A4 RECEIPT SHEET */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 text-slate-900 text-xs font-sans space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
          <h1 className="text-xl font-black tracking-wider uppercase">{currentBranch.name}</h1>
          <p className="text-xs font-bold uppercase tracking-widest">OFFICIAL SHIFT HANDOVER & CASH RECONCILIATION SLIP</p>
          <p className="text-[10px] font-mono">Date & Time: {new Date().toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-bold border-b border-slate-300 pb-3">
          <div>
            <p>Outgoing Staff: {targetUserName} ({targetUser?.roleName})</p>
            <p>Shift Window: {shiftPeriod}</p>
            <p>Terminal: POS-01 ({currentBranch.code})</p>
          </div>
          <div className="text-right">
            <p>Receiving Staff: {systemUsers.find((u) => u.id === receivingStaffId)?.name || "Pending"}</p>
            <p>Status: {isSubmitted ? "SUBMITTED & VERIFIED" : "ACTIVE / OPEN"}</p>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="space-y-2 border-b border-slate-300 pb-3">
          <h3 className="font-black uppercase text-sm border-b pb-1">Register Cash Ledger</h3>
          <div className="flex justify-between">
            <span>Starting Float:</span>
            <span className="font-mono font-bold">{formatCurrency(startingFloat)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Sales Collected:</span>
            <span className="font-mono font-bold">+ {formatCurrency(totalCashCollected)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Expenses / Payouts:</span>
            <span className="font-mono font-bold">- {formatCurrency(totalCashExpenses)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm border-t pt-1">
            <span>Expected Drawer Cash:</span>
            <span className="font-mono">{formatCurrency(expectedCashInDrawer)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm">
            <span>Actual Physical Cash Counted:</span>
            <span className="font-mono">{formatCurrency(actualPhysicalCash)}</span>
          </div>
          <div className="flex justify-between font-black text-sm border-t pt-1">
            <span>Variance / Discrepancy:</span>
            <span className="font-mono">{cashVariance > 0 ? `+${formatCurrency(cashVariance)}` : formatCurrency(cashVariance)}</span>
          </div>
        </div>

        {/* Non-Cash Channels */}
        <div className="space-y-1 border-b border-slate-300 pb-3">
          <h3 className="font-black uppercase text-sm border-b pb-1">Non-Cash Payment Summary</h3>
          <div className="flex justify-between">
            <span>Card / POS Total:</span>
            <span className="font-mono">{formatCurrency(totalCardCollected)}</span>
          </div>
          <div className="flex justify-between">
            <span>Digital Wallet:</span>
            <span className="font-mono">{formatCurrency(walletSales)}</span>
          </div>
          <div className="flex justify-between">
            <span>Insurance Claims:</span>
            <span className="font-mono">{formatCurrency(insuranceSales)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-1">
            <span>Gross Sales Total:</span>
            <span className="font-mono">{formatCurrency(grossSalesTotal)}</span>
          </div>
        </div>

        {/* Memos & Signatures */}
        {handoverNotes && (
          <div className="border-b border-slate-300 pb-3">
            <h4 className="font-bold uppercase text-xs">Handover Memos:</h4>
            <p className="italic text-slate-700">{handoverNotes}</p>
          </div>
        )}

        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold">
          <div className="border-t border-slate-900 pt-2">
            <p>Outgoing Staff Signature</p>
            <p className="text-[10px] font-normal text-slate-500">{targetUserName}</p>
          </div>
          <div className="border-t border-slate-900 pt-2">
            <p>Supervisor / Manager Verification</p>
            <p className="text-[10px] font-normal text-slate-500">Authorized Signature & Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

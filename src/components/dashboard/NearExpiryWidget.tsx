import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  Tag,
  ArrowRightLeft,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Package,
  DollarSign,
  TrendingDown,
  Filter,
  Eye,
  Percent,
  X,
  FileCheck,
  Building2,
} from "lucide-react";

export interface NearExpiryItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  location: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  daysRemaining: number;
  bracket: "EXPIRED" | "30_DAYS" | "60_DAYS" | "90_DAYS" | "SAFE";
}

export const NearExpiryWidget: React.FC = () => {
  const { medicines, formatCurrency, addAuditLog, setActiveTab } = usePharmacy();

  const [activeBracket, setActiveBracket] = useState<"ALL" | "30_DAYS" | "60_DAYS" | "90_DAYS" | "EXPIRED">("ALL");
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedTime, setLastScannedTime] = useState<string>("Today at 08:00 AM");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  
  // Action Modal State
  const [discountModalItem, setDiscountModalItem] = useState<NearExpiryItem | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number>(30);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Parse Today's Timestamp
  const today = new Date();
  const todayMs = today.getTime();

  // Daily Scan Logic - Extract all batches across inventory
  const allExpiryItems: NearExpiryItem[] = [];

  medicines.forEach((med) => {
    if (med.batches && med.batches.length > 0) {
      med.batches.forEach((batch) => {
        const expMs = new Date(batch.expiryDate).getTime();
        const diffDays = Math.ceil((expMs - todayMs) / (1000 * 3600 * 24));

        let bracket: NearExpiryItem["bracket"] = "SAFE";
        if (diffDays <= 0) {
          bracket = "EXPIRED";
        } else if (diffDays <= 30) {
          bracket = "30_DAYS";
        } else if (diffDays <= 60) {
          bracket = "60_DAYS";
        } else if (diffDays <= 90) {
          bracket = "90_DAYS";
        }

        if (bracket !== "SAFE") {
          allExpiryItems.push({
            medicineId: med.id,
            medicineName: med.name,
            genericName: med.genericName,
            category: med.category,
            location: med.location || "Main Store",
            batchNumber: batch.batchNumber,
            mfgDate: batch.mfgDate,
            expiryDate: batch.expiryDate,
            quantity: batch.quantity,
            purchasePrice: batch.purchasePrice,
            sellingPrice: batch.sellingPrice,
            daysRemaining: diffDays,
            bracket,
          });
        }
      });
    }
  });

  // Calculate Sub-totals
  const items30 = allExpiryItems.filter((i) => i.bracket === "30_DAYS");
  const items60 = allExpiryItems.filter((i) => i.bracket === "60_DAYS");
  const items90 = allExpiryItems.filter((i) => i.bracket === "90_DAYS");
  const itemsExpired = allExpiryItems.filter((i) => i.bracket === "EXPIRED");

  const value30 = items30.reduce((acc, i) => acc + i.quantity * i.purchasePrice, 0);
  const value60 = items60.reduce((acc, i) => acc + i.quantity * i.purchasePrice, 0);
  const value90 = items90.reduce((acc, i) => acc + i.quantity * i.purchasePrice, 0);
  const valueExpired = itemsExpired.reduce((acc, i) => acc + i.quantity * i.purchasePrice, 0);

  // Filtered List
  const filteredItems = allExpiryItems.filter((item) => {
    if (activeBracket === "30_DAYS" && item.bracket !== "30_DAYS") return false;
    if (activeBracket === "60_DAYS" && item.bracket !== "60_DAYS") return false;
    if (activeBracket === "90_DAYS" && item.bracket !== "90_DAYS") return false;
    if (activeBracket === "EXPIRED" && item.bracket !== "EXPIRED") return false;

    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;

    return true;
  });

  // Unique Categories
  const categoriesList = Array.from(new Set(allExpiryItems.map((i) => i.category)));

  // Manual Trigger Daily Scan
  const handleRunDailyScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const timeStr = `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setLastScannedTime(timeStr);
      setActionSuccessMessage(`Daily Inventory Scan Completed (${timeStr}). Identified ${allExpiryItems.length} items requiring attention.`);
      addAuditLog("Inventory Daily Scan", `Scanned full database. Found ${items30.length} items <=30d, ${items60.length} items <=60d, ${items90.length} items <=90d, ${itemsExpired.length} expired.`);
    }, 600);
  };

  // Apply Discount Handler
  const handleApplyClearanceDiscount = (item: NearExpiryItem) => {
    addAuditLog(
      "Clearance Discount Applied",
      `Applied ${customDiscount}% clearance discount on ${item.medicineName} (Batch ${item.batchNumber}) expiring in ${item.daysRemaining} days.`
    );
    setActionSuccessMessage(`Applied ${customDiscount}% promotional discount to ${item.medicineName} (Batch ${item.batchNumber}).`);
    setDiscountModalItem(null);
  };

  // Return to Supplier Handler
  const handleSupplierReturn = (item: NearExpiryItem) => {
    addAuditLog(
      "Supplier Return Initiated",
      `Initiated return for ${item.quantity} units of ${item.medicineName} (Batch ${item.batchNumber}) expiring in ${item.daysRemaining} days.`
    );
    setActionSuccessMessage(`Return request generated for ${item.medicineName} (Batch ${item.batchNumber}) to supplier.`);
  };

  // Quarantine Handler
  const handleQuarantine = (item: NearExpiryItem) => {
    addAuditLog(
      "Batch Quarantined",
      `Moved ${item.quantity} units of ${item.medicineName} (Batch ${item.batchNumber}) to Quarantine Locker.`
    );
    setActionSuccessMessage(`Moved ${item.medicineName} (Batch ${item.batchNumber}) to Quarantine Locker.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
      {/* Top Banner: Daily Scanner Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Near Expiry Inventory Daily Scan System
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" />
                Auto-Scan Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated daily engine scans batch expiry timelines (30, 60, and 90-day warning tiers) to prevent stock loss.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Last scan: <strong className="text-slate-700 dark:text-slate-200">{lastScannedTime}</strong>
          </span>
          <button
            onClick={handleRunDailyScan}
            disabled={isScanning}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning..." : "Run Daily Scan Now"}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Message Toast */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Expiry Tier Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1: <= 30 Days Critical */}
        <button
          onClick={() => setActiveBracket("30_DAYS")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeBracket === "30_DAYS"
              ? "bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30"
              : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Critical (&le; 30 Days)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[10px]">
              {items30.length} Batches
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(value30)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Urgent sales or clearance required
          </p>
        </button>

        {/* Tier 2: 31-60 Days High Warning */}
        <button
          onClick={() => setActiveBracket("60_DAYS")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeBracket === "60_DAYS"
              ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Warning (31-60 Days)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono font-black text-[10px]">
              {items60.length} Batches
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(value60)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Prioritize FEFO dispensing
          </p>
        </button>

        {/* Tier 3: 61-90 Days Early Notice */}
        <button
          onClick={() => setActiveBracket("90_DAYS")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeBracket === "90_DAYS"
              ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30"
              : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Notice (61-90 Days)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-mono font-black text-[10px]">
              {items90.length} Batches
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(value90)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Supplier return window open
          </p>
        </button>

        {/* Tier 4: Expired Items */}
        <button
          onClick={() => setActiveBracket("EXPIRED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeBracket === "EXPIRED"
              ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-800"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <span>Expired (Quarantine)</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-white font-mono font-black text-[10px]">
              {itemsExpired.length} Batches
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(valueExpired)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Do not dispense under any case
          </p>
        </button>
      </div>

      {/* Filter Toggles & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Bracket Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveBracket("ALL")}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              activeBracket === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            All Alerts ({allExpiryItems.length})
          </button>
          <button
            onClick={() => setActiveBracket("30_DAYS")}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              activeBracket === "30_DAYS"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            30 Days ({items30.length})
          </button>
          <button
            onClick={() => setActiveBracket("60_DAYS")}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              activeBracket === "60_DAYS"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            60 Days ({items60.length})
          </button>
          <button
            onClick={() => setActiveBracket("90_DAYS")}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              activeBracket === "90_DAYS"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            90 Days ({items90.length})
          </button>
          <button
            onClick={() => setActiveBracket("EXPIRED")}
            className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
              activeBracket === "EXPIRED"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Expired ({itemsExpired.length})
          </button>
        </div>

        {/* Category Filter */}
        {categoriesList.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Near Expiry Items Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-3">Medication & Generic Name</th>
              <th className="p-3">Batch & Shelf</th>
              <th className="p-3">Expiry Date & Timeline</th>
              <th className="p-3">Stock Units</th>
              <th className="p-3 text-right">Value at Risk</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    No near-expiry inventory matching this tier.
                  </p>
                  <p className="text-xs text-slate-400">All medications in this view have optimal expiration dates.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => (
                <tr key={`${item.medicineId}-${item.batchNumber}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {item.medicineName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.genericName} • <span className="italic">{item.category}</span>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.batchNumber}
                    </span>
                    <p className="text-[10px] text-slate-400">{item.location}</p>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.expiryDate}
                      </span>
                      {item.bracket === "EXPIRED" && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-rose-400 font-black text-[10px]">
                          EXPIRED
                        </span>
                      )}
                      {item.bracket === "30_DAYS" && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[10px] animate-pulse">
                          In {item.daysRemaining} days
                        </span>
                      )}
                      {item.bracket === "60_DAYS" && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[10px]">
                          In {item.daysRemaining} days
                        </span>
                      )}
                      {item.bracket === "90_DAYS" && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white font-bold text-[10px]">
                          In {item.daysRemaining} days
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 font-bold font-mono text-slate-800 dark:text-slate-200">
                    {item.quantity} units
                  </td>

                  <td className="p-3 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.quantity * item.purchasePrice)}
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {item.bracket !== "EXPIRED" ? (
                        <>
                          <button
                            onClick={() => setDiscountModalItem(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Mark for Promotional Clearance Sale"
                          >
                            <Tag className="h-3 w-3" />
                            <span>Discount</span>
                          </button>

                          <button
                            onClick={() => handleSupplierReturn(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center gap-1 transition-all"
                            title="Initiate Return to Supplier"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            <span>Return</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleQuarantine(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Move to Quarantine Cabinet"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          <span>Quarantine</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Clearance Discount Modal */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Tag className="h-5 w-5" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  Apply Clearance Discount
                </h3>
              </div>
              <button
                onClick={() => setDiscountModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {discountModalItem.medicineName}
                </p>
                <p className="text-slate-500">
                  Batch: <strong className="font-mono text-slate-800 dark:text-slate-200">{discountModalItem.batchNumber}</strong> | Expiry: {discountModalItem.expiryDate} ({discountModalItem.daysRemaining} days left)
                </p>
                <p className="text-slate-500">
                  Stock Units: {discountModalItem.quantity} | Original Selling Price: {formatCurrency(discountModalItem.sellingPrice)}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Clearance Discount Percentage
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[15, 25, 40, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCustomDiscount(pct)}
                      className={`p-2 rounded-xl font-bold border transition-all ${
                        customDiscount === pct
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold">Custom %:</span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(parseInt(e.target.value) || 0)}
                    className="w-24 p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>New Clearance Selling Price:</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(discountModalItem.sellingPrice * (1 - customDiscount / 100))}
                  </span>
                </div>
                <p className="text-[10px] opacity-80">
                  This discount tag will prioritize fast dispensing at the POS terminal before expiration.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDiscountModalItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyClearanceDiscount(discountModalItem)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Confirm Clearance Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

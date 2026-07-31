import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PosSale } from "../../types/pharmacy";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import {
  History,
  X,
  Search,
  Printer,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Calendar,
  Sparkles,
  Layers,
  ShoppingBag,
  Filter,
} from "lucide-react";

interface RecentTransactionsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sales: PosSale[];
  onSelectSaleForReprint: (sale: PosSale) => void;
  formatCurrency: (val: number) => string;
}

export const RecentTransactionsSidebar: React.FC<RecentTransactionsSidebarProps> = ({
  isOpen,
  onClose,
  sales,
  onSelectSaleForReprint,
  formatCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Shift Statistics
  const shiftMetrics = useMemo(() => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((acc, curr) => acc + (curr.grandTotal || 0), 0);
    const cashTotal = sales
      .filter((s) => s.paymentMethod === "Cash")
      .reduce((acc, curr) => acc + curr.grandTotal, 0);
    const cardTotal = sales
      .filter((s) => s.paymentMethod === "Card")
      .reduce((acc, curr) => acc + curr.grandTotal, 0);
    const digitalTotal = sales
      .filter((s) => s.paymentMethod === "Digital Wallet")
      .reduce((acc, curr) => acc + curr.grandTotal, 0);
    const splitTotal = sales
      .filter((s) => s.paymentMethod === "Split")
      .reduce((acc, curr) => acc + curr.grandTotal, 0);
    const creditTotal = sales
      .filter((s) => s.paymentMethod === "Credit / Account")
      .reduce((acc, curr) => acc + curr.grandTotal, 0);

    return {
      totalSales,
      totalRevenue,
      cashTotal,
      cardTotal,
      digitalTotal,
      splitTotal,
      creditTotal,
    };
  }, [sales]);

  // Filtered sales list
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Payment filter
      if (paymentFilter !== "ALL" && sale.paymentMethod !== paymentFilter) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchInvoice = sale.invoiceNumber?.toLowerCase().includes(q);
      const matchCustomer = sale.customerName?.toLowerCase().includes(q);
      const matchCashier = sale.cashierName?.toLowerCase().includes(q);
      const matchItem = sale.items?.some(
        (i) =>
          i.medicineName?.toLowerCase().includes(q) ||
          i.genericName?.toLowerCase().includes(q)
      );
      return matchInvoice || matchCustomer || matchCashier || matchItem;
    });
  }, [sales, searchQuery, paymentFilter]);

  const handleCopyInvoice = (invoiceNum: string, saleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(invoiceNum);
    setCopiedInvoiceId(saleId);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const getPaymentBadgeStyle = (method: string) => {
    switch (method) {
      case "Cash":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Card":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Digital Wallet":
      case "Deposit Wallet":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "Credit / Account":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Split":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "Insurance":
        return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
        {/* Backdrop click to dismiss */}
        <div className="flex-1" onClick={onClose} />

        {/* Sidebar Container */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col z-10 printable-modal-content"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Current Shift Receipts</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold">
                    {sales.length} Sales
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Quick view, filter & re-print shift transactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModalHeaderPrintButton size="sm" title="Print Shift Summary Log" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Shift Metrics Bar */}
          <div className="p-3 bg-blue-900 text-white border-b border-blue-950 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-200">
                Shift Sales Total
              </span>
              <span className="font-mono text-base font-extrabold text-white">
                {formatCurrency(shiftMetrics.totalRevenue)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1 border-t border-blue-800/60">
              <div className="bg-blue-950/60 p-1.5 rounded-lg border border-blue-800/40">
                <span className="text-blue-300 block text-[9px]">Cash:</span>
                <span className="font-mono font-bold">{formatCurrency(shiftMetrics.cashTotal)}</span>
              </div>
              <div className="bg-blue-950/60 p-1.5 rounded-lg border border-blue-800/40">
                <span className="text-blue-300 block text-[9px]">Card/POS:</span>
                <span className="font-mono font-bold">{formatCurrency(shiftMetrics.cardTotal)}</span>
              </div>
              <div className="bg-blue-950/60 p-1.5 rounded-lg border border-blue-800/40">
                <span className="text-blue-300 block text-[9px]">Digital/Wallet:</span>
                <span className="font-mono font-bold">{formatCurrency(shiftMetrics.digitalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Options */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, patient, item name..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Payment Method Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              <span className="text-slate-400 shrink-0 font-bold flex items-center gap-0.5 mr-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {["ALL", "Cash", "Card", "Digital Wallet", "Insurance", "Deposit Wallet", "Credit / Account", "Split"].map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentFilter(m)}
                    className={`px-2 py-0.5 rounded-lg shrink-0 font-medium transition-colors border ${
                      paymentFilter === m
                        ? "bg-blue-600 text-white font-bold border-blue-600"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    {m === "ALL" ? "All Methods" : m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredSales.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No matching shift transactions found
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {searchQuery || paymentFilter !== "ALL"
                      ? "Try clearing search keywords or payment filters."
                      : "Complete sales in POS to build shift history."}
                  </p>
                </div>
              </div>
            ) : (
              filteredSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const isCopied = copiedInvoiceId === sale.id;

                return (
                  <div
                    key={sale.id}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-blue-500/40 transition-all space-y-2.5"
                  >
                    {/* Main Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            {sale.invoiceNumber}
                            <button
                              type="button"
                              onClick={(e) => handleCopyInvoice(sale.invoiceNumber, sale.id, e)}
                              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 transition-colors"
                              title="Copy invoice number"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentBadgeStyle(
                              sale.paymentMethod
                            )}`}
                          >
                            {sale.paymentMethod}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-semibold truncate">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sale.customerName || "Walk-in Patient"}</span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(sale.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>• {sale.items.length} items</span>
                          <span>• Cashier: {sale.cashierName || "Staff"}</span>
                        </div>
                      </div>

                      {/* Right Amount & Actions */}
                      <div className="flex flex-col items-end justify-between shrink-0 space-y-1.5">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(sale.grandTotal)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectSaleForReprint(sale)}
                            className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            title="Quick Re-print Receipt"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Re-print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            title={isExpanded ? "Hide items" : "Show items detail"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Items Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs"
                      >
                        <div className="font-bold text-[10px] uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>Purchased Items ({sale.items.length})</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2 space-y-1.5 border border-slate-100 dark:border-slate-800">
                          {sale.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] border-b border-slate-200/40 dark:border-slate-800 last:border-0 pb-1 last:pb-0"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                  {item.medicineName}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.genericName} {item.dosageForm ? `• ${item.dosageForm}` : ""}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono text-slate-600 dark:text-slate-400">
                                  {item.quantity} {item.selectedUnit || "unit"} × {formatCurrency(item.unitPrice)}
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Breakdown info */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span>Subtotal: {formatCurrency(sale.subtotal)}</span>
                          {sale.totalDiscount > 0 && (
                            <span className="text-amber-600">
                              Discount: -{formatCurrency(sale.totalDiscount)}
                            </span>
                          )}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Grand Total: {formatCurrency(sale.grandTotal)}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span>Shift Active • {sales.length} Receipts</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Close Panel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

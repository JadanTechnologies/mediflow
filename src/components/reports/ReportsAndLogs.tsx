import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  FileText,
  Download,
  Printer,
  Search,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Building2,
  Percent,
} from "lucide-react";

export const ReportsAndLogs: React.FC = () => {
  const { sales, medicines, auditLogs, formatCurrency, currentBranch } = usePharmacy();
  const [reportType, setReportType] = useState<"SALES" | "INVENTORY" | "AUDIT">("SALES");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("ALL");

  // Selected invoice for detail modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Filter Sales Data
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = paymentFilter === "ALL" || s.paymentMethod === paymentFilter;

    let matchesDate = true;
    if (dateFilter !== "ALL") {
      const saleDate = new Date(s.date);
      const now = new Date();
      if (dateFilter === "TODAY") {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === "WEEK") {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = saleDate >= oneWeekAgo;
      } else if (dateFilter === "MONTH") {
        matchesDate =
          saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesPayment && matchesDate;
  });

  // Calculate Sales Summary Metrics
  const salesTotals = (filteredSales || []).reduce(
    (acc, s) => {
      // Estimate Cost of Goods Sold from items if available
      let saleCost = 0;
      s.items?.forEach((item) => {
        const med = medicines.find((m) => m.id === item.medicineId);
        const unitCost = med ? (med.purchasePrice || 0) : ((item.unitPrice || 0) * 0.7); // default 30% margin if cost missing
        saleCost += unitCost * (item.quantity || 0);
      });

      acc.totalInvoices += 1;
      acc.totalRevenue += s.grandTotal || 0;
      acc.totalSubtotal += s.subtotal || 0;
      acc.totalTax += s.taxAmount || 0;
      acc.totalDiscount += s.discount || 0;
      acc.totalCost += saleCost;
      acc.totalNetProfit += (s.grandTotal || 0) - saleCost;
      return acc;
    },
    {
      totalInvoices: 0,
      totalRevenue: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalDiscount: 0,
      totalCost: 0,
      totalNetProfit: 0,
    }
  );

  // Filter Stock / Inventory Data
  const filteredMedicines = (medicines || []).filter((m) => {
    const matchesSearch =
      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.genericName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.sku && m.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const stock = m.stock || 0;
    const minStock = m.minStock || 0;

    let matchesStatus = true;
    if (stockStatusFilter === "LOW") matchesStatus = stock <= minStock && stock > 0;
    if (stockStatusFilter === "OUT") matchesStatus = stock === 0;
    if (stockStatusFilter === "HEALTHY") matchesStatus = stock > minStock;

    return matchesSearch && matchesStatus;
  });

  // Calculate Stock Valuation Summary Metrics
  const stockTotals = filteredMedicines.reduce(
    (acc, m) => {
      const stockQty = m.stock || 0;
      const purchasePrice = m.purchasePrice || 0;
      const sellingPrice = m.sellingPrice || 0;

      const totalCostValue = stockQty * purchasePrice;
      const totalSellingValue = stockQty * sellingPrice;
      const potentialProfit = totalSellingValue - totalCostValue;

      acc.totalItems += 1;
      acc.totalQuantity += stockQty;
      acc.totalCostValue += totalCostValue;
      acc.totalSellingValue += totalSellingValue;
      acc.totalPotentialProfit += potentialProfit;
      return acc;
    },
    {
      totalItems: 0,
      totalQuantity: 0,
      totalCostValue: 0,
      totalSellingValue: 0,
      totalPotentialProfit: 0,
    }
  );

  const overallStockMargin =
    stockTotals.totalSellingValue > 0
      ? ((stockTotals.totalPotentialProfit / stockTotals.totalSellingValue) * 100).toFixed(1)
      : "0.0";

  // Filter Audit Logs
  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export CSV Helper
  const handleExportCsv = () => {
    if (reportType === "SALES") {
      const exportData = filteredSales.map((s) => {
        let estCost = 0;
        s.items?.forEach((i) => {
          const med = medicines.find((m) => m.id === i.medicineId);
          estCost += (med ? med.purchasePrice : i.unitPrice * 0.7) * i.quantity;
        });
        return {
          "Invoice Number": s.invoiceNumber,
          Date: s.date,
          "Customer / Patient": s.customerName,
          Cashier: s.cashierName || "Main Cashier",
          "Payment Method": s.paymentMethod,
          "Items Count": s.items?.length || 0,
          "Estimated Cost Price (NGN)": estCost.toFixed(2),
          "Selling Subtotal (NGN)": s.subtotal.toFixed(2),
          "Tax NGN": s.taxAmount.toFixed(2),
          "Discount NGN": (s.discount || 0).toFixed(2),
          "Grand Total (NGN)": s.grandTotal.toFixed(2),
          "Net Profit (NGN)": (s.grandTotal - estCost).toFixed(2),
        };
      });

      // Add Grand Total Row
      exportData.push({
        "Invoice Number": "GRAND TOTALS",
        Date: "-",
        "Customer / Patient": `${salesTotals.totalInvoices} Transactions`,
        Cashier: "-",
        "Payment Method": "-",
        "Items Count": 0,
        "Estimated Cost Price (NGN)": salesTotals.totalCost.toFixed(2),
        "Selling Subtotal (NGN)": salesTotals.totalSubtotal.toFixed(2),
        "Tax NGN": salesTotals.totalTax.toFixed(2),
        "Discount NGN": salesTotals.totalDiscount.toFixed(2),
        "Grand Total (NGN)": salesTotals.totalRevenue.toFixed(2),
        "Net Profit (NGN)": salesTotals.totalNetProfit.toFixed(2),
      });

      downloadCsv(exportData, `mediflow_sales_report_${new Date().toISOString().split("T")[0]}`);
    } else if (reportType === "INVENTORY") {
      const exportData = filteredMedicines.map((m) => {
        const costVal = m.stock * m.purchasePrice;
        const sellVal = m.stock * m.sellingPrice;
        const profit = sellVal - costVal;
        const margin = sellVal > 0 ? ((profit / sellVal) * 100).toFixed(1) : "0.0";
        return {
          SKU: m.sku || m.id,
          "Medicine Name": m.name,
          "Generic Name": m.genericName,
          Category: m.category,
          "Batch #": m.batchNumber || "DEFAULT",
          "Stock Quantity": m.stock,
          "Unit Cost Price (NGN)": m.purchasePrice.toFixed(2),
          "Unit Selling Price (NGN)": m.sellingPrice.toFixed(2),
          "Total Cost Asset Value (NGN)": costVal.toFixed(2),
          "Total Retail Sales Value (NGN)": sellVal.toFixed(2),
          "Potential Profit (NGN)": profit.toFixed(2),
          "Margin %": `${margin}%`,
        };
      });

      // Add Grand Total Row
      exportData.push({
        SKU: "GRAND TOTALS",
        "Medicine Name": `${stockTotals.totalItems} Unique Items`,
        "Generic Name": "-",
        Category: "-",
        "Batch #": "-",
        "Stock Quantity": stockTotals.totalQuantity,
        "Unit Cost Price (NGN)": "-",
        "Unit Selling Price (NGN)": "-",
        "Total Cost Asset Value (NGN)": stockTotals.totalCostValue.toFixed(2),
        "Total Retail Sales Value (NGN)": stockTotals.totalSellingValue.toFixed(2),
        "Potential Profit (NGN)": stockTotals.totalPotentialProfit.toFixed(2),
        "Margin %": `${overallStockMargin}%`,
      });

      downloadCsv(exportData, `mediflow_stock_valuation_report_${new Date().toISOString().split("T")[0]}`);
    } else {
      const exportData = filteredAuditLogs.map((l) => ({
        Timestamp: l.timestamp,
        User: l.userName,
        Role: l.userRole,
        Action: l.action,
        Details: l.details,
      }));
      downloadCsv(exportData, `mediflow_audit_logs_${new Date().toISOString().split("T")[0]}`);
    }
  };

  const downloadCsv = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csvRows = [
      keys.join(","),
      ...data.map((row) =>
        keys
          .map((k) => {
            const val = row[k];
            if (val === null || val === undefined) return '""';
            if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
            return val;
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Printable Header - hidden on screen, visible on print */}
      <div className="hidden print:block p-4 mb-4 border-b">
        <h1 className="text-xl font-bold">MediFlow ERP - Official Financial & Stock Report</h1>
        <p className="text-xs text-slate-600">
          Branch: {currentBranch?.name || "Main Branch"} | Generated: {new Date().toLocaleString()} | Currency: NGN (₦)
        </p>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full inline-block border border-blue-200 dark:border-blue-800">
            COMPLIANCE & FINANCIAL AUDIT LEDGERS
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-1">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Sales & Inventory Valuation Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed itemized sales statements, inventory asset valuation (Cost vs. Selling price), and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Spreadsheet</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
        <div className="flex items-center gap-2">
          {[
            { id: "SALES", label: "Sales & Tax Revenue Report" },
            { id: "INVENTORY", label: "Stock Valuation & Margin Report" },
            { id: "AUDIT", label: "Security Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                reportType === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span>Branch: {currentBranch?.name || "Main Branch"}</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${reportType.toLowerCase()} records...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {reportType === "SALES" && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Filter className="h-3.5 w-3.5 text-purple-600" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">All Payment Types</option>
                <option value="Cash">Cash</option>
                <option value="Card">POS Card</option>
                <option value="Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        )}

        {reportType === "INVENTORY" && (
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Package className="h-3.5 w-3.5 text-amber-600" />
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="HEALTHY">Healthy Stock</option>
                <option value="LOW">Low Stock Warning</option>
                <option value="OUT">Out of Stock</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* KPI METRICS SUMMARY CARDS FOR SALES REPORT */}
      {reportType === "SALES" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Total Sales Revenue</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(salesTotals.totalRevenue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Across {salesTotals.totalInvoices} Invoices
            </p>
          </div>

          {/* Cost of Goods Sold */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Total Cost of Goods</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(salesTotals.totalCost)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Original Procurement Cost</p>
          </div>

          {/* Gross Profit */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Estimated Net Profit</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
              {formatCurrency(salesTotals.totalNetProfit)}
            </p>
            <p className="text-[10px] text-emerald-600 mt-1 font-bold">
              {salesTotals.totalRevenue > 0
                ? `${((salesTotals.totalNetProfit / salesTotals.totalRevenue) * 100).toFixed(1)}% Profit Margin`
                : "0.0% Profit Margin"}
            </p>
          </div>

          {/* Taxes Collected */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Taxes Collected</span>
              <FileText className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(salesTotals.totalTax)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">VAT & Local Healthcare Duties</p>
          </div>
        </div>
      )}

      {/* KPI METRICS SUMMARY CARDS FOR INVENTORY VALUATION REPORT */}
      {reportType === "INVENTORY" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
          {/* Total Cost Value */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Total Inventory Cost</span>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {formatCurrency(stockTotals.totalCostValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Capital Investment in Stock
            </p>
          </div>

          {/* Total Retail Selling Value */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Total Sales Asset Value</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {formatCurrency(stockTotals.totalSellingValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Potential Gross Sales Value
            </p>
          </div>

          {/* Potential Gross Margin */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Projected Gross Margin</span>
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
              {formatCurrency(stockTotals.totalPotentialProfit)}
            </p>
            <p className="text-[10px] text-purple-600 font-bold mt-1">
              {overallStockMargin}% Potential Margin
            </p>
          </div>

          {/* Total Units in Stock */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Total Stock Quantity</span>
              <Package className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {stockTotals.totalQuantity.toLocaleString()} Units
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Across {stockTotals.totalItems} Unique SKUs
            </p>
          </div>
        </div>
      )}

      {/* TABLE CONTENT */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {/* 1. SALES REPORT TABLE */}
          {reportType === "SALES" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Patient / Customer</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-right">Cost Price</th>
                  <th className="p-4 text-right">Selling Subtotal</th>
                  <th className="p-4 text-right">Tax (VAT)</th>
                  <th className="p-4 text-right">Grand Total (₦)</th>
                  <th className="p-4 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No sales records found matching your query or filters.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => {
                    let estCost = 0;
                    s.items?.forEach((i) => {
                      const med = medicines.find((m) => m.id === i.medicineId);
                      estCost += (med ? med.purchasePrice : i.unitPrice * 0.7) * i.quantity;
                    });

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {s.invoiceNumber}
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{s.date}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                          {s.customerName}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">
                          {formatCurrency(estCost)}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(s.subtotal)}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500">
                          {formatCurrency(s.taxAmount)}
                        </td>
                        <td className="p-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(s.grandTotal)}
                        </td>
                        <td className="p-4 text-center print:hidden">
                          <button
                            onClick={() => setSelectedInvoice(s)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors"
                            title="View Invoice Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* GRAND TOTAL SUMMARY ROW */}
              {filteredSales.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    <td className="p-4 uppercase tracking-wider" colSpan={4}>
                      GRAND TOTALS ({salesTotals.totalInvoices} TRANSACTIONS)
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatCurrency(salesTotals.totalCost)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatCurrency(salesTotals.totalSubtotal)}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200">
                      {formatCurrency(salesTotals.totalTax)}
                    </td>
                    <td className="p-4 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(salesTotals.totalRevenue)}
                    </td>
                    <td className="p-4 print:hidden"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 2. INVENTORY & STOCK VALUATION REPORT TABLE */}
          {reportType === "INVENTORY" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">SKU / Code</th>
                  <th className="p-4">Medicine Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Stock Qty</th>
                  <th className="p-4 text-right">Cost Price (₦)</th>
                  <th className="p-4 text-right">Selling Price (₦)</th>
                  <th className="p-4 text-right">Total Cost Value (₦)</th>
                  <th className="p-4 text-right">Total Retail Value (₦)</th>
                  <th className="p-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No inventory records found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m) => {
                    const totalCostVal = m.stock * m.purchasePrice;
                    const totalSellingVal = m.stock * m.sellingPrice;
                    const itemProfit = totalSellingVal - totalCostVal;
                    const margin = totalSellingVal > 0 ? ((itemProfit / totalSellingVal) * 100).toFixed(1) : "0.0";

                    const isLowStock = m.stock <= m.minStock;
                    const isOutOfStock = m.stock === 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-mono text-slate-500">{m.sku || m.id.substring(0, 8)}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                          <div className="text-[10px] text-slate-400">{m.genericName} - {m.dosageForm}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                            {m.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`font-extrabold px-2.5 py-1 rounded-full text-xs ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                : isLowStock
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {m.stock} units
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-300">
                          {formatCurrency(m.purchasePrice)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(m.sellingPrice)}
                        </td>
                        <td className="p-4 text-right font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {formatCurrency(totalCostVal)}
                        </td>
                        <td className="p-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {formatCurrency(totalSellingVal)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                          {margin}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* STOCK VALUATION GRAND TOTAL ROW */}
              {filteredMedicines.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    <td className="p-4 uppercase tracking-wider" colSpan={3}>
                      GRAND TOTALS ({stockTotals.totalItems} SKUS)
                    </td>
                    <td className="p-4 text-center font-mono text-blue-600 font-extrabold">
                      {stockTotals.totalQuantity.toLocaleString()} Units
                    </td>
                    <td className="p-4 text-right font-mono" colSpan={2}>
                      INVENTORY ASSET TOTALS
                    </td>
                    <td className="p-4 text-right font-mono text-base text-blue-600 dark:text-blue-400">
                      {formatCurrency(stockTotals.totalCostValue)}
                    </td>
                    <td className="p-4 text-right font-mono text-base text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(stockTotals.totalSellingValue)}
                    </td>
                    <td className="p-4 text-right font-mono text-purple-600 dark:text-purple-400">
                      {overallStockMargin}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}

          {/* 3. AUDIT LOGS TABLE */}
          {reportType === "AUDIT" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No audit log events found.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono text-slate-500">{log.timestamp}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{log.userName}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ITEMIZE SALE INVOICE DETAIL MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  ITEMIZED SALES INVOICE
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  Invoice {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Name</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Time</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedInvoice.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Payment Method</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Dispensing Cashier</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.cashierName || "Head Cashier"}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Dispensed Line Items
              </h4>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {selectedInvoice.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{item.medicineName}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tax (VAT):</span>
                <span className="font-mono">{formatCurrency(selectedInvoice.taxAmount)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(selectedInvoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  {formatCurrency(selectedInvoice.grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


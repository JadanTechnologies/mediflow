import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { FileText, Download, Printer, Shield, Search } from "lucide-react";

export const ReportsAndLogs: React.FC = () => {
  const { sales, medicines, auditLogs } = usePharmacy();
  const [reportType, setReportType] = useState<"SALES" | "INVENTORY" | "AUDIT">("SALES");

  const exportCsv = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [keys.join(","), ...data.map((row) => keys.map((k) => JSON.stringify(row[k] || "")).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Reports, Audits & Regulatory Compliance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Export compliant sales tax reports, FEFO valuation ledgers, and tamper-evident system audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(sales, "mediflow_sales_report")}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "SALES", label: "Sales & Tax Ledger" },
          { id: "INVENTORY", label: "Valuation & Stock Report" },
          { id: "AUDIT", label: "Security Audit Trail" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === "SALES" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-right">Tax</th>
                  <th className="p-4 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{s.invoiceNumber}</td>
                    <td className="p-4 font-mono">{s.date}</td>
                    <td className="p-4 font-bold">{s.customerName}</td>
                    <td className="p-4 font-semibold">{s.paymentMethod}</td>
                    <td className="p-4 text-right font-mono">${s.taxAmount.toFixed(2)}</td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      ${s.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "INVENTORY" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Medicine SKU</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Purchase Price</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4 text-right">Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {medicines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-bold">{m.name} ({m.genericName})</td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{m.stock} units</td>
                    <td className="p-4 font-mono">${m.purchasePrice.toFixed(2)}</td>
                    <td className="p-4 font-mono">${m.sellingPrice.toFixed(2)}</td>
                    <td className="p-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      ${(m.stock * m.purchasePrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "AUDIT" && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="p-4 font-bold">{log.userName}</td>
                    <td className="p-4 font-semibold text-purple-600">{log.userRole}</td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

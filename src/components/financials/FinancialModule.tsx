import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { TableSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  X
} from "lucide-react";

export const FinancialModule: React.FC = () => {
  const { financials, addFinancialRecord, formatCurrency, isLoading } = usePharmacy();

  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<"Income" | "Expense" | "Payroll">("Expense");
  const [category, setCategory] = useState("Utilities & Cold Chain Power");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(45000);

  if (isLoading) {
    return <TableSkeleton rows={6} cols={5} />;
  }

  const totalIncome = financials
    .filter((f) => f.type === "Income")
    .reduce((acc, f) => acc + f.amount, 0);

  const totalExpenses = financials
    .filter((f) => f.type === "Expense" || f.type === "Payroll")
    .reduce((acc, f) => acc + f.amount, 0);

  const netProfit = totalIncome - totalExpenses;

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    addFinancialRecord({
      type: recordType,
      category,
      description,
      amount,
      paymentMethod: "Bank Transfer",
    });
    setShowAddModal(false);
  };

  return (
    <RbacGuard permission="finance_ledger">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span>Financials, Expenses & Shift Closing</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time P&L summary, operational expense ledgers, payroll logging, and daily register reconciliation.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense / Income</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Income
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>{formatCurrency(totalIncome)}</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Operating Expenses & Payroll
            </span>
            <div className="text-2xl font-extrabold text-rose-600 flex items-center gap-2">
              <TrendingDown className="h-6 w-6" />
              <span>{formatCurrency(totalExpenses)}</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Net Pharmacy Profit
            </span>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <DollarSign className="h-6 w-6" />
              <span>{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Financial Ledger Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Financial Transactions & Expense Ledger
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Recorded By</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {financials.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-medium">{f.date}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                          f.type === "Income"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {f.type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{f.category}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{f.description}</td>
                    <td className="p-4 text-slate-500">{f.recordedBy}</td>
                    <td className={`p-4 text-right font-extrabold ${f.type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {f.type === "Income" ? "+" : "-"}{formatCurrency(f.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Record Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Record Financial Transaction</h3>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="space-y-3">
                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Transaction Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Income">Income (Revenue)</option>
                    <option value="Expense">Expense (Operational)</option>
                    <option value="Payroll">Payroll (Staff Salary)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Electric & Cold Chain Power"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Description / Memo</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Details..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    Save Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RbacGuard>
  );
};

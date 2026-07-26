import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { CustomerPatient } from "../../types/pharmacy";
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  Award,
  Wallet,
  Calendar,
  Phone,
  Mail,
  X,
  UserCheck,
  PiggyBank,
  CreditCard,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export const CustomerPatientModule: React.FC = () => {
  const { customers, addCustomer, addCustomerDeposit, recordCreditPayment, formatCurrency } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<CustomerPatient | null>(null);

  // Deposit Modal State
  const [depositTarget, setDepositTarget] = useState<CustomerPatient | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(5000);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<string>("Cash");
  const [depositNotes, setDepositNotes] = useState<string>("Advance Deposit for Medicine Orders");

  // Debt Settlement Modal State
  const [settleTarget, setSettleTarget] = useState<CustomerPatient | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<string>("Cash");
  const [settleNotes, setSettleNotes] = useState<string>("Debt Repayment");

  // New Patient Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [allergiesText, setAllergiesText] = useState("Penicillin, Sulfa");
  const [insuranceProvider, setInsuranceProvider] = useState("BlueCross");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name,
      phone,
      email,
      age,
      gender,
      allergies: allergiesText.split(",").map((s) => s.trim()),
      insuranceProvider,
    });
    setShowAddModal(false);
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositTarget || depositAmount <= 0) return;
    addCustomerDeposit(depositTarget.id, depositAmount, depositPaymentMethod, depositNotes);
    setDepositTarget(null);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleTarget || settleAmount <= 0) return;
    recordCreditPayment(settleTarget.id, settleAmount, settlePaymentMethod, settleNotes);
    setSettleTarget(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Patients & Customer Loyalty Profiles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain medical records, drug allergy flags, insurance policies, and loyalty reward wallets.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Patient Name, ID (e.g. PAT-10029), or Phone Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                  {cust.patientCode}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>{cust.loyaltyPoints} Pts</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {cust.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {cust.age} yrs • {cust.gender} • {cust.phone}
                </p>
              </div>

              {cust.allergies.length > 0 && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                  <div className="text-[11px]">
                    <span className="font-bold text-rose-600 block">Drug Allergies Flag</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {cust.allergies.join(", ")}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Deposit Wallet</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(cust.depositBalance || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Unpaid Credit Debt</span>
                  <span className={`font-extrabold ${(cust.unpaidBalance || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                    {formatCurrency(cust.unpaidBalance || 0)}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Deposit & Debt Settlement */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setDepositTarget(cust);
                    setDepositAmount(5000);
                  }}
                  className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-emerald-500/20"
                >
                  <PiggyBank className="h-3.5 w-3.5" />
                  <span>+ Deposit</span>
                </button>

                <button
                  onClick={() => {
                    setSettleTarget(cust);
                    setSettleAmount(cust.unpaidBalance || 0);
                  }}
                  className="py-1.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 border border-blue-500/20"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Settle Debt</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                Last Visit: {cust.lastVisitDate}
              </span>
              <button
                onClick={() => setSelectedPatient(cust)}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Full Medical Profile →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">Register Patient Profile</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Full Patient Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robert Anderson"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Age & Gender</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Known Drug Allergies (Comma Separated)</label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="Penicillin, Aspirin, Sulfa"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Patient Medical Profile View */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">
                Medical Record: {selectedPatient.name}
              </h3>
              <button onClick={() => setSelectedPatient(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <p>Patient Code: <strong className="font-mono">{selectedPatient.patientCode}</strong></p>
              <p>Phone: {selectedPatient.phone}</p>
              <p>Insurance: {selectedPatient.insuranceProvider || "Self-Pay"}</p>
              <p>Allergies: <strong className="text-rose-600">{selectedPatient.allergies.join(", ") || "None Reported"}</strong></p>
              <p>Total Spend: <strong>${selectedPatient.totalSpent.toFixed(2)}</strong></p>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full py-2.5 rounded-xl bg-slate-200 font-bold"
            >
              Close Record
            </button>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Credit Patient Deposit</h3>
                  <p className="text-[11px] text-slate-500">{depositTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setDepositTarget(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={depositPaymentMethod}
                  onChange={(e) => setDepositPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">POS Card Terminal</option>
                  <option value="Digital Wallet">Digital Wallet / Transfer</option>
                  <option value="Insurance">Insurance Provider</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Reference
                </label>
                <input
                  type="text"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="e.g., Bank Transfer Ref #9921"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDepositTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Settlement Modal */}
      {settleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Settle Customer Debt</h3>
                  <p className="text-[11px] text-slate-500">{settleTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setSettleTarget(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex justify-between items-center">
              <span className="font-bold text-rose-700 dark:text-rose-300">Total Outstanding Debt:</span>
              <span className="font-extrabold text-rose-600 text-sm">
                {formatCurrency(settleTarget.unpaidBalance || 0)}
              </span>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Repayment Amount Received
                </label>
                <input
                  type="number"
                  min="1"
                  max={settleTarget.unpaidBalance || 999999999}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Method
                </label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">POS Card Terminal</option>
                  <option value="Digital Wallet">Digital Wallet / Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Full Debt Clearance"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

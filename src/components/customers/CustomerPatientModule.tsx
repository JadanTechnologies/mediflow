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
  UserCheck
} from "lucide-react";

export const CustomerPatientModule: React.FC = () => {
  const { customers, addCustomer } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<CustomerPatient | null>(null);

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

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Credit Wallet</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${cust.walletBalance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Pharmacy Spend</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    ${cust.totalSpent.toFixed(2)}
                  </span>
                </div>
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
    </div>
  );
};

import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Supplier, PurchaseOrder } from "../../types/pharmacy";
import {
  Truck,
  Plus,
  Search,
  Building,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  X,
  FileCheck,
  UserCheck
} from "lucide-react";

export const PurchaseModule: React.FC = () => {
  const { suppliers, purchases, addSupplier, addPurchaseOrder } = usePharmacy();

  const [activeTab, setActiveTab] = useState<"ORDERS" | "SUPPLIERS">("ORDERS");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);

  // New Supplier Form
  const [supplierName, setSupplierName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");

  // New Purchase Order Form
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || "sup-1");
  const [poItems, setPoItems] = useState([
    { medicineName: "Augmentin 625mg Tablet", quantity: 100, unitCost: 12.50 },
  ]);

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      name: supplierName,
      contactPerson,
      email: supplierEmail,
      phone: supplierPhone,
      address: "Logistics Park, Hub 4",
      balance: 0,
      rating: 5.0,
    });
    setShowSupplierModal(false);
  };

  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId);
    const total = poItems.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

    addPurchaseOrder({
      supplierId: poSupplierId,
      supplierName: sup?.name || "Pharma Supplier",
      items: poItems.map((i) => ({ ...i, totalCost: i.quantity * i.unitCost })),
      totalAmount: total,
      paidAmount: total * 0.5,
      status: "Pending",
    });
    setShowPoModal(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span>Procurement & Supplier Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage purchase orders, Goods Received Notes (GRN), supplier balances, and procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
          >
            <UserCheck className="h-4 w-4 text-blue-600" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => setShowPoModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("ORDERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ORDERS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab("SUPPLIERS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "SUPPLIERS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          Approved Suppliers ({suppliers.length})
        </button>
      </div>

      {/* Purchase Orders View */}
      {activeTab === "ORDERS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((po) => (
              <div
                key={po.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                    {po.poNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      po.status === "Received"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {po.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {po.supplierName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Expected Delivery: {po.expectedDeliveryDate}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Order Summary ({po.items.length} items)
                  </span>
                  {po.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <span>{i.medicineName}</span>
                      <span>x{i.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total PO Value</span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      ${po.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                    Paid: ${po.paidAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers Ledger View */}
      {activeTab === "SUPPLIERS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {sup.name}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{sup.rating}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>Contact: <strong className="text-slate-800 dark:text-slate-200">{sup.contactPerson}</strong></p>
                <p>Phone: {sup.phone}</p>
                <p>Email: {sup.email}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Outstanding Ledger</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                    ${sup.balance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Lifetime Volume</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    ${sup.totalPurchases.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">Add New Supplier</h3>
              <button onClick={() => setShowSupplierModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Novartis Distribution Ltd"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Contact Representative</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Mark Vance"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Phone</label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base">Create Purchase Order (PO)</h3>
              <button onClick={() => setShowPoModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Select Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 border-t pt-2">
                <label className="font-bold block">Ordered Item & Quantity</label>
                <input
                  type="text"
                  value={poItems[0].medicineName}
                  onChange={(e) =>
                    setPoItems([{ ...poItems[0], medicineName: e.target.value }])
                  }
                  className="w-full p-2 bg-slate-50 border rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={poItems[0].quantity}
                    onChange={(e) =>
                      setPoItems([
                        { ...poItems[0], quantity: parseInt(e.target.value) || 1 },
                      ])
                    }
                    className="p-2 bg-slate-50 border rounded-lg"
                    placeholder="Quantity"
                  />
                  <input
                    type="number"
                    value={poItems[0].unitCost}
                    onChange={(e) =>
                      setPoItems([
                        { ...poItems[0], unitCost: parseFloat(e.target.value) || 0 },
                      ])
                    }
                    className="p-2 bg-slate-50 border rounded-lg"
                    placeholder="Unit Cost $"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Submit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

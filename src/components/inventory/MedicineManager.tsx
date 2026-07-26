import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine } from "../../types/pharmacy";
import { TableSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import { QRCodeSVG } from "qrcode.react";
import { BulkImportModal } from "./BulkImportModal";
import { UomManagerModal } from "./UomManagerModal";
import { RestockReorderModal } from "./RestockReorderModal";
import {
  Pill,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowRightLeft,
  X,
  Barcode,
  QrCode,
  Printer,
  CheckSquare,
  Square,
  Tag,
  Grid,
  Check,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  PackagePlus,
  Truck,
} from "lucide-react";

export const MedicineManager: React.FC = () => {
  const {
    medicines,
    categories,
    branches,
    currentBranch,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addStockTransfer,
    formatCurrency,
    isLoading,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [filterType, setFilterType] = useState<"ALL" | "LOW_STOCK" | "NEAR_EXPIRY" | "EXPIRED" | "CONTROLLED">("ALL");

  // Selection state for Batch QR Printing
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showUomModal, setShowUomModal] = useState(false);
  const [uomMedId, setUomMedId] = useState<string | undefined>(undefined);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [barcodeMed, setBarcodeMed] = useState<Medicine | null>(null);
  const [transferMed, setTransferMed] = useState<Medicine | null>(null);
  const [showBatchQrModal, setShowBatchQrModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockTargetMed, setRestockTargetMed] = useState<Medicine | null>(null);
  const [restockModalMode, setRestockModalMode] = useState<"RESTOCK" | "REORDER">("RESTOCK");

  // Batch QR Label Settings
  const [labelCols, setLabelCols] = useState<2 | 3 | 4>(3);
  const [labelSize, setLabelSize] = useState<"sm" | "md" | "lg">("md");
  const [showPriceOnLabel, setShowPriceOnLabel] = useState(true);
  const [showLocationOnLabel, setShowLocationOnLabel] = useState(true);
  const [showExpiryOnLabel, setShowExpiryOnLabel] = useState(true);
  const [labelCopies, setLabelCopies] = useState<number>(1);

  // Transfer Form State
  const [transferQty, setTransferQty] = useState(10);
  const [targetBranchId, setTargetBranchId] = useState(branches[1]?.id || "");

  // Add/Edit Form State
  const [formData, setFormData] = useState<Partial<Medicine>>({
    name: "",
    genericName: "",
    brandName: "",
    category: categories[0]?.name || "Antibiotics",
    manufacturer: "",
    strength: "500mg",
    dosageForm: "Tablet",
    packSize: "10 Tablets/Strip",
    purchasePrice: 1500,
    sellingPrice: 2800,
    wholesalePrice: 2200,
    stock: 100,
    minStock: 20,
    maxStock: 500,
    location: "Aisle 1 - Shelf A",
    storageTemperature: "15-25°C",
    prescriptionRequired: true,
    isControlledDrug: false,
  });

  if (isLoading) {
    return <TableSkeleton rows={8} cols={6} />;
  }

  const filteredMedicines = medicines.filter((m) => {
    const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.barcode.includes(searchQuery) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesCat || !matchesSearch) return false;

    if (filterType === "LOW_STOCK") return m.stock <= m.minStock;
    if (filterType === "CONTROLLED") return m.isControlledDrug;
    if (filterType === "NEAR_EXPIRY") {
      return m.batches.some((b) => {
        const diff = (new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        return diff > 0 && diff <= 60;
      });
    }
    if (filterType === "EXPIRED") {
      return m.batches.some((b) => new Date(b.expiryDate).getTime() < Date.now());
    }

    return true;
  });

  // Toggle selection helpers
  const toggleSelectAll = () => {
    if (filteredMedicines.length === 0) return;
    const allFilteredIds = filteredMedicines.map((m) => m.id);
    const areAllSelected = allFilteredIds.every((id) => selectedMedIds.includes(id));
    if (areAllSelected) {
      setSelectedMedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedMedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const toggleSelectMed = (id: string) => {
    setSelectedMedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedMedicinesList = medicines.filter((m) => selectedMedIds.includes(m.id));

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMed) {
      updateMedicine(editingMed.id, formData);
      setEditingMed(null);
    } else {
      addMedicine(formData);
      setShowAddModal(false);
    }
  };

  const handleStockTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferMed) return;
    const targetBranch = branches.find((b) => b.id === targetBranchId);
    addStockTransfer({
      fromBranch: currentBranch.name,
      toBranch: targetBranch?.name || "Branch 2",
      items: [
        {
          medicineId: transferMed.id,
          medicineName: transferMed.name,
          batchNumber: transferMed.batches[0]?.batchNumber || "BATCH-01",
          quantity: transferQty,
        },
      ],
    });
    setTransferMed(null);
  };

  return (
    <RbacGuard permission="inventory_management">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Pill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span>Pharmacy Inventory & FEFO Batches</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage pharmaceutical stock, storage locations, expiration dates, and branch transfers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setRestockTargetMed(null);
                setRestockModalMode("RESTOCK");
                setShowRestockModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <PackagePlus className="h-4 w-4" />
              <span>Restock Stock</span>
            </button>

            <button
              onClick={() => {
                setRestockTargetMed(null);
                setRestockModalMode("REORDER");
                setShowRestockModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              <span>Reorder (P.O.)</span>
            </button>

            <button
              onClick={() => {
                setUomMedId(undefined);
                setShowUomModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              <span>Unit Conversions (UOM)</span>
            </button>

            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Bulk CSV Import</span>
            </button>

            <button
              onClick={() => {
                if (selectedMedIds.length === 0) {
                  // If none selected, default to selecting all filtered medicines
                  setSelectedMedIds(filteredMedicines.map((m) => m.id));
                }
                setShowBatchQrModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 border border-slate-700"
            >
              <QrCode className="h-4 w-4 text-emerald-400" />
              <span>
                Batch Print QR Labels {selectedMedIds.length > 0 ? `(${selectedMedIds.length})` : ""}
              </span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  name: "",
                  genericName: "",
                  brandName: "",
                  category: categories[0]?.name || "Antibiotics",
                  manufacturer: "Global Pharma",
                  strength: "500mg",
                  dosageForm: "Tablet",
                  packSize: "10 Tablets/Strip",
                  purchasePrice: 1500,
                  sellingPrice: 2800,
                  stock: 100,
                  minStock: 20,
                  maxStock: 500,
                  location: "Aisle 1 - Shelf A",
                  storageTemperature: "15-25°C",
                  prescriptionRequired: true,
                  isControlledDrug: false,
                });
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Medicine</span>
            </button>
          </div>
        </div>

        {/* Selection Bar when items are selected */}
        {selectedMedIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 shadow-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200 print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
              <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold">
                {selectedMedIds.length} Selected
              </span>
              <span>Medicines selected for batch actions & QR code label printing</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBatchQrModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="h-4 w-4" />
                <span>Generate & Print QR Labels ({selectedMedIds.length})</span>
              </button>

              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              >
                {filteredMedicines.length > 0 &&
                filteredMedicines.every((m) => selectedMedIds.includes(m.id))
                  ? "Deselect Filtered"
                  : "Select All Filtered"}
              </button>

              <button
                onClick={() => setSelectedMedIds([])}
                className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-xs"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            {[
              { id: "ALL", label: "All Catalog" },
              { id: "LOW_STOCK", label: "Low Stock Alert", color: "text-amber-600" },
              { id: "NEAR_EXPIRY", label: "Near Expiry (60 Days)", color: "text-rose-600" },
              { id: "EXPIRED", label: "Expired Batches", color: "text-rose-700" },
              { id: "CONTROLLED", label: "Controlled Drugs", color: "text-purple-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by brand name, generic chemical, SKU, or Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 focus:outline-none"
                      title={
                        filteredMedicines.length > 0 &&
                        filteredMedicines.every((m) => selectedMedIds.includes(m.id))
                          ? "Deselect All"
                          : "Select All Filtered"
                      }
                    >
                      {filteredMedicines.length > 0 &&
                      filteredMedicines.every((m) => selectedMedIds.includes(m.id)) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Medicine & Generic</th>
                  <th className="p-4">Category & Form</th>
                  <th className="p-4">Storage & Location</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Expiry Date (FEFO)</th>
                  <th className="p-4">Price (Cost / Sell)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMedicines.map((med) => {
                  const nearestBatch = med.batches[0];
                  const expDate = nearestBatch ? new Date(nearestBatch.expiryDate) : null;
                  const isNearExp = expDate && (expDate.getTime() - Date.now()) / (1000 * 3600 * 24) <= 60;
                  const isLow = med.stock <= med.minStock;
                  const isSelected = selectedMedIds.includes(med.id);

                  return (
                    <tr
                      key={med.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/40"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleSelectMed(med.id)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                          <span>{med.name}</span>
                          {med.isControlledDrug && (
                            <span className="text-[9px] bg-purple-500/10 text-purple-600 font-bold px-1.5 py-0.5 rounded border border-purple-500/20">
                              CTRL
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {med.genericName} • {med.strength}
                        </p>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {med.category}
                        </span>
                        <p className="text-[11px] text-slate-400">{med.dosageForm}</p>
                      </td>

                      <td className="p-4 space-y-0.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {med.location}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {med.storageTemperature}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                            isLow
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {med.stock} units
                        </span>
                      </td>

                      <td className="p-4">
                        {nearestBatch ? (
                          <div className="space-y-0.5">
                            <span
                              className={`font-semibold ${
                                isNearExp ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {nearestBatch.expiryDate}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Batch: {nearestBatch.batchNumber}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="p-4 space-y-0.5 font-mono">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(med.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {formatCurrency(med.purchasePrice)}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setRestockTargetMed(med);
                              setRestockModalMode("RESTOCK");
                              setShowRestockModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            title="Restock Stock Batch for this Medication"
                          >
                            <PackagePlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </button>

                          <button
                            onClick={() => {
                              setRestockTargetMed(med);
                              setRestockModalMode("REORDER");
                              setShowRestockModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            title="Create Supplier Reorder (P.O.)"
                          >
                            <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </button>

                          <button
                            onClick={() => {
                              setUomMedId(med.id);
                              setShowUomModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Configure UOM Conversion Rules (Box/Strip/Tablet)"
                          >
                            <Layers className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setBarcodeMed(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Generate Barcode / QR Label"
                          >
                            <Barcode className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setTransferMed(med)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Transfer Stock to Branch"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingMed(med);
                              setFormData(med);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Medicine"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => deleteMedicine(med.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Delete Medicine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Medicine Modal */}
        {(showAddModal || editingMed) && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {editingMed ? "Edit Pharmaceutical Item" : "Add New Medicine SKU"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMed(null);
                  }}
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Medicine Trade / Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Augmentin 625mg"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Generic Active Composition
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.genericName || ""}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                      placeholder="e.g. Amoxicillin + Clavulanic Acid"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Therapeutic Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Dosage Form
                    </label>
                    <input
                      type="text"
                      value={formData.dosageForm || "Tablet"}
                      onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                      placeholder="Tablet / Syrup / Inhaler"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Purchase Cost
                    </label>
                    <input
                      type="number"
                      value={formData.purchasePrice || 0}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Retail Selling Price
                    </label>
                    <input
                      type="number"
                      value={formData.sellingPrice || 0}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stock || 100}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Shelf Location / Rack
                    </label>
                    <input
                      type="text"
                      value={formData.location || "Aisle 1 - Shelf A"}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Aisle 3 - Shelf C2"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prescriptionRequired || false}
                      onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Prescription Required (Rx Only)</span>
                  </label>

                  <label className="flex items-center gap-2 font-semibold text-rose-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isControlledDrug || false}
                      onChange={(e) => setFormData({ ...formData, isControlledDrug: e.target.checked })}
                      className="rounded text-rose-600"
                    />
                    <span>Controlled Substance / Narcotic</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingMed(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                  >
                    {editingMed ? "Update Medicine" : "Save Medicine SKU"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barcode / QR Label Modal */}
        {barcodeMed && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Printable Barcode & Shelf Label
              </h3>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 space-y-2">
                <h4 className="font-extrabold text-xs tracking-wider">{barcodeMed.name}</h4>
                <p className="text-[10px] text-slate-500">{barcodeMed.genericName} • {barcodeMed.strength}</p>
                
                <div className="py-2 flex justify-center">
                  <div className="font-mono text-xl tracking-widest font-black border-2 border-slate-900 p-2 rounded">
                    |||| | |||||| | ||||
                  </div>
                </div>
                
                <p className="font-mono text-[11px] font-bold">{barcodeMed.barcode}</p>
                <p className="text-[10px] text-blue-700 font-semibold">Location: {barcodeMed.location}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Print Label
                </button>
                <button
                  onClick={() => setBarcodeMed(null)}
                  className="py-2 px-4 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Transfer Modal */}
        {transferMed && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Stock Transfer: {transferMed.name}
              </h3>

              <form onSubmit={handleStockTransferSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Source Branch</label>
                  <input
                    type="text"
                    disabled
                    value={currentBranch.name}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border rounded-xl text-slate-600 dark:text-slate-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Target Branch</label>
                  <select
                    value={targetBranchId}
                    onChange={(e) => setTargetBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {branches.filter((b) => b.id !== currentBranch.id).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-500 block mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    max={transferMed.stock}
                    min={1}
                    value={transferQty}
                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTransferMed(null)}
                    className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Batch Print QR Labels Modal */}
        {showBatchQrModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                      Batch Print Shelf QR Labels
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Generate printable QR code labels for shelf management, inventory audits, and POS scanning.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowBatchQrModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Controls and Customization Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Grid Layout Option */}
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Grid className="h-3.5 w-3.5 text-blue-600" />
                      <span>Grid Columns</span>
                    </label>
                    <div className="flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                      {[2, 3, 4].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => setLabelCols(cols as any)}
                          className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                            labelCols === cols
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          {cols} Cols
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Label Size Option */}
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-blue-600" />
                      <span>Label Dimensions</span>
                    </label>
                    <div className="flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                      {[
                        { id: "sm", label: "Compact" },
                        { id: "md", label: "Standard" },
                        { id: "lg", label: "Large" },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          onClick={() => setLabelSize(sz.id as any)}
                          className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                            labelSize === sz.id
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Copies per Medicine */}
                  <div>
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Labels Per Item
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={labelCopies}
                      onChange={(e) => setLabelCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Quick Summary / Selection reset */}
                  <div className="flex flex-col justify-end">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Total Print Output:
                    </div>
                    <div className="font-black text-sm text-blue-600 dark:text-blue-400">
                      {selectedMedicinesList.length * labelCopies} Total Labels ({selectedMedicinesList.length} SKUs)
                    </div>
                  </div>
                </div>

                {/* Visible Data Toggles */}
                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-semibold">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Include on Label:
                  </span>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={showPriceOnLabel}
                      onChange={(e) => setShowPriceOnLabel(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Retail Price</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={showLocationOnLabel}
                      onChange={(e) => setShowLocationOnLabel(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Shelf Location & Temp</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input
                      type="checkbox"
                      checked={showExpiryOnLabel}
                      onChange={(e) => setShowExpiryOnLabel(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>FEFO Expiry Date & Batch #</span>
                  </label>
                </div>
              </div>

              {/* QR Code Labels Printable Grid Area */}
              <div className="flex-1 overflow-y-auto pr-1">
                {selectedMedicinesList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <QrCode className="h-10 w-10 mx-auto opacity-40" />
                    <p className="text-sm font-semibold">No medicines selected for QR label printing.</p>
                    <button
                      onClick={() => {
                        setSelectedMedIds(medicines.map((m) => m.id));
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Select All {medicines.length} Medicines
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid gap-3.5 ${
                      labelCols === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : labelCols === 3
                        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                    }`}
                  >
                    {selectedMedicinesList.flatMap((med) =>
                      Array.from({ length: labelCopies }).map((_, copyIdx) => {
                        const nearestBatch = med.batches[0];
                        const qrPayload = JSON.stringify({
                          id: med.id,
                          sku: med.sku,
                          name: med.name,
                          barcode: med.barcode,
                          price: med.sellingPrice,
                          location: med.location,
                          expiry: nearestBatch?.expiryDate || "N/A",
                        });

                        return (
                          <div
                            key={`${med.id}-copy-${copyIdx}`}
                            className={`bg-white border-2 border-slate-900 rounded-2xl p-3 shadow-xs text-slate-900 flex flex-col justify-between space-y-2 relative group transition-all hover:border-blue-600 ${
                              labelSize === "sm" ? "text-[10px] p-2" : labelSize === "lg" ? "p-4 text-xs" : "p-3 text-[11px]"
                            }`}
                          >
                            {/* Label Header */}
                            <div className="flex items-start justify-between gap-1 border-b border-slate-200 pb-1.5">
                              <div>
                                <h4 className="font-extrabold uppercase tracking-tight line-clamp-1 leading-snug">
                                  {med.name}
                                </h4>
                                <p className="text-[9px] text-slate-500 font-medium line-clamp-1">
                                  {med.genericName} • {med.strength}
                                </p>
                              </div>

                              {med.isControlledDrug && (
                                <span className="bg-purple-100 text-purple-900 text-[8px] font-black px-1 py-0.5 rounded border border-purple-300 shrink-0">
                                  CTRL
                                </span>
                              )}
                            </div>

                            {/* Label Center: QR Code & Shelf Metadata */}
                            <div className="flex items-center gap-2 py-1">
                              <div className="p-1 bg-white border border-slate-200 rounded-lg shrink-0">
                                <QRCodeSVG
                                  value={qrPayload}
                                  size={labelSize === "sm" ? 48 : labelSize === "lg" ? 72 : 60}
                                  level="M"
                                  marginSize={1}
                                />
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-mono text-[10px] font-black text-slate-700 tracking-wider">
                                  {med.sku}
                                </p>

                                {showLocationOnLabel && (
                                  <div className="bg-blue-50 border border-blue-200 rounded p-1 text-[9px] font-bold text-blue-900 leading-none">
                                    <span>Shelf: {med.location}</span>
                                  </div>
                                )}

                                {showExpiryOnLabel && nearestBatch && (
                                  <div className="text-[9px] font-mono text-slate-600">
                                    <span className="font-bold">EXP:</span> {nearestBatch.expiryDate}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Label Footer */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                              <div className="font-mono text-[9px] text-slate-500 font-bold">
                                {med.barcode}
                              </div>

                              {showPriceOnLabel && (
                                <div className="font-mono font-black text-xs text-slate-900">
                                  {formatCurrency(med.sellingPrice)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedMedIds(medicines.map((m) => m.id))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
                  >
                    Select All ({medicines.length})
                  </button>
                  <button
                    onClick={() => setSelectedMedIds([])}
                    className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchQrModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    disabled={selectedMedicinesList.length === 0}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print {selectedMedicinesList.length * labelCopies} QR Labels</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Bulk CSV / Excel Import Modal */}
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
        />
        {/* UOM Conversion Rules Manager Modal */}
        <UomManagerModal
          isOpen={showUomModal}
          onClose={() => setShowUomModal(false)}
          preSelectedMedicineId={uomMedId}
        />
        {/* Restock & Reorder Purchase Order Modal */}
        <RestockReorderModal
          isOpen={showRestockModal}
          onClose={() => setShowRestockModal(false)}
          selectedMedicine={restockTargetMed}
          mode={restockModalMode}
        />
      </div>
    </RbacGuard>
  );
};

import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { DispensingUnit } from "../../types/pharmacy";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import {
  PackagePlus,
  Edit2,
  Trash2,
  X,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Pill,
  Check,
} from "lucide-react";

interface UnitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit?: (unitName: string) => void;
}

export const UnitManagerModal: React.FC<UnitManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectUnit,
}) => {
  const { dispensingUnits, addDispensingUnit, updateDispensingUnit, deleteDispensingUnit } =
    usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingUnit, setEditingUnit] = useState<DispensingUnit | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    shortCode: string;
    description: string;
    isBaseUnit: boolean;
  }>({
    name: "",
    shortCode: "",
    description: "",
    isBaseUnit: true,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleEditClick = (unit: DispensingUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      shortCode: unit.shortCode,
      description: unit.description || "",
      isBaseUnit: !!unit.isBaseUnit,
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setFormData({ name: "", shortCode: "", description: "", isBaseUnit: true });
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Unit name is required");
      return;
    }

    if (editingUnit) {
      updateDispensingUnit(editingUnit.id, {
        name: formData.name.trim(),
        shortCode: formData.shortCode.trim() || formData.name.substring(0, 3),
        description: formData.description.trim(),
        isBaseUnit: formData.isBaseUnit,
      });
      setSuccessMsg(`Dispensing unit "${formData.name.trim()}" updated successfully!`);
      if (onSelectUnit) {
        onSelectUnit(formData.name.trim());
      }
      handleCancelEdit();
    } else {
      // Check duplicate
      const duplicate = dispensingUnits.some(
        (u) => u.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicate) {
        setErrorMsg("A unit with this name already exists");
        return;
      }

      const generatedCode =
        formData.shortCode.trim() || formData.name.substring(0, 3);

      const created = addDispensingUnit({
        name: formData.name.trim(),
        shortCode: generatedCode,
        description: formData.description.trim(),
        isBaseUnit: formData.isBaseUnit,
      });

      setSuccessMsg(`Unit "${created.name}" created successfully!`);
      if (onSelectUnit) {
        onSelectUnit(created.name);
      }
      setFormData({ name: "", shortCode: "", description: "", isBaseUnit: true });
    }

    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (unit: DispensingUnit) => {
    if (!window.confirm(`Delete unit "${unit.name}"?`)) return;

    deleteDispensingUnit(unit.id);
    if (editingUnit?.id === unit.id) {
      handleCancelEdit();
    }
  };

  const filteredUnits = dispensingUnits.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] printable-modal-content">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Dispensing Units & Dosage Forms</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                  {dispensingUnits.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage units of measure (UOM) e.g., Tablet, Capsule, Bottle, Strip, Box, Vial
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModalHeaderPrintButton size="sm" />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
          {/* Form Column (5 cols) */}
          <div className="md:col-span-5 p-5 space-y-4 bg-slate-50/30 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                {editingUnit ? <Edit2 className="h-3.5 w-3.5 text-emerald-600" /> : <Plus className="h-3.5 w-3.5 text-emerald-600" />}
                <span>{editingUnit ? "Edit Unit" : "Create New Unit"}</span>
              </h3>
              {editingUnit && (
                <button
                  onClick={handleCancelEdit}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-bold underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Unit Name / Dosage Form <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tablet, Capsule, Syrup, Bottle 100ml, Suppository"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Abbreviation / Symbol
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tab, Cap, Syr, Btl, Supp"
                  value={formData.shortCode}
                  onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                  maxLength={8}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used on POS receipts and stock labels</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Context
                </label>
                <textarea
                  placeholder="e.g. Standard single oral solid dose, liquid bottle, or packaging box..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isBaseUnit"
                  checked={formData.isBaseUnit}
                  onChange={(e) => setFormData({ ...formData, isBaseUnit: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isBaseUnit" className="font-bold text-slate-700 dark:text-slate-300">
                  Primary Base Dispensing Unit (e.g. Tablet vs. Strip/Box)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {editingUnit ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{editingUnit ? "Update Unit" : "Save Unit"}</span>
                </button>

                {editingUnit && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Column (7 cols) */}
          <div className="md:col-span-7 p-5 space-y-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dispensing units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
              {filteredUnits.length === 0 ? (
                <div className="text-center py-10 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Pill className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No dispensing units found</p>
                  <p className="text-[11px] text-slate-400">Add a new unit using the form on the left</p>
                </div>
              ) : (
                filteredUnits.map((unit) => {
                  const isBeingEdited = editingUnit?.id === unit.id;

                  return (
                    <div
                      key={unit.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBeingEdited
                          ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 shadow-xs"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs shrink-0">
                          {unit.shortCode || "UOM"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {unit.name}
                            </p>
                            {unit.isBaseUnit ? (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold shrink-0">
                                Base Unit
                              </span>
                            ) : (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold shrink-0">
                                Packaging / Bulk
                              </span>
                            )}
                          </div>
                          {unit.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {unit.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {onSelectUnit && (
                          <button
                            onClick={() => {
                              onSelectUnit(unit.name);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-200"
                          >
                            Select
                          </button>
                        )}

                        <button
                          onClick={() => handleEditClick(unit)}
                          title="Edit Unit"
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(unit)}
                          title="Delete Unit"
                          className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>Units defined here are available during medication creation & multi-UOM price rules.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-800 dark:text-slate-200 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

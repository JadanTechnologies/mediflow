import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Category } from "../../types/pharmacy";
import { ModalHeaderPrintButton } from "../ui/ModalHeaderPrintButton";
import {
  FolderPlus,
  Edit2,
  Trash2,
  X,
  Search,
  Plus,
  CheckCircle2,
  Layers,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (categoryName: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const { categories, medicines, addCategory, updateCategory, deleteCategory, t } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{ name: string; code: string; description: string }>({
    name: "",
    code: "",
    description: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: "", code: "", description: "" });
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Category name is required");
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || formData.name.substring(0, 3).toUpperCase(),
        description: formData.description.trim(),
      });
      setSuccessMsg(`Category "${formData.name.trim()}" updated successfully!`);
      if (onSelectCategory) {
        onSelectCategory(formData.name.trim());
      }
      handleCancelEdit();
    } else {
      // Check duplicate
      const duplicate = categories.some(
        (c) => c.name.toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicate) {
        setErrorMsg("A category with this name already exists");
        return;
      }

      const generatedCode =
        formData.code.trim().toUpperCase() ||
        formData.name.substring(0, 3).toUpperCase();

      const created = addCategory({
        name: formData.name.trim(),
        code: generatedCode,
        description: formData.description.trim(),
      });

      setSuccessMsg(`Category "${created.name}" created successfully!`);
      if (onSelectCategory) {
        onSelectCategory(created.name);
      }
      setFormData({ name: "", code: "", description: "" });
    }

    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = (cat: Category) => {
    const medCount = medicines.filter((m) => m.category === cat.name).length;
    if (medCount > 0) {
      if (
        !window.confirm(
          `Warning: ${medCount} medicine(s) are assigned to "${cat.name}". Are you sure you want to delete this category?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    }

    deleteCategory(cat.id);
    if (editingCategory?.id === cat.id) {
      handleCancelEdit();
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] printable-modal-content">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Medicine Categories</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold">
                  {categories.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create, organize, and manage therapeutic category classifications for your pharmacy
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
                {editingCategory ? <Edit2 className="h-3.5 w-3.5 text-blue-600" /> : <Plus className="h-3.5 w-3.5 text-blue-600" />}
                <span>{editingCategory ? "Edit Category" : "Create New Category"}</span>
              </h3>
              {editingCategory && (
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
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Antibiotics, Antipyretics, Antivirals"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Code (Short Code)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ANT, PAIN, DIA, RESP"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  maxLength={6}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Short 3-4 letter code for reports & SKUs</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Medical Scope
                </label>
                <textarea
                  placeholder="e.g. Broad and narrow spectrum antimicrobial agents and penicillin derivatives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  {editingCategory ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{editingCategory ? "Update Category" : "Save Category"}</span>
                </button>

                {editingCategory && (
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
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-10 space-y-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <FolderOpen className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No categories found</p>
                  <p className="text-[11px] text-slate-400">Create a new category using the form on the left</p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const medCount = medicines.filter((m) => m.category === cat.name).length;
                  const isBeingEdited = editingCategory?.id === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBeingEdited
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 shadow-xs"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-black text-xs shrink-0 tracking-wider">
                          {cat.code || "CAT"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {cat.name}
                            </p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                              {medCount} med{medCount === 1 ? "" : "s"}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {onSelectCategory && (
                          <button
                            onClick={() => {
                              onSelectCategory(cat.name);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-200"
                          >
                            Select
                          </button>
                        )}

                        <button
                          onClick={() => handleEditClick(cat)}
                          title="Edit Category"
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(cat)}
                          title="Delete Category"
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
            <Layers className="h-4 w-4 text-blue-500" />
            <span>Categories dynamically update filters across POS, Stock, and Reports.</span>
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

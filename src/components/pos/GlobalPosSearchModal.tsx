import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  Plus,
  Check,
  Pill,
  AlertTriangle,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { Medicine } from "../../types/pharmacy";

interface GlobalPosSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  onAddToCart: (medicine: Medicine, quantity: number) => void;
  formatCurrency: (amount: number) => string;
}

export const GlobalPosSearchModal: React.FC<GlobalPosSearchModalProps> = ({
  isOpen,
  onClose,
  medicines,
  onAddToCart,
  formatCurrency,
}) => {
  const [query, setQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"ALL" | "BRAND" | "GENERIC" | "IN_STOCK">("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter medicines based on search query and category
  const filteredMedicines = medicines.filter((m) => {
    const q = query.trim().toLowerCase();

    const matchesSearch =
      q === "" ||
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.barcode.includes(q) ||
      m.sku.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedCategoryFilter === "GENERIC") {
      return m.genericName.toLowerCase().includes(q);
    }
    if (selectedCategoryFilter === "BRAND") {
      return m.name.toLowerCase().includes(q);
    }
    if (selectedCategoryFilter === "IN_STOCK") {
      return m.stock > 0;
    }

    return true;
  });

  // Handle arrow key navigation and Enter selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredMedicines.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredMedicines.length > 0 && selectedIndex < filteredMedicines.length) {
          const selectedMed = filteredMedicines[selectedIndex];
          if (selectedMed.stock > 0) {
            handleAdd(selectedMed);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredMedicines, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && filteredMedicines.length > 0) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, filteredMedicines]);

  const handleAdd = (med: Medicine) => {
    onAddToCart(med, 1);
    setAddedItems((prev) => ({ ...prev, [med.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [med.id]: false }));
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] shrink-0"
        >
          {/* Header Search Input Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 shrink-0">
              <Search className="h-5 w-5" />
            </div>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type brand name or generic equivalent (e.g., Paracetamol, Amoxicillin, Panadol)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none pr-8"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-300/60 dark:border-slate-600">
                <kbd>Ctrl</kbd> + <kbd>K</kbd>
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                title="Close (ESC)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mr-1">Filter:</span>
              {[
                { id: "ALL", label: "All Medicine Matches" },
                { id: "GENERIC", label: "Generic Composition" },
                { id: "BRAND", label: "Brand Name" },
                { id: "IN_STOCK", label: "In Stock Only" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSelectedCategoryFilter(filter.id as any);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategoryFilter === filter.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">
              {filteredMedicines.length} items found
            </span>
          </div>

          {/* Search Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
            {filteredMedicines.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="p-4 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-400 w-12 h-12 mx-auto flex items-center justify-center">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    No medicine found matching "{query}"
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    Try searching by active ingredient (e.g. Paracetamol, Ibuprofen, Ciprofloxacin) or SKU/Barcode.
                  </p>
                </div>
              </div>
            ) : (
              filteredMedicines.map((med, index) => {
                const isSelected = index === selectedIndex;
                const isAdded = addedItems[med.id];
                const isOutOfStock = med.stock <= 0;
                const isLowStock = med.stock > 0 && med.stock <= med.minStockLevel;

                const queryLower = query.trim().toLowerCase();
                const matchesGeneric = queryLower && med.genericName.toLowerCase().includes(queryLower);
                const matchesBrand = queryLower && med.name.toLowerCase().includes(queryLower);

                return (
                  <div
                    key={med.id}
                    onClick={() => {
                      setSelectedIndex(index);
                      if (!isOutOfStock) handleAdd(med);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    } ${isOutOfStock ? "opacity-60" : ""}`}
                  >
                    {/* Left Details */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{med.name}</span>
                          {matchesBrand && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                              Brand Match
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {med.dosageForm}
                        </span>
                        {med.requiresPrescription && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Prescription Required</span>
                          </span>
                        )}
                      </div>

                      {/* Generic Equivalent & Active Ingredient */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          <span>Generic: {med.genericName}</span>
                        </span>
                        {matchesGeneric && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Active Formula Match
                          </span>
                        )}
                      </div>

                      {/* SKU & Category & Location */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                        <span className="font-mono">SKU: {med.sku}</span>
                        <span>•</span>
                        <span>Category: {med.category}</span>
                        {med.locationInStore && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              Rack/Shelf: {med.locationInStore}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Price & Stock Badge & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(med.sellingPrice)}
                        </div>
                        <div className="text-[11px] font-extrabold flex items-center gap-1.5 mt-0.5">
                          {isOutOfStock ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              Low Stock ({med.stock} left)
                            </span>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">
                              In Stock: <strong className="text-slate-800 dark:text-slate-200">{med.stock}</strong> units
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) handleAdd(med);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm ${
                          isAdded
                            ? "bg-emerald-600 text-white"
                            : isOutOfStock
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
                            : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-blue-600 hover:text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>+ Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Keyboard Navigation Legend */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 font-bold">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 font-bold">
                  ↓
                </kbd>
                <span className="font-sans text-slate-500">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 font-bold">
                  Enter
                </kbd>
                <span className="font-sans text-slate-500">Add Selected Item</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-200 font-bold">
                  ESC
                </kbd>
                <span className="font-sans text-slate-500">Close</span>
              </span>
            </div>
            <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Generic & Brand Search Engine</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine, MedicineUomConfig, UnitConversionRule } from "../../types/pharmacy";
import {
  Layers,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Calculator,
  Sliders,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Package,
  Boxes,
  Tag,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";

interface UomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedMedicineId?: string;
}

export const UomManagerModal: React.FC<UomManagerModalProps> = ({
  isOpen,
  onClose,
  preSelectedMedicineId,
}) => {
  const { medicines, updateMedicine, formatCurrency, addAuditLog } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedId, setSelectedMedId] = useState<string>("");
  const [baseUnit, setBaseUnit] = useState<string>("Tablet");
  const [conversions, setConversions] = useState<UnitConversionRule[]>([]);
  
  // Interactive Calculator State
  const [calcQty, setCalcQty] = useState<number>(1);
  const [calcSelectedUnitIndex, setCalcSelectedUnitIndex] = useState<number>(-1); // -1 = base unit

  const [successMsg, setSuccessMsg] = useState("");

  // Initialize selected medicine
  useEffect(() => {
    if (preSelectedMedicineId) {
      setSelectedMedId(preSelectedMedicineId);
    } else if (medicines.length > 0 && !selectedMedId) {
      setSelectedMedId(medicines[0].id);
    }
  }, [preSelectedMedicineId, medicines]);

  // Load UOM config whenever selected medicine changes
  const activeMed = medicines.find((m) => m.id === selectedMedId);

  useEffect(() => {
    if (activeMed) {
      if (activeMed.uomConfig) {
        setBaseUnit(activeMed.uomConfig.baseUnit || activeMed.dosageForm || "Tablet");
        setConversions(activeMed.uomConfig.conversions || []);
      } else {
        // Fallback default based on dosage form
        const fallbackBase = activeMed.dosageForm || "Tablet";
        setBaseUnit(fallbackBase);
        if (fallbackBase.toLowerCase().includes("tablet") || fallbackBase.toLowerCase().includes("capsule")) {
          setConversions([
            { unitName: "Strip", conversionMultiplier: 10, sellingPrice: activeMed.sellingPrice * 10 * 0.95 },
            { unitName: "Box", conversionMultiplier: 100, sellingPrice: activeMed.sellingPrice * 100 * 0.90 },
          ]);
        } else if (fallbackBase.toLowerCase().includes("syrup") || fallbackBase.toLowerCase().includes("bottle")) {
          setConversions([
            { unitName: "Case / Pack", conversionMultiplier: 6, sellingPrice: activeMed.sellingPrice * 6 * 0.95 },
            { unitName: "Box", conversionMultiplier: 24, sellingPrice: activeMed.sellingPrice * 24 * 0.90 },
          ]);
        } else {
          setConversions([
            { unitName: "Box", conversionMultiplier: 10, sellingPrice: activeMed.sellingPrice * 10 * 0.90 },
          ]);
        }
      }
      setCalcSelectedUnitIndex(-1);
    }
  }, [selectedMedId, medicines]);

  if (!isOpen) return null;

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preset Template Loader
  const handleApplyPreset = (type: "TABLET" | "CAPSULE" | "SYRUP" | "INJECTION" | "SACHET") => {
    if (!activeMed) return;
    const basePrice = activeMed.sellingPrice;

    if (type === "TABLET") {
      setBaseUnit("Tablet");
      setConversions([
        { unitName: "Strip", conversionMultiplier: 10, sellingPrice: Math.round(basePrice * 10 * 0.95) },
        { unitName: "Box", conversionMultiplier: 100, sellingPrice: Math.round(basePrice * 100 * 0.90) },
      ]);
    } else if (type === "CAPSULE") {
      setBaseUnit("Capsule");
      setConversions([
        { unitName: "Strip", conversionMultiplier: 10, sellingPrice: Math.round(basePrice * 10 * 0.95) },
        { unitName: "Box", conversionMultiplier: 100, sellingPrice: Math.round(basePrice * 100 * 0.90) },
      ]);
    } else if (type === "SYRUP") {
      setBaseUnit("Bottle");
      setConversions([
        { unitName: "Pack / Case", conversionMultiplier: 6, sellingPrice: Math.round(basePrice * 6 * 0.95) },
        { unitName: "Master Box", conversionMultiplier: 24, sellingPrice: Math.round(basePrice * 24 * 0.88) },
      ]);
    } else if (type === "INJECTION") {
      setBaseUnit("Ampoule / Vial");
      setConversions([
        { unitName: "Pack", conversionMultiplier: 5, sellingPrice: Math.round(basePrice * 5 * 0.95) },
        { unitName: "Box", conversionMultiplier: 25, sellingPrice: Math.round(basePrice * 25 * 0.90) },
      ]);
    } else if (type === "SACHET") {
      setBaseUnit("Sachet");
      setConversions([
        { unitName: "Inner Box", conversionMultiplier: 10, sellingPrice: Math.round(basePrice * 10 * 0.95) },
        { unitName: "Outer Carton", conversionMultiplier: 50, sellingPrice: Math.round(basePrice * 50 * 0.88) },
      ]);
    }
  };

  // Add new conversion row
  const handleAddConversion = () => {
    const defaultName = `Tier ${conversions.length + 1}`;
    const defaultMult = (conversions.length + 1) * 10;
    const defaultPrice = activeMed ? activeMed.sellingPrice * defaultMult : 100;

    setConversions((prev) => [
      ...prev,
      { unitName: defaultName, conversionMultiplier: defaultMult, sellingPrice: defaultPrice },
    ]);
  };

  // Update specific conversion field
  const handleUpdateConversion = (index: number, field: keyof UnitConversionRule, value: any) => {
    setConversions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Remove conversion row
  const handleRemoveConversion = (index: number) => {
    setConversions((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save Config
  const handleSaveUomConfig = () => {
    if (!activeMed) return;

    const uomConfig: MedicineUomConfig = {
      baseUnit: baseUnit.trim() || "Unit",
      conversions: conversions.map((c) => ({
        ...c,
        unitName: c.unitName.trim() || "Unit Tier",
        conversionMultiplier: Math.max(1, Number(c.conversionMultiplier) || 1),
        sellingPrice: Number(c.sellingPrice) || activeMed.sellingPrice * (Number(c.conversionMultiplier) || 1),
      })),
    };

    updateMedicine(activeMed.id, { uomConfig });

    addAuditLog(
      "UOM Conversion Matrix Updated",
      `Configured Unit of Measurement for ${activeMed.name}. Base unit: ${uomConfig.baseUnit}, Tiers: ${uomConfig.conversions.length}`
    );

    setSuccessMsg(`Successfully saved UOM conversion rules for ${activeMed.name}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Calculation helpers
  const currentCalcMultiplier =
    calcSelectedUnitIndex === -1
      ? 1
      : conversions[calcSelectedUnitIndex]?.conversionMultiplier || 1;

  const currentCalcUnitName =
    calcSelectedUnitIndex === -1
      ? baseUnit
      : conversions[calcSelectedUnitIndex]?.unitName || baseUnit;

  const totalBaseUnitsDeducted = calcQty * currentCalcMultiplier;
  const remainingStockPreview = activeMed ? Math.max(0, activeMed.stock - totalBaseUnitsDeducted) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Units of Measurement & Conversion Ratios (UOM)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define conversion multipliers (e.g. 1 Box = 10 Strips = 100 Tablets) & auto-deduct inventory stock accurately during sales.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Medicine Selector */}
          <div className="space-y-4 lg:col-span-1 border-r border-slate-100 dark:border-slate-800/80 pr-0 lg:pr-6">
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              1. Select Medicine
            </h3>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by drug name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredMedicines.map((m) => {
                const isSelected = m.id === selectedMedId;
                const hasUom = !!m.uomConfig;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMedId(m.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Stock: {m.stock} {m.uomConfig?.baseUnit || m.dosageForm || "units"}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {hasUom ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase border border-emerald-500/20">
                          {m.uomConfig?.conversions.length} Tiers
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 font-bold text-[9px]">
                          Default
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: UOM Configuration & Calculator */}
          <div className="lg:col-span-2 space-y-6">
            {activeMed ? (
              <>
                {/* Active Product Banner */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
                      Active Drug Catalog Item
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {activeMed.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeMed.genericName} • Category: {activeMed.category}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Base Stock</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">
                      {activeMed.stock} {baseUnit}s
                    </span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>One-Click Preset Industry Standards</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleApplyPreset("TABLET")}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Tablet (10 Strips / 100 Box)
                    </button>
                    <button
                      onClick={() => handleApplyPreset("CAPSULE")}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Capsule (10 Strips / 100 Box)
                    </button>
                    <button
                      onClick={() => handleApplyPreset("SYRUP")}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Liquids (6 Case / 24 Master Box)
                    </button>
                    <button
                      onClick={() => handleApplyPreset("INJECTION")}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700"
                    >
                      Injections (5 Pack / 25 Box)
                    </button>
                  </div>
                </div>

                {/* Base Unit Field */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        2. Base Stocking / Dispensing Unit
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        This is the lowest atomic unit counted in inventory stock (e.g. Tablet, Bottle, Ampoule).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Base Unit Name *
                      </label>
                      <input
                        type="text"
                        value={baseUnit}
                        onChange={(e) => setBaseUnit(e.target.value)}
                        placeholder="e.g. Tablet, Capsule, Bottle"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Base Selling Price (per {baseUnit || "unit"})
                      </label>
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(activeMed.sellingPrice)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Higher Tier Conversions Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        3. Higher Conversion Tiers (Multipliers & Packages)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Define packaging sizes (e.g., 1 Strip = 10 {baseUnit}s; 1 Box = 100 {baseUnit}s)
                      </p>
                    </div>

                    <button
                      onClick={handleAddConversion}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Conversion Tier</span>
                    </button>
                  </div>

                  {conversions.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                      No higher conversion tiers defined. This product is sold only in single {baseUnit}s.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversions.map((conv, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                Packaging Unit Name
                              </label>
                              <input
                                type="text"
                                value={conv.unitName}
                                onChange={(e) => handleUpdateConversion(idx, "unitName", e.target.value)}
                                placeholder="e.g. Strip, Box, Pack"
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                Equals Base Units (1 {conv.unitName || "Unit"} = )
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={conv.conversionMultiplier}
                                  onChange={(e) =>
                                    handleUpdateConversion(idx, "conversionMultiplier", Math.max(1, parseInt(e.target.value) || 1))
                                  }
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono"
                                />
                                <span className="text-[11px] font-bold text-slate-500 shrink-0">
                                  {baseUnit}s
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                                Package Selling Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={conv.sellingPrice || 0}
                                onChange={(e) =>
                                  handleUpdateConversion(idx, "sellingPrice", parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg">
                              1 {conv.unitName} = {conv.conversionMultiplier} {baseUnit}s
                            </span>

                            <button
                              onClick={() => handleRemoveConversion(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                              title="Delete Tier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Stock Deduction Simulator */}
                <div className="p-4 rounded-2xl bg-indigo-900/10 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Interactive POS Sales Stock Deduction Simulator</span>
                    </h4>

                    <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      Live Logic Test
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Sale Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={calcQty}
                        onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">
                        Selected Unit
                      </label>
                      <select
                        value={calcSelectedUnitIndex}
                        onChange={(e) => setCalcSelectedUnitIndex(parseInt(e.target.value))}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold"
                      >
                        <option value="-1">Base Unit: {baseUnit} (1x)</option>
                        {conversions.map((c, i) => (
                          <option key={i} value={i}>
                            {c.unitName} ({c.conversionMultiplier}x {baseUnit}s)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span>Base Deducted:</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
                          {totalBaseUnitsDeducted} {baseUnit}s
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Remaining Stock:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {remainingStockPreview} {baseUnit}s
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Feedback Toast */}
                {successMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Please select a medicine from the list to manage its UOM conversion rules.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-slate-400" />
            <span>Changes will apply immediately across POS terminal cart & batch stock calculations.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
            >
              Close
            </button>

            <button
              onClick={handleSaveUomConfig}
              disabled={!activeMed}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              <span>Save UOM Conversion Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { Medicine } from "../../types/pharmacy";
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  RefreshCw,
  Edit3,
  Trash2,
  ArrowRight,
  Info,
  Check,
  Package,
  DollarSign,
  ShieldAlert,
  Sliders,
} from "lucide-react";

interface ParsedRow {
  rowIndex: number;
  data: {
    name: string;
    genericName: string;
    brandName: string;
    category: string;
    manufacturer: string;
    strength: string;
    dosageForm: string;
    packSize: string;
    purchasePrice: number;
    sellingPrice: number;
    wholesalePrice: number;
    stock: number;
    minStock: number;
    maxStock: number;
    location: string;
    storageTemperature: string;
    prescriptionRequired: boolean;
    isControlledDrug: boolean;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
  };
  status: "VALID" | "WARNING" | "ERROR";
  errors: string[];
  warnings: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const { categories, addMedicine, formatCurrency, addAuditLog } = usePharmacy();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "SUCCESS">("UPLOAD");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingRowData, setEditingRowData] = useState<ParsedRow["data"] | null>(null);
  
  // Table status filter tab
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALID" | "WARNING" | "ERROR">("ALL");

  // Summary counts post import
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    totalStockAdded: number;
    totalValueAdded: number;
    warningCount: number;
  }>({
    importedCount: 0,
    totalStockAdded: 0,
    totalValueAdded: 0,
    warningCount: 0,
  });

  if (!isOpen) return null;

  // Generate & Download CSV Template
  const handleDownloadTemplate = () => {
    const csvHeader =
      "Name,Generic Name,Brand Name,Category,Manufacturer,Strength,Dosage Form,Pack Size,Purchase Price,Selling Price,Wholesale Price,Stock,Min Stock,Max Stock,Location,Storage Temp,Prescription Required,Is Controlled,Batch Number,Mfg Date,Expiry Date\n";

    const csvRows = [
      "Amoxicillin 500mg,Amoxicillin,Amoxil,Antibiotics,Beecham Pharma,500mg,Capsule,10 Capsules/Strip,1200,2500,2000,200,20,500,Shelf B-02,15-25°C,true,false,AMX-2026-01,2026-01-10,2027-06-30",
      "Paracetamol Extra 500mg,Paracetamol / Caffeine,Panadol Extra,Analgesics & Anti-Inflammatories,GSK Consumer,500mg,Tablet,10 Tablets/Strip,500,1200,900,500,50,1000,Shelf A-01,15-25°C,false,false,PAR-2026-04,2026-02-01,2028-02-01",
      "Ciprofloxacin 500mg,Ciprofloxacin,Cipro,Antibiotics,Bayer,500mg,Tablet,10 Tablets/Strip,1800,3500,2800,150,15,400,Shelf B-04,15-25°C,true,false,CIP-2026-09,2026-01-15,2026-08-30",
      "Metformin HCl 500mg,Metformin,Glucophage,Antidiabetics,Merck,500mg,Tablet,10 Tablets/Strip,900,2100,1600,300,30,800,Shelf C-01,15-25°C,true,false,MET-2026-03,2026-02-10,2027-11-20",
      "Tramadol 50mg,Tramadol,Ultram,Analgesics & Anti-Inflammatories,Centaur,50mg,Capsule,10 Capsules/Strip,2200,4500,3800,80,10,200,Controlled Locker,15-25°C,true,true,TRM-2026-11,2026-03-01,2027-03-01",
    ].join("\n");

    const fullContent = csvHeader + csvRows;
    const blob = new Blob([fullContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pharmacy_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Line considering quoted values
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if ((char === "," || char === "\t") && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Row Field Validation Logic
  const validateRow = (raw: any, index: number): ParsedRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const name = String(raw.name || raw.medicineName || raw.productName || "").trim();
    const genericName = String(raw.genericName || raw.generic || "").trim() || "Generic Active Ingredient";
    const brandName = String(raw.brandName || raw.brand || "").trim() || name;
    const category = String(raw.category || raw.class || categories[0]?.name || "Analgesics & Anti-Inflammatories").trim();
    const manufacturer = String(raw.manufacturer || raw.mfg || raw.company || "").trim() || "Global Pharma";
    const strength = String(raw.strength || raw.dosageStrength || "").trim() || "500mg";
    const dosageForm = String(raw.dosageForm || raw.form || "").trim() || "Tablet";
    const packSize = String(raw.packSize || raw.pack || "").trim() || "10 Tablets/Strip";

    const purchasePrice = parseFloat(raw.purchasePrice || raw.costPrice || raw.cost || "0") || 0;
    const sellingPrice = parseFloat(raw.sellingPrice || raw.unitPrice || raw.price || "0") || 0;
    const wholesalePrice = parseFloat(raw.wholesalePrice || raw.tradePrice || "0") || Math.round(sellingPrice * 0.85);

    const stock = parseInt(raw.stock || raw.quantity || raw.qty || "0") || 0;
    const minStock = parseInt(raw.minStock || raw.reorderLevel || "20") || 20;
    const maxStock = parseInt(raw.maxStock || "500") || 500;

    const location = String(raw.location || raw.shelf || raw.rack || "Shelf A-01").trim();
    const storageTemperature = String(raw.storageTemp || raw.storageTemperature || "15-25°C").trim();

    const prescriptionRequired =
      String(raw.prescriptionRequired || raw.rxRequired || raw.rx || "false").toLowerCase() === "true" ||
      String(raw.prescriptionRequired || raw.rxRequired || raw.rx || "false") === "1";

    const isControlledDrug =
      String(raw.isControlledDrug || raw.controlled || "false").toLowerCase() === "true" ||
      String(raw.isControlledDrug || raw.controlled || "false") === "1";

    const batchNumber = String(raw.batchNumber || raw.batch || raw.batchNo || `BATCH-${Date.now().toString().slice(-4)}`).trim();

    // Dates
    let mfgDate = String(raw.mfgDate || raw.manufactureDate || new Date().toISOString().split("T")[0]).trim();
    let expiryDate = String(raw.expiryDate || raw.expDate || raw.expiry || "").trim();

    // 1. Validation Errors
    if (!name) {
      errors.push("Medicine Name is required.");
    }
    if (!category) {
      errors.push("Category is required.");
    }
    if (sellingPrice <= 0) {
      errors.push("Selling Price must be greater than 0.");
    }
    if (purchasePrice < 0) {
      errors.push("Purchase Price cannot be negative.");
    }
    if (stock < 0) {
      errors.push("Stock quantity cannot be negative.");
    }

    // Date formatting & verification
    if (!expiryDate) {
      errors.push("Expiry Date is required.");
    } else {
      const expTimestamp = Date.parse(expiryDate);
      if (isNaN(expTimestamp)) {
        errors.push(`Invalid Expiry Date format: '${expiryDate}'. Use YYYY-MM-DD.`);
      } else {
        // Formatted standard YYYY-MM-DD
        expiryDate = new Date(expTimestamp).toISOString().split("T")[0];
        const diffDays = Math.ceil((expTimestamp - Date.now()) / (1000 * 3600 * 24));

        if (diffDays <= 0) {
          warnings.push("Product batch is already EXPIRED.");
        } else if (diffDays <= 90) {
          warnings.push(`Near Expiry Warning: Batch expires in ${diffDays} days.`);
        }
      }
    }

    // Additional Warnings
    if (sellingPrice > 0 && purchasePrice > 0 && sellingPrice < purchasePrice) {
      warnings.push("Negative Profit Margin: Selling Price is lower than Purchase Cost.");
    }
    if (stock <= minStock) {
      warnings.push(`Low Stock Alert: Initial stock (${stock}) is at or below minimum threshold (${minStock}).`);
    }

    let status: ParsedRow["status"] = "VALID";
    if (errors.length > 0) {
      status = "ERROR";
    } else if (warnings.length > 0) {
      status = "WARNING";
    }

    return {
      rowIndex: index + 1,
      data: {
        name,
        genericName,
        brandName,
        category,
        manufacturer,
        strength,
        dosageForm,
        packSize,
        purchasePrice,
        sellingPrice,
        wholesalePrice,
        stock,
        minStock,
        maxStock,
        location,
        storageTemperature,
        prescriptionRequired,
        isControlledDrug,
        batchNumber,
        mfgDate,
        expiryDate,
      },
      status,
      errors,
      warnings,
    };
  };

  // Process Uploaded File Text
  const processCsvText = (text: string) => {
    const lines = text
      .split(/\r\n|\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      alert("Uploaded file is empty or missing data rows.");
      return;
    }

    // Extract Headers
    const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

    const mappedRows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const lineValues = parseCsvLine(lines[i]);
      if (lineValues.length === 0 || (lineValues.length === 1 && lineValues[0] === "")) continue;

      const rowObj: Record<string, string> = {};

      rawHeaders.forEach((header, idx) => {
        const val = lineValues[idx] || "";
        if (header.includes("name") || header.includes("medicine")) rowObj.name = val;
        else if (header.includes("generic")) rowObj.genericName = val;
        else if (header.includes("brand")) rowObj.brandName = val;
        else if (header.includes("cat")) rowObj.category = val;
        else if (header.includes("manuf") || header.includes("company")) rowObj.manufacturer = val;
        else if (header.includes("strength")) rowObj.strength = val;
        else if (header.includes("dosage") || header.includes("form")) rowObj.dosageForm = val;
        else if (header.includes("pack")) rowObj.packSize = val;
        else if (header.includes("purchase") || header.includes("cost")) rowObj.purchasePrice = val;
        else if (header.includes("selling") || header.includes("unit") || header.includes("price") || header.includes("mrp"))
          rowObj.sellingPrice = val;
        else if (header.includes("wholesale") || header.includes("trade")) rowObj.wholesalePrice = val;
        else if (header.includes("stock") || header.includes("qty") || header.includes("quantity")) rowObj.stock = val;
        else if (header.includes("min")) rowObj.minStock = val;
        else if (header.includes("max")) rowObj.maxStock = val;
        else if (header.includes("location") || header.includes("shelf") || header.includes("rack")) rowObj.location = val;
        else if (header.includes("temp") || header.includes("storage")) rowObj.storageTemp = val;
        else if (header.includes("rx") || header.includes("prescrip")) rowObj.prescriptionRequired = val;
        else if (header.includes("control")) rowObj.isControlledDrug = val;
        else if (header.includes("batch")) rowObj.batchNumber = val;
        else if (header.includes("mfg") || header.includes("manufdate")) rowObj.mfgDate = val;
        else if (header.includes("exp") || header.includes("expiry")) rowObj.expiryDate = val;
      });

      const parsed = validateRow(rowObj, i - 1);
      mappedRows.push(parsed);
    }

    setParsedRows(mappedRows);
    setStep("PREVIEW");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          processCsvText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          processCsvText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Inline Row Save
  const handleSaveEditedRow = (rowIndex: number) => {
    if (!editingRowData) return;

    // Re-validate row
    const updatedRow = validateRow(editingRowData, rowIndex - 1);
    setParsedRows((prev) => prev.map((r) => (r.rowIndex === rowIndex ? updatedRow : r)));
    setEditingRowIndex(null);
    setEditingRowData(null);
  };

  // Remove Row from Import List
  const handleRemoveRow = (rowIndex: number) => {
    setParsedRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex));
  };

  // Execute Bulk Import
  const handleExecuteImport = () => {
    const rowsToImport = parsedRows.filter((r) => r.status !== "ERROR");

    if (rowsToImport.length === 0) {
      alert("There are no valid rows to import. Please resolve validation errors or upload a corrected file.");
      return;
    }

    let totalStockAdded = 0;
    let totalValueAdded = 0;
    let warningCount = 0;

    rowsToImport.forEach((row) => {
      const d = row.data;

      const medPayload: Partial<Medicine> = {
        name: d.name,
        genericName: d.genericName,
        brandName: d.brandName,
        category: d.category,
        manufacturer: d.manufacturer,
        strength: d.strength,
        dosageForm: d.dosageForm,
        packSize: d.packSize,
        purchasePrice: d.purchasePrice,
        sellingPrice: d.sellingPrice,
        wholesalePrice: d.wholesalePrice,
        stock: d.stock,
        minStock: d.minStock,
        maxStock: d.maxStock,
        location: d.location,
        storageTemperature: d.storageTemperature,
        prescriptionRequired: d.prescriptionRequired,
        isControlledDrug: d.isControlledDrug,
        batches: [
          {
            batchNumber: d.batchNumber,
            mfgDate: d.mfgDate,
            expiryDate: d.expiryDate,
            purchasePrice: d.purchasePrice,
            sellingPrice: d.sellingPrice,
            quantity: d.stock,
            supplierId: "sup-1",
          },
        ],
      };

      addMedicine(medPayload);

      totalStockAdded += d.stock;
      totalValueAdded += d.stock * d.purchasePrice;
      if (row.warnings.length > 0) warningCount++;
    });

    setImportSummary({
      importedCount: rowsToImport.length,
      totalStockAdded,
      totalValueAdded,
      warningCount,
    });

    addAuditLog(
      "Bulk Catalog CSV Import",
      `Successfully imported ${rowsToImport.length} medicine records with ${totalStockAdded} total stock units valued at ${formatCurrency(totalValueAdded)}.`
    );

    setStep("SUCCESS");
  };

  // Subtotals
  const validCount = parsedRows.filter((r) => r.status === "VALID").length;
  const warningCount = parsedRows.filter((r) => r.status === "WARNING").length;
  const errorCount = parsedRows.filter((r) => r.status === "ERROR").length;

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (statusFilter === "VALID") return r.status === "VALID";
    if (statusFilter === "WARNING") return r.status === "WARNING";
    if (statusFilter === "ERROR") return r.status === "ERROR";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Bulk Medicine Catalog Import (CSV/Excel)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Import large product catalogs with batch numbers, expiration dates, prices, and locations.
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              {/* Top Template Downloads & Instructions Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Download Pre-Formatted Inventory Template</span>
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                    Use our standardized CSV template with pre-configured header columns for batches, FEFO expiry dates, and categories.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all shrink-0 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .tsv, .txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="p-4 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Upload className="h-8 w-8 animate-bounce" />
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Click to browse or Drag & Drop your inventory CSV file
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Supports <strong className="text-slate-700 dark:text-slate-300">.csv</strong>, <strong className="text-slate-700 dark:text-slate-300">.tsv</strong>, or exported Excel spreadsheet text files.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  Max file size: 10MB
                </span>
              </div>

              {/* Field Reference Specs */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-slate-500" />
                  <span>CSV Required & Supported Column Headers</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-blue-600 dark:text-blue-400 font-mono">Name *</strong>
                    <p className="text-slate-500 text-[10px]">Medicine / Drug Name</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-blue-600 dark:text-blue-400 font-mono">Category *</strong>
                    <p className="text-slate-500 text-[10px]">Drug Category</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-blue-600 dark:text-blue-400 font-mono">Selling Price *</strong>
                    <p className="text-slate-500 text-[10px]">Retail Price per unit</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-blue-600 dark:text-blue-400 font-mono">Expiry Date *</strong>
                    <p className="text-slate-500 text-[10px]">YYYY-MM-DD format</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">Batch Number</strong>
                    <p className="text-slate-500 text-[10px]">Lot or Batch code</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">Stock / Qty</strong>
                    <p className="text-slate-500 text-[10px]">Initial pack quantity</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">Purchase Price</strong>
                    <p className="text-slate-500 text-[10px]">Cost price from supplier</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-700 dark:text-slate-300 font-mono">Location</strong>
                    <p className="text-slate-500 text-[10px]">Shelf, aisle or locker</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & FIELD VALIDATION */}
          {step === "PREVIEW" && (
            <div className="space-y-4">
              {/* Summary Stats Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-extrabold text-slate-500">Total Rows</span>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100">{parsedRows.length}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid Ready
                  </span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{validCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                  <span className="text-[10px] uppercase font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Has Warnings
                  </span>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300">{warningCount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
                  <span className="text-[10px] uppercase font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> Validation Errors
                  </span>
                  <div className="text-xl font-black text-rose-700 dark:text-rose-300">{errorCount}</div>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === "ALL"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    All Rows ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("VALID")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === "VALID"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Valid Only ({validCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("WARNING")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === "WARNING"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Warnings ({warningCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter("ERROR")}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      statusFilter === "ERROR"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Errors ({errorCount})
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep("UPLOAD");
                    setParsedRows([]);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Re-upload File</span>
                </button>
              </div>

              {/* Data Validation Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Row #</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Medicine & Category</th>
                      <th className="p-3">Batch & Expiry</th>
                      <th className="p-3">Prices</th>
                      <th className="p-3">Stock & Shelf</th>
                      <th className="p-3 text-center">Validation Messages</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredPreviewRows.map((row) => {
                      const isEditing = editingRowIndex === row.rowIndex;

                      return (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                            row.status === "ERROR"
                              ? "bg-rose-50/20 dark:bg-rose-950/10"
                              : row.status === "WARNING"
                              ? "bg-amber-50/20 dark:bg-amber-950/10"
                              : ""
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-400">#{row.rowIndex}</td>

                          <td className="p-3">
                            {row.status === "VALID" && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] flex items-center gap-1 w-fit border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" /> Valid
                              </span>
                            )}
                            {row.status === "WARNING" && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] flex items-center gap-1 w-fit border border-amber-500/20">
                                <AlertTriangle className="h-3 w-3" /> Warning
                              </span>
                            )}
                            {row.status === "ERROR" && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] flex items-center gap-1 w-fit border border-rose-500/20">
                                <XCircle className="h-3 w-3" /> Invalid
                              </span>
                            )}
                          </td>

                          <td className="p-3 max-w-xs">
                            {!isEditing ? (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">{row.data.name}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {row.data.category} • {row.data.strength}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editingRowData?.name || ""}
                                  onChange={(e) =>
                                    setEditingRowData((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                  }
                                  placeholder="Medicine Name *"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded font-bold text-xs"
                                />
                                <input
                                  type="text"
                                  value={editingRowData?.category || ""}
                                  onChange={(e) =>
                                    setEditingRowData((prev) => (prev ? { ...prev, category: e.target.value } : null))
                                  }
                                  placeholder="Category *"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border border-slate-300 rounded text-xs"
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            {!isEditing ? (
                              <div>
                                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {row.data.batchNumber}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500">Exp: {row.data.expiryDate}</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editingRowData?.batchNumber || ""}
                                  onChange={(e) =>
                                    setEditingRowData((prev) =>
                                      prev ? { ...prev, batchNumber: e.target.value } : null
                                    )
                                  }
                                  placeholder="Batch #"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded font-mono text-xs"
                                />
                                <input
                                  type="date"
                                  value={editingRowData?.expiryDate || ""}
                                  onChange={(e) =>
                                    setEditingRowData((prev) =>
                                      prev ? { ...prev, expiryDate: e.target.value } : null
                                    )
                                  }
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded font-mono text-xs"
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-mono">
                            {!isEditing ? (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  Sell: {formatCurrency(row.data.sellingPrice)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Cost: {formatCurrency(row.data.purchasePrice)}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  value={editingRowData?.sellingPrice || 0}
                                  onChange={(e) =>
                                    setEditingRowData((prev) =>
                                      prev ? { ...prev, sellingPrice: parseFloat(e.target.value) || 0 } : null
                                    )
                                  }
                                  placeholder="Sell Price"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded font-mono text-xs"
                                />
                                <input
                                  type="number"
                                  value={editingRowData?.purchasePrice || 0}
                                  onChange={(e) =>
                                    setEditingRowData((prev) =>
                                      prev ? { ...prev, purchasePrice: parseFloat(e.target.value) || 0 } : null
                                    )
                                  }
                                  placeholder="Cost Price"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded font-mono text-xs"
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-mono">
                            {!isEditing ? (
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-100">{row.data.stock} units</div>
                                <div className="text-[10px] text-slate-400">{row.data.location}</div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  value={editingRowData?.stock || 0}
                                  onChange={(e) =>
                                    setEditingRowData((prev) =>
                                      prev ? { ...prev, stock: parseInt(e.target.value) || 0 } : null
                                    )
                                  }
                                  placeholder="Stock"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded font-mono text-xs"
                                />
                                <input
                                  type="text"
                                  value={editingRowData?.location || ""}
                                  onChange={(e) =>
                                    setEditingRowData((prev) => (prev ? { ...prev, location: e.target.value } : null))
                                  }
                                  placeholder="Location"
                                  className="w-full p-1 bg-white dark:bg-slate-900 border rounded text-xs"
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-xs max-w-xs">
                            {row.errors.map((err, idx) => (
                              <div key={idx} className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                                • {err}
                              </div>
                            ))}
                            {row.warnings.map((warn, idx) => (
                              <div key={idx} className="text-amber-600 dark:text-amber-400 text-[11px] flex items-center gap-1">
                                • {warn}
                              </div>
                            ))}
                            {row.errors.length === 0 && row.warnings.length === 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Ready to import</span>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isEditing ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingRowIndex(row.rowIndex);
                                      setEditingRowData({ ...row.data });
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                                    title="Edit Row Data"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRow(row.rowIndex)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                                    title="Remove Row"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleSaveEditedRow(row.rowIndex)}
                                    className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                                    title="Save Corrections"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingRowIndex(null);
                                      setEditingRowData(null);
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-200 text-slate-700"
                                    title="Cancel Edit"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === "SUCCESS" && (
            <div className="p-8 text-center space-y-6 max-w-lg mx-auto">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-20 h-20 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  Bulk Import Completed Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Product catalog, FEFO batch details, and initial stock quantities have been added to the system inventory.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border text-left text-xs">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Products Added</span>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {importSummary.importedCount}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Total Stock</span>
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {importSummary.totalStockAdded} units
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Catalog Value</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(importSummary.totalValueAdded)}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all"
              >
                Return to Medicine Inventory
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step === "PREVIEW" && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500">
              {validCount + warningCount} valid item(s) will be added to inventory. ({errorCount} invalid rows will be skipped)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("UPLOAD")}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                Back
              </button>

              <button
                onClick={handleExecuteImport}
                disabled={validCount + warningCount === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                <span>Commit & Import {validCount + warningCount} Medicines</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  QrCode,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Barcode,
  Camera,
  Search,
  Grid,
  History,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { PosCartItem } from "../../types/pharmacy";

export interface ScanLogEntry {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  barcode: string;
  unitPrice: number;
  dosageForm: string;
  strength: string;
  scannedAt: string;
  timestamp: number;
  scanSource?: "BARCODE_INPUT" | "CAMERA_SCANNER" | "GLOBAL_SEARCH" | "CATALOG_CLICK" | "HOLD_RESTORE";
}

interface ScanLogWidgetProps {
  scanLog: ScanLogEntry[];
  cart: PosCartItem[];
  onRemoveItem: (entry: ScanLogEntry) => void;
  onClearLog: () => void;
  formatCurrency: (amount: number) => string;
}

export const ScanLogWidget: React.FC<ScanLogWidgetProps> = ({
  scanLog,
  cart,
  onRemoveItem,
  onClearLog,
  formatCurrency,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getSourceBadge = (source?: ScanLogEntry["scanSource"]) => {
    switch (source) {
      case "BARCODE_INPUT":
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
            <Barcode className="h-2.5 w-2.5" /> Laser Barcode
          </span>
        );
      case "CAMERA_SCANNER":
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
            <Camera className="h-2.5 w-2.5" /> Camera QR
          </span>
        );
      case "GLOBAL_SEARCH":
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1">
            <Search className="h-2.5 w-2.5" /> Instant Search
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <Grid className="h-2.5 w-2.5" /> Catalog Select
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Widget Header */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Scan Verification Log
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Last {scanLog.length} {scanLog.length === 1 ? "Item" : "Items"}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Verify scans & quickly remove mis-scanned medicines before checkout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {scanLog.length > 0 && (
            <button
              type="button"
              onClick={onClearLog}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
              title="Clear scan history log"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? "Expand Scan Log" : "Collapse Scan Log"}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="p-3">
          {scanLog.length === 0 ? (
            <div className="py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <History className="h-6 w-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No items scanned yet
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-0.5">
                Scan a barcode using camera or laser scanner to see instant verification entries here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scanLog.map((entry, index) => {
                const cartItem = cart.find((i) => i.medicine.id === entry.medicineId);
                const isInCart = Boolean(cartItem && cartItem.quantity > 0);

                return (
                  <div
                    key={entry.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      index === 0
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60"
                    }`}
                  >
                    {/* Left: Item Info */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">
                        {index === 0 ? (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        ) : (
                          <span className="inline-block h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {entry.medicineName}
                          </h5>
                          {getSourceBadge(entry.scanSource)}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {entry.scannedAt}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          <span>{entry.genericName}</span>
                          {entry.strength && <span>• {entry.strength}</span>}
                          <span className="font-mono bg-slate-200/70 dark:bg-slate-700/60 px-1.5 py-0.2 rounded text-[9px] text-slate-700 dark:text-slate-300">
                            BC: {entry.barcode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Cart Status & Remove Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                          {formatCurrency(entry.unitPrice)}
                        </span>
                        {isInCart ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            In Cart ({cartItem?.quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500">
                            <XCircle className="h-3 w-3" />
                            Removed
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(entry)}
                        disabled={!isInCart}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                          isInCart
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                        }`}
                        title={isInCart ? "Remove 1 unit of this scanned item from cart" : "Item not in cart"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

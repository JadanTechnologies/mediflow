import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Medicine } from "../../types/pharmacy";
import {
  Camera,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Info,
  Barcode,
  Search,
} from "lucide-react";

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  onScanSuccess: (medicine: Medicine, scannedCode: string) => void;
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  medicines,
  onScanSuccess,
}) => {
  const [scannerId] = useState(() => `reader-${Math.random().toString(36).substr(2, 9)}`);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [lastScannedItem, setLastScannedItem] = useState<Medicine | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(true);
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Audio Beep generator using Web Audio API
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5 pitch
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context playback error", e);
    }
  };

  // Helper to match code against medicines
  const findMedicineByCode = (code: string): Medicine | undefined => {
    const cleanCode = code.trim().toLowerCase();
    return medicines.find((m) => {
      if (m.barcode && m.barcode.toLowerCase() === cleanCode) return true;
      if (m.sku && m.sku.toLowerCase() === cleanCode) return true;
      if (m.id.toLowerCase() === cleanCode) return true;
      // Check batch barcodes
      if (m.batches && m.batches.some((b) => b.batchNumber.toLowerCase() === cleanCode)) return true;
      // Check name match if code is text
      if (m.name.toLowerCase().includes(cleanCode)) return true;
      return false;
    });
  };

  const handleBarCodeMatch = (decodedText: string) => {
    setLastScannedCode(decodedText);

    const foundMed = findMedicineByCode(decodedText);

    if (foundMed) {
      playBeepSound();
      setLastScannedItem(foundMed);
      setErrorMessage("");
      onScanSuccess(foundMed, decodedText);

      if (!continuousMode) {
        stopScanner();
        onClose();
      }
    } else {
      setErrorMessage(`Barcode "${decodedText}" not matched to any medicine in inventory.`);
      setTimeout(() => setErrorMessage(""), 4000);
    }
  };

  // Start Scanner
  const startScanner = async (cameraIdToUse?: string) => {
    setErrorMessage("");
    try {
      const availableDevices = await Html5Qrcode.getCameras();
      setCameras(availableDevices);

      if (availableDevices && availableDevices.length > 0) {
        const targetCam =
          cameraIdToUse ||
          selectedCameraId ||
          availableDevices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"))?.id ||
          availableDevices[0].id;

        setSelectedCameraId(targetCam);

        if (!html5QrcodeRef.current) {
          html5QrcodeRef.current = new Html5Qrcode(scannerId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ],
            verbose: false,
          });
        }

        await html5QrcodeRef.current.start(
          targetCam,
          {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.33333,
          },
          (decodedText) => {
            handleBarCodeMatch(decodedText);
          },
          () => {
            // Frame search heartbeat
          }
        );

        setIsScanning(true);
      } else {
        setErrorMessage("No camera devices found on this device.");
      }
    } catch (err: any) {
      console.error("Camera scanner initialization error:", err);
      setErrorMessage(
        err?.message || "Failed to access camera. Please check camera permissions in browser settings."
      );
      setIsScanning(false);
    }
  };

  // Stop Scanner
  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop scanner cleanly:", err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly to ensure modal DOM container is mounted
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Manual code entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleBarCodeMatch(manualCodeInput);
    setManualCodeInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>POS Camera Barcode Scanner</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-extrabold border border-emerald-500/20">
                  LIVE 15 FPS
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Point device camera at medication barcode or QR code to auto-add to cart.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Controls Bar */}
          <div className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold ${
                  soundEnabled
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 border-blue-200 dark:border-blue-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
                title="Toggle Beep Sound"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <span className="text-[11px]">{soundEnabled ? "Audio On" : "Muted"}</span>
              </button>

              <button
                onClick={() => setContinuousMode(!continuousMode)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 font-bold ${
                  continuousMode
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border-emerald-200 dark:border-emerald-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                }`}
                title="Continuous Multi-Item Scan"
              >
                <Zap className="h-4 w-4" />
                <span className="text-[11px]">{continuousMode ? "Continuous" : "Single Scan"}</span>
              </button>
            </div>

            {/* Camera Switcher */}
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  const camId = e.target.value;
                  stopScanner().then(() => startScanner(camId));
                }}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 max-w-[140px] truncate"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.substr(0, 5)}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scanner Element Container */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-slate-800 min-h-[260px] flex items-center justify-center shadow-inner">
            <div id={scannerId} className="w-full h-full overflow-hidden" />

            {!isScanning && !errorMessage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 bg-slate-950/90">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-xs font-bold text-slate-300">Initializing camera video feed...</p>
              </div>
            )}

            {/* Scan Overlay Crosshair Effect */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-40 border-2 border-emerald-500 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)] relative animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5"></div>
                  <div className="w-full h-0.5 bg-red-500/80 absolute top-1/2 -translate-y-1/2 shadow-xs"></div>
                </div>
              </div>
            )}
          </div>

          {/* Success / Alert Toast Feedback */}
          {lastScannedItem && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider block">
                    Added to POS Cart
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {lastScannedItem.name}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-500">
                    Barcode: {lastScannedCode} • Price: ₦{lastScannedItem.sellingPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs">
                +1 Qty
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Manual Barcode / SKU Fallback Form */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Barcode className="h-3.5 w-3.5 text-blue-600" />
              <span>Or Type / USB Scanner Barcode manually:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="e.g. 8901234567890 or SKU..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-sm"
              >
                Find & Add
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            <span>Supported: EAN-13, EAN-8, Code-128, QR, UPC</span>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Lock, X, KeyRound, CheckCircle2 } from "lucide-react";
import { usePharmacy } from "../../context/PharmacyContext";
import { UserRole } from "../../types/pharmacy";

interface SuperAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetRole?: UserRole;
}

export const SuperAdminPinModal: React.FC<SuperAdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRole = "Super Admin",
}) => {
  const { systemUsers, addAuditLog } = usePharmacy();
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Find Super Admin PINs or master default PINs (9999, 1234, or Super Admin user PINs)
  const superAdminUsers = systemUsers.filter((u) => u.roleName === "Super Admin");
  const validPins = ["9999", "1234", ...superAdminUsers.map((u) => u.pin)];

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (validPins.includes(pinInput.trim())) {
      setIsSuccess(true);
      addAuditLog(
        "Super Admin Switch Authorized",
        `Privileges elevated to Super Admin via PIN verification.`
      );
      setTimeout(() => {
        setIsSuccess(false);
        setPinInput("");
        onSuccess();
        onClose();
      }, 500);
    } else {
      setErrorMsg("Invalid PIN. Only authorized Super Admin credentials can elevate role privileges.");
      setPinInput("");
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + num);
      setErrorMsg("");
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="h-7 w-7" />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-slate-100">
            Super Admin Authorization Required
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Switching to <span className="font-bold text-amber-600 dark:text-amber-400">{targetRole}</span> grants unrestricted enterprise controls. Please verify master PIN.
          </p>
        </div>

        {/* PIN Display */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-center items-center gap-2.5 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <KeyRound className="h-4 w-4 text-slate-400 mr-1" />
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-mono font-extrabold text-lg transition-all ${
                  pinInput[idx]
                    ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-300"
                }`}
              >
                {pinInput[idx] ? "•" : ""}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>PIN Verified! Switching to Super Admin...</span>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg transition-colors active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinInput("")}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-500 font-bold text-xs transition-colors"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-lg transition-colors active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              ⌫
            </button>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Verify & Unlock</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] text-slate-400">
              Demo Master Super Admin PIN: <span className="font-mono font-bold text-amber-600">9999</span> or <span className="font-mono font-bold text-amber-600">1234</span>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

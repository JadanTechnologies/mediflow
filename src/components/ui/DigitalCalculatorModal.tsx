import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Delete, Calculator as CalcIcon, Copy, Check, Sparkles, LogOut, Keyboard } from "lucide-react";
import { playClickSound } from "../../utils/audio";

interface DigitalCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValue?: (val: number) => void;
}

export const DigitalCalculatorModal: React.FC<DigitalCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyValue,
}) => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut listener for digits, operators, backspace, enter, ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        playClickSound();
        setDisplay((prev) => (prev === "0" || prev === "Error" ? e.key : prev + e.key));
        return;
      }

      if (e.key === ".") {
        e.preventDefault();
        playClickSound();
        setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
        return;
      }

      if (e.key === "+" || e.key === "-") {
        e.preventDefault();
        playClickSound();
        setEquation(`${display} ${e.key} `);
        setDisplay("0");
        return;
      }

      if (e.key === "*") {
        e.preventDefault();
        playClickSound();
        setEquation(`${display} × `);
        setDisplay("0");
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        playClickSound();
        setEquation(`${display} ÷ `);
        setDisplay("0");
        return;
      }

      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        handleEquals();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        playClickSound();
        setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
        return;
      }

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        playClickSound();
        setDisplay("0");
        setEquation("");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, display, equation]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    playClickSound();
    if (display === "0" || display === "Error") {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    playClickSound();
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperator = (op: string) => {
    playClickSound();
    setEquation(`${display} ${op} `);
    setDisplay("0");
  };

  const handleClear = () => {
    playClickSound();
    setDisplay("0");
    setEquation("");
  };

  const handleBackspace = () => {
    playClickSound();
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleToggleSign = () => {
    playClickSound();
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay((-val).toString());
    }
  };

  const handlePercentage = () => {
    playClickSound();
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay((val / 100).toString());
    }
  };

  const handleEquals = () => {
    playClickSound();
    try {
      if (!equation) return;
      const parts = equation.trim().split(" ");
      if (parts.length < 2) return;

      const num1 = parseFloat(parts[0]);
      const op = parts[1];
      const num2 = parseFloat(display);

      let result = 0;
      if (op === "+") result = num1 + num2;
      else if (op === "-") result = num1 - num2;
      else if (op === "×" || op === "*") result = num1 * num2;
      else if (op === "÷" || op === "/") {
        if (num2 === 0) {
          setDisplay("Error");
          setEquation("");
          return;
        }
        result = num1 / num2;
      }

      // Round cleanly to 4 decimals
      const finalRes = Math.round(result * 10000) / 10000;
      setEquation(`${equation}${display} =`);
      setDisplay(finalRes.toString());
    } catch (e) {
      setDisplay("Error");
    }
  };

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    playClickSound();
    const val = parseFloat(display);
    if (!isNaN(val) && onApplyValue) {
      onApplyValue(val);
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="calc-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <motion.div
            key="calc-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xs sm:max-w-sm shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] shrink-0"
          >
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <CalcIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Digital Pharmacy Calculator
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Keyboard className="h-3 w-3 text-blue-500" />
                    <span>Numpad & Keyboard Enabled</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-colors flex items-center gap-1"
                title="Close Calculator (ESC)"
              >
                <span>Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Display Screen */}
            <div className="p-4 bg-slate-950 text-white flex flex-col items-end justify-end min-h-[90px] border-b border-slate-800 relative shadow-inner shrink-0">
              <div className="text-xs text-slate-400 font-mono h-5 overflow-hidden">
                {equation}
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400 break-all select-all">
                {display}
              </div>

              <button
                onClick={handleCopy}
                className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                title="Copy current display value"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Keypad Grid */}
            <div className="p-3 sm:p-4 grid grid-cols-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto flex-1">
              {/* Top Row Functions */}
              <button
                onClick={handleClear}
                className="py-2.5 sm:py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-500/20 transition-all active:scale-95"
              >
                AC
              </button>
              <button
                onClick={handleBackspace}
                className="py-2.5 sm:py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
              >
                <Delete className="h-4 w-4" />
              </button>
              <button
                onClick={handlePercentage}
                className="py-2.5 sm:py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all active:scale-95"
              >
                %
              </button>
              <button
                onClick={() => handleOperator("÷")}
                className="py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xs shadow-blue-600/20 transition-all active:scale-95"
              >
                ÷
              </button>

              {/* Digits 7 8 9 & multiply */}
              <button
                onClick={() => handleDigit("7")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                7
              </button>
              <button
                onClick={() => handleDigit("8")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                8
              </button>
              <button
                onClick={() => handleDigit("9")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                9
              </button>
              <button
                onClick={() => handleOperator("×")}
                className="py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xs shadow-blue-600/20 transition-all active:scale-95"
              >
                ×
              </button>

              {/* Digits 4 5 6 & subtract */}
              <button
                onClick={() => handleDigit("4")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                4
              </button>
              <button
                onClick={() => handleDigit("5")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                5
              </button>
              <button
                onClick={() => handleDigit("6")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                6
              </button>
              <button
                onClick={() => handleOperator("-")}
                className="py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xs shadow-blue-600/20 transition-all active:scale-95"
              >
                -
              </button>

              {/* Digits 1 2 3 & add */}
              <button
                onClick={() => handleDigit("1")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                1
              </button>
              <button
                onClick={() => handleDigit("2")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                2
              </button>
              <button
                onClick={() => handleDigit("3")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                3
              </button>
              <button
                onClick={() => handleOperator("+")}
                className="py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base shadow-xs shadow-blue-600/20 transition-all active:scale-95"
              >
                +
              </button>

              {/* Bottom Row +/- 0 . = */}
              <button
                onClick={handleToggleSign}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                ±
              </button>
              <button
                onClick={() => handleDigit("0")}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDecimal}
                className="py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-base shadow-2xs border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
              >
                .
              </button>
              <button
                onClick={handleEquals}
                className="py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                =
              </button>
            </div>

            {/* Apply value trigger or general dismiss footer */}
            <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2 shrink-0">
              {onApplyValue ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Use ₦{parseFloat(display || "0").toLocaleString()} in POS</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Dismiss Calculator (ESC)</span>
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

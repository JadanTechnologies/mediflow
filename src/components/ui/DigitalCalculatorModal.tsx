import React, { useState } from "react";
import { X, Delete, Calculator as CalcIcon, Copy, Check, Sparkles, Percent } from "lucide-react";
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
  const [memory, setMemory] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xs shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <CalcIcon className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
              Pharmacy Calculator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-900 text-white flex flex-col items-end justify-end min-h-[100px] border-b border-slate-800 relative">
          <div className="text-[11px] text-slate-400 font-mono h-5 overflow-hidden">
            {equation}
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-400 break-all">
            {display}
          </div>

          <button
            onClick={handleCopy}
            className="absolute top-3 left-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
            title="Copy value"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Keypad */}
        <div className="p-3.5 grid grid-cols-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Top Row Functions */}
          <button
            onClick={handleClear}
            className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-extrabold text-xs border border-rose-500/20"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center"
          >
            <Delete className="h-4 w-4" />
          </button>
          <button
            onClick={handlePercentage}
            className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            %
          </button>
          <button
            onClick={() => handleOperator("÷")}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xs"
          >
            ÷
          </button>

          {/* Digits 7 8 9 & multiply */}
          <button
            onClick={() => handleDigit("7")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            7
          </button>
          <button
            onClick={() => handleDigit("8")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            8
          </button>
          <button
            onClick={() => handleDigit("9")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            9
          </button>
          <button
            onClick={() => handleOperator("×")}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xs"
          >
            ×
          </button>

          {/* Digits 4 5 6 & subtract */}
          <button
            onClick={() => handleDigit("4")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            4
          </button>
          <button
            onClick={() => handleDigit("5")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            5
          </button>
          <button
            onClick={() => handleDigit("6")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            6
          </button>
          <button
            onClick={() => handleOperator("-")}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xs"
          >
            -
          </button>

          {/* Digits 1 2 3 & add */}
          <button
            onClick={() => handleDigit("1")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            1
          </button>
          <button
            onClick={() => handleDigit("2")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            2
          </button>
          <button
            onClick={() => handleDigit("3")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            3
          </button>
          <button
            onClick={() => handleOperator("+")}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-xs"
          >
            +
          </button>

          {/* Bottom Row +/- 0 . = */}
          <button
            onClick={handleToggleSign}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            ±
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold text-sm shadow-2xs border border-slate-200 dark:border-slate-700"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-md shadow-emerald-600/20"
          >
            =
          </button>
        </div>

        {/* Apply value trigger if requested */}
        {onApplyValue && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <button
              onClick={handleApply}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Use ₦{parseFloat(display || "0").toLocaleString()} in POS</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

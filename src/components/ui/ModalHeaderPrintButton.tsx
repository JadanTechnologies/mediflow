import React from "react";
import { Printer } from "lucide-react";

interface ModalHeaderPrintButtonProps {
  /** Optional custom title for tooltip */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Optional callback triggered before window.print() */
  onPrint?: () => void;
  /** Size variant */
  size?: "sm" | "md";
  /** Variant style */
  variant?: "default" | "ghost" | "floating";
}

export const ModalHeaderPrintButton: React.FC<ModalHeaderPrintButtonProps> = ({
  title = "Print this modal view",
  className = "",
  onPrint,
  size = "md",
  variant = "default",
}) => {
  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Find the enclosing modal card or backdrop
    const buttonEl = e.currentTarget;
    const modalContainer =
      buttonEl.closest(".printable-modal-content") ||
      buttonEl.closest("[role='dialog']") ||
      buttonEl.closest(".fixed > div") ||
      buttonEl.closest(".fixed");

    if (modalContainer && !modalContainer.classList.contains("printable-modal-content")) {
      modalContainer.classList.add("printable-modal-content");
    }

    if (onPrint) {
      onPrint();
    }

    window.print();
  };

  const baseStyles =
    "print:hidden inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all shadow-2xs border cursor-pointer active:scale-95";

  const sizeStyles =
    size === "sm"
      ? "px-2 py-1 text-[11px]"
      : "px-2.5 py-1.5 text-xs";

  const variantStyles =
    variant === "ghost"
      ? "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent"
      : variant === "floating"
      ? "bg-white/90 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border-slate-200 dark:border-slate-700 shadow-sm"
      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border-slate-200 dark:border-slate-700";

  return (
    <button
      type="button"
      onClick={handlePrint}
      title={title}
      aria-label="Print modal content"
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
    >
      <Printer className={size === "sm" ? "h-3.5 w-3.5 text-blue-500" : "h-4 w-4 text-blue-500"} />
      <span className="font-sans">Print</span>
    </button>
  );
};

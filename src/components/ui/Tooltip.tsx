import React, { useState, ReactNode } from "react";

export interface TooltipProps {
  content: ReactNode;
  shortcut?: string;
  position?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  position = "top",
  children,
  delay = 200,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimer(timeout);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full mt-2 left-1/2 -translate-x-1/2";
      case "left":
        return "right-full mr-2 top-1/2 -translate-y-1/2";
      case "right":
        return "left-full ml-2 top-1/2 -translate-y-1/2";
      case "top":
      default:
        return "bottom-full mb-2 left-1/2 -translate-x-1/2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-x-transparent border-t-transparent border-b-4";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-y-transparent border-r-transparent border-l-4";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-y-transparent border-l-transparent border-r-4";
      case "top":
      default:
        return "top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-x-transparent border-b-transparent border-t-4";
    }
  };

  if (!content) return <>{children}</>;

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 pointer-events-none ${getPositionClasses()} animate-fade-in flex flex-col items-center`}
          role="tooltip"
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl shadow-xl border border-slate-700/80 max-w-xs text-center leading-tight flex items-center gap-1.5 whitespace-nowrap">
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-800 dark:bg-slate-700 text-amber-300 rounded border border-slate-600/60 shadow-2xs">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className={`w-0 h-0 border-4 absolute ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
};

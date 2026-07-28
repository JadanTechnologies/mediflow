import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import {
  Search,
  Bell,
  ShoppingCart,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  X,
  Lock,
  UserCheck,
  Globe,
  Sun,
  Moon,
  Calculator as CalcIcon,
  Crown,
  Mic,
  CloudLightning,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { DigitalCalculatorModal } from "../ui/DigitalCalculatorModal";
import { SuperAdminPinModal } from "../auth/SuperAdminPinModal";
import { CloudBackupSyncModal } from "../settings/CloudBackupSyncModal";
import { UserRole } from "../../types/pharmacy";

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    currentBranch,
    setActiveTab,
    medicines,
    globalSearchQuery,
    setGlobalSearchQuery,
    lockTerminal,
    settings,
    systemUsers,
    loginAsUser,
    isDarkMode,
    toggleDarkMode,
    roles,
  } = usePharmacy();

  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCloudBackupModal, setShowCloudBackupModal] = useState(false);
  const [showSuperAdminPinModal, setShowSuperAdminPinModal] = useState(false);
  const [pendingTargetRole, setPendingTargetRole] = useState<UserRole>("Super Admin");

  const lowStockMeds = medicines.filter((m) => m.stock <= m.minStock);
  const nearExpiryBatches: { medicineName: string; batchNumber: string; daysRemaining: number; bracket: string }[] = [];
  
  medicines.forEach((m) => {
    m.batches?.forEach((b) => {
      const exp = new Date(b.expiryDate).getTime();
      const now = new Date().getTime();
      const daysDiff = Math.ceil((exp - now) / (1000 * 3600 * 24));
      if (daysDiff <= 90) {
        let bracket = "90 Days";
        if (daysDiff <= 0) bracket = "EXPIRED";
        else if (daysDiff <= 30) bracket = "30 Days";
        else if (daysDiff <= 60) bracket = "60 Days";

        nearExpiryBatches.push({
          medicineName: m.name,
          batchNumber: b.batchNumber,
          daysRemaining: daysDiff,
          bracket,
        });
      }
    });
  });

  const totalAlerts = lowStockMeds.length + nearExpiryBatches.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between gap-4 print:hidden">
      {/* Global Search Input with Pill styling */}
      <div className="flex-1 max-w-md relative">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full px-4 py-1.5 border border-slate-200/60 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search medications, patients, barcode..."
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0 ml-2 w-full"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery("")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Triggers */}
      <div className="flex items-center space-x-2.5">
        {/* Active Currency Badge */}
        <button
          onClick={() => setActiveTab("settings")}
          className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all"
          title="Active Currency System"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{settings.currencyCode} ({settings.currencySymbol})</span>
        </button>

        <button
          onClick={() => setActiveTab("pos")}
          className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-all"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>POS Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab("prescriptions")}
          className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          <span>New Rx</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">AI Insights</span>
        </button>

        {/* Hands-Free Voice Commands Button */}
        <button
          onClick={() => setActiveTab("pos")}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold transition-colors"
          title="Hands-free Voice Commands (Microphone API)"
        >
          <Mic className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
          <span className="hidden md:inline">Voice Engine</span>
        </button>

        {/* Cloud Database Auto-Sync Button */}
        <button
          onClick={() => setShowCloudBackupModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold transition-colors"
          title="Cloud Database Backup & Automatic Sync"
        >
          <CloudLightning className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden lg:inline">Cloud Sync</span>
        </button>

        {/* Digital Calculator Button */}
        <button
          onClick={() => setShowCalculator(true)}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
          title="Digital Calculator (ESC to skip)"
        >
          <CalcIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>

        {/* Dedicated Theme Toggle Button (Persists in localStorage) */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Lock Screen Button */}
        <button
          onClick={lockTerminal}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Lock Terminal Screen"
        >
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="System Alerts"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotificationDrawer && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 p-5 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pb-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    System Alerts
                  </h3>
                </div>
                <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">
                  {totalAlerts} Active
                </span>
              </div>

              <div className="py-3 space-y-2 max-h-72 overflow-y-auto">
                {lowStockMeds.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 flex items-start gap-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Low Stock: {m.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Stock: <strong className="text-amber-600">{m.stock}</strong> (Min: {m.minStock})
                      </p>
                    </div>
                  </div>
                ))}

                {nearExpiryBatches.map((item, idx) => (
                  <div
                    key={`exp-${item.batchNumber}-${idx}`}
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                      item.bracket === "30 Days" || item.bracket === "EXPIRED"
                        ? "bg-rose-50/60 dark:bg-rose-500/10 border-rose-200/60 dark:border-rose-500/20"
                        : item.bracket === "60 Days"
                        ? "bg-amber-50/60 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20"
                        : "bg-blue-50/60 dark:bg-blue-500/10 border-blue-200/60 dark:border-blue-500/20"
                    }`}
                  >
                    <Clock className={`h-4 w-4 shrink-0 mt-0.5 ${
                      item.bracket === "30 Days" || item.bracket === "EXPIRED"
                        ? "text-rose-600 dark:text-rose-400"
                        : item.bracket === "60 Days"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {item.medicineName}
                        </h4>
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          item.bracket === "30 Days" || item.bracket === "EXPIRED"
                            ? "bg-rose-600 text-white"
                            : item.bracket === "60 Days"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}>
                          {item.bracket}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Batch <strong className="font-mono">{item.batchNumber}</strong> expires in{" "}
                        <strong>{item.daysRemaining} days</strong>.
                      </p>
                    </div>
                  </div>
                ))}

                {totalAlerts === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-green-500" />
                    <span>All inventory levels & expiries are optimal.</span>
                  </div>
                )}
              </div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => {
                    setActiveTab("inventory");
                    setShowNotificationDrawer(false);
                  }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Manage Inventory & Batches →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* User Profile / Quick Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left"
          >
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl shadow-xs flex items-center justify-center font-extrabold text-xs">
              {(currentUser?.name || "JV").slice(0, 2).toUpperCase()}
            </div>
            <div className="text-right text-xs hidden sm:block">
              <p className="font-bold text-slate-900 dark:text-slate-100 leading-none">
                {currentUser?.name || "Dr. Julian Vane"}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold mt-0.5">
                {currentRole} • {currentBranch.code}
              </p>
            </div>
          </button>

          {/* User Account Popover */}
          {showUserDropdown && (
            <div className="absolute right-0 top-12 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 p-4 space-y-3">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Session
                </p>
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                  {currentRole} ({currentBranch.name})
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Role</span>
                  <Crown className="h-3 w-3 text-amber-500" />
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {roles.map((r) => {
                    const isSuperAdminTarget = r.name === "Super Admin";
                    const isNonAdminUser = currentRole !== "Super Admin";
                    const isLockedForUser = isSuperAdminTarget && isNonAdminUser;

                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (isLockedForUser) {
                            setPendingTargetRole(r.name as UserRole);
                            setShowSuperAdminPinModal(true);
                            setShowUserDropdown(false);
                          } else {
                            setCurrentRole(r.name as UserRole);
                            setShowUserDropdown(false);
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg text-left text-[11px] font-bold truncate transition-all flex items-center justify-between gap-1 ${
                          currentRole === r.name
                            ? "bg-blue-600 text-white shadow-2xs"
                            : isLockedForUser
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                        title={
                          isLockedForUser
                            ? "Super Admin authorization PIN required"
                            : `Switch active role to ${r.name}`
                        }
                      >
                        <span className="truncate">{r.name}</span>
                        {isLockedForUser && <Lock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Switch User
                </p>
                {systemUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      loginAsUser(u.id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all ${
                      currentUser?.id === u.id
                        ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="text-[10px] opacity-70 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                      {u.roleName}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
                <button
                  onClick={() => {
                    lockTerminal();
                    setShowUserDropdown(false);
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Lock Terminal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Database Backup & Sync Modal */}
      <CloudBackupSyncModal
        isOpen={showCloudBackupModal}
        onClose={() => setShowCloudBackupModal(false)}
      />

      {/* Digital Calculator Modal */}
      <DigitalCalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Super Admin Authorization Modal */}
      <SuperAdminPinModal
        isOpen={showSuperAdminPinModal}
        onClose={() => setShowSuperAdminPinModal(false)}
        targetRole={pendingTargetRole}
        onSuccess={() => {
          setCurrentRole("Super Admin");
        }}
      />
    </header>
  );
};

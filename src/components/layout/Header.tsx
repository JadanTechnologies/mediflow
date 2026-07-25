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
} from "lucide-react";

export const Header: React.FC = () => {
  const {
    currentRole,
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
  } = usePharmacy();

  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const lowStockMeds = medicines.filter((m) => m.stock <= m.minStock);
  const nearExpiryMeds = medicines.filter((m) =>
    m.batches.some((b) => {
      const exp = new Date(b.expiryDate).getTime();
      const now = new Date().getTime();
      const daysDiff = (exp - now) / (1000 * 3600 * 24);
      return daysDiff <= 60 && daysDiff > 0;
    })
  );

  const totalAlerts = lowStockMeds.length + nearExpiryMeds.length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 lg:px-8 flex items-center justify-between gap-4">
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

                {nearExpiryMeds.map((m) => (
                  <div
                    key={`exp-${m.id}`}
                    className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 flex items-start gap-2.5"
                  >
                    <Clock className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Near Expiry: {m.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Batch expiring within 60 days.
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
    </header>
  );
};

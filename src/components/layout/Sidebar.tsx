import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { UserRole } from "../../types/pharmacy";
import { SuperAdminPinModal } from "../auth/SuperAdminPinModal";
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  FileText,
  Truck,
  Users,
  DollarSign,
  Sparkles,
  BarChart3,
  Settings,
  Moon,
  Sun,
  ShieldAlert,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Activity,
  Menu,
  X,
  Bot,
  Clock,
  Lock,
} from "lucide-react";

const ALL_ROLES: UserRole[] = [
  "Super Admin",
  "Branch Manager",
  "Pharmacist",
  "Cashier",
  "Inventory Officer",
  "Accountant",
  "Doctor",
  "Customer",
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    roles,
    currentBranch,
    setCurrentBranch,
    branches,
    isDarkMode,
    setIsDarkMode,
    medicines,
    prescriptions,
  } = usePharmacy();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showSuperAdminPinModal, setShowSuperAdminPinModal] = useState(false);
  const [pendingTargetRole, setPendingTargetRole] = useState<UserRole>("Super Admin");

  const lowStockCount = medicines.filter((m) => m.stock <= m.minStock).length;
  const pendingRxCount = prescriptions.filter((r) => r.status === "Pending").length;

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "pos",
      label: "POS Dispensing",
      icon: ShoppingCart,
      badge: "Fast",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "inventory",
      label: "Medicines & Stock",
      icon: Pill,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      id: "prescriptions",
      label: "Prescriptions & OCR",
      icon: FileText,
      badge: pendingRxCount > 0 ? `${pendingRxCount} Rx` : null,
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      id: "purchases",
      label: "Purchases & Suppliers",
      icon: Truck,
      badge: null,
    },
    {
      id: "customers",
      label: "Patients & Customers",
      icon: Users,
      badge: null,
    },
    {
      id: "financials",
      label: "Financials & Closing",
      icon: DollarSign,
      badge: null,
    },
    {
      id: "analytics",
      label: "AI Forecasting & Chat",
      icon: Sparkles,
      badge: "AI",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      id: "reports",
      label: "Reports & Logs",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "attendance",
      label: "Staff Attendance & Payroll",
      icon: Clock,
      badge: "HR",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      id: "settings",
      label: "ERP Settings",
      icon: Settings,
      badge: currentRole !== "Super Admin" ? "Admin Only" : null,
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar with toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-xs">
            M
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 text-base">
            MediFlow <span className="text-blue-600">ERP</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out print:hidden ${
          collapsed ? "lg:w-20" : "lg:w-72"
        } w-72 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header with Desktop Collapse Button */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  MediFlow <span className="text-blue-600 dark:text-blue-400">ERP</span>
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  System Online
                </p>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Branch Selector */}
        {!collapsed ? (
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 relative">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5 block px-1">
              Active Branch
            </label>
            <button
              onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate font-semibold">{currentBranch.name}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {isBranchDropdownOpen && (
              <div className="absolute left-4 right-4 top-16 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                {branches.map((br) => (
                  <button
                    key={br.id}
                    onClick={() => {
                      setCurrentBranch(br);
                      setIsBranchDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/70 ${
                      currentBranch.id === br.id ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-slate-700/40" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="truncate">{br.name}</span>
                    {br.isMain && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                        HQ
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="py-3 flex justify-center border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600" title={`Active Branch: ${currentBranch.name}`}>
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {!collapsed && (
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-2">
              Management
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center p-3" : "justify-between p-3"
                } rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-600 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "" : "space-x-3"}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-white" : "text-slate-400"}`} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.badgeColor || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Branch Status Card */}
        {!collapsed && (
          <div className="p-4 m-4 bg-slate-900 rounded-2xl text-white shrink-0 shadow-xs">
            <p className="text-xs text-slate-400 mb-0.5 font-medium">Branch Status</p>
            <p className="text-sm font-semibold truncate">{currentBranch.name}</p>
            <div className="mt-2.5 flex items-center space-x-2 text-[10px] text-slate-300 font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>System Online & Synced</span>
            </div>
          </div>
        )}

        {/* User Role Switcher & Bottom Controls */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 ${collapsed ? "space-y-2 flex flex-col items-center" : "space-y-3"}`}>
          {!collapsed ? (
            <div className="relative">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
                <span>Role Permissions</span>
                <span className="text-blue-600 dark:text-blue-400 text-[9px] font-mono">RBAC</span>
              </div>
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <ShieldAlert className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{currentRole}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute bottom-12 left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {roles.map((r) => {
                    const isSuperAdminTarget = r.name === "Super Admin";
                    const isNonAdminUser = currentRole !== "Super Admin";
                    const isLockedForUser = isSuperAdminTarget && isNonAdminUser;

                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          if (isLockedForUser) {
                            alert("Access Denied: Role switching to Super Admin is prohibited. Only pre-authenticated Super Admin sessions hold Super Admin privileges.");
                            setIsRoleDropdownOpen(false);
                          } else {
                            setCurrentRole(r.name as UserRole);
                            setIsRoleDropdownOpen(false);
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/70 ${
                          currentRole === r.name
                            ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-slate-700/40"
                            : isLockedForUser
                            ? "text-rose-800 dark:text-rose-300 font-medium opacity-80"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span>{r.name}</span>
                          {isLockedForUser && <Lock className="h-3 w-3 text-rose-600 shrink-0" />}
                        </div>
                        {r.name === "Super Admin" && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isLockedForUser
                              ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                          }`}>
                            {isLockedForUser ? "Prohibited" : "Full"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600" title={`Current Role: ${currentRole}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
          )}

          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800"}`}>
            {!collapsed && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>AI Engine Active</span>
              </div>
            )}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>
          </div>

          {!collapsed && (
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">Jadan Tech Solutions Nig Ltd</span>
              <a href="tel:07061511390" className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                07061511390
              </a>
            </div>
          )}
        </div>

        {/* Super Admin Authorization Modal */}
        <SuperAdminPinModal
          isOpen={showSuperAdminPinModal}
          onClose={() => setShowSuperAdminPinModal(false)}
          targetRole={pendingTargetRole}
          onSuccess={() => {
            setCurrentRole("Super Admin");
          }}
        />
      </aside>
    </>
  );
};


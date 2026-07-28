import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  UserRole,
  Branch,
  Medicine,
  Category,
  Supplier,
  CustomerPatient,
  Prescription,
  PosSale,
  PosCartItem,
  PurchaseOrder,
  StockTransfer,
  FinancialRecord,
  AuditLog,
  AppSettings,
  RoleDefinition,
  SystemUser,
  Currency,
  PermissionKey,
  AttendanceRecord,
  PayrollProfile,
  EndOfDayReport,
} from "../types/pharmacy";
import {
  MOCK_BRANCHES,
  MOCK_CATEGORIES,
  MOCK_SUPPLIERS,
  MOCK_MEDICINES,
  MOCK_CUSTOMERS,
  MOCK_PRESCRIPTIONS,
  MOCK_SALES,
  MOCK_PURCHASE_ORDERS,
  MOCK_STOCK_TRANSFERS,
  MOCK_FINANCIALS,
  MOCK_AUDIT_LOGS,
  MOCK_SETTINGS,
  MOCK_ROLES,
  MOCK_USERS,
  MOCK_CURRENCIES,
  ALL_PERMISSIONS,
  MOCK_ATTENDANCE,
  MOCK_PAYROLL_PROFILES,
} from "../data/mockData";
import { createCloudBackup, getCloudSyncConfig } from "../services/cloudBackup";
import { queueOfflineSale } from "../services/offlinePwaService";
import {
  playSuccessChime,
  playBeep,
  playDepositSound,
  playHoldSound,
  playClickSound,
} from "../utils/audio";

interface PharmacyContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  branches: Branch[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDarkMode: () => void;
  
  // Data Collections
  medicines: Medicine[];
  categories: Category[];
  suppliers: Supplier[];
  customers: CustomerPatient[];
  prescriptions: Prescription[];
  sales: PosSale[];
  purchases: PurchaseOrder[];
  transfers: StockTransfer[];
  financials: FinancialRecord[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  attendanceRecords: AttendanceRecord[];
  payrollProfiles: PayrollProfile[];

  // Attendance & Payroll Methods
  clockIn: (targetUserId?: string, notes?: string) => { success: boolean; message: string };
  clockOut: (targetUserId?: string, notes?: string) => { success: boolean; message: string };
  addAttendanceRecord: (record: Partial<AttendanceRecord>) => void;
  getTodayAttendanceStatus: (userId: string) => AttendanceRecord | undefined;

  // RBAC Users & Roles
  roles: RoleDefinition[];
  systemUsers: SystemUser[];
  currentUser: SystemUser | null;
  loginAsUser: (userId: string) => void;
  addSystemUser: (user: Partial<SystemUser>) => void;
  updateSystemUser: (id: string, updated: Partial<SystemUser>) => void;
  assignUserToBranch: (userId: string, branchId: string) => void;
  addRole: (role: Partial<RoleDefinition>) => void;
  updateRolePermissions: (roleId: string, permissions: PermissionKey[]) => void;
  hasPermission: (key: PermissionKey) => boolean;

  // Lock Screen
  isLocked: boolean;
  lockTerminal: () => void;
  unlockTerminal: () => void;

  // Multi-Currency & Formatting
  formatCurrency: (amount: number) => string;

  // Loading Skeletons State
  isLoading: boolean;
  triggerModuleRefresh: () => void;
  
  // POS Cart State
  cart: PosCartItem[];
  addToCart: (
    medicine: Medicine,
    qty?: number,
    selectedUnit?: string,
    selectedUnitMultiplier?: number,
    customUnitPrice?: number
  ) => void;
  removeFromCart: (medicineId: string) => void;
  updateCartQty: (medicineId: string, delta: number) => void;
  updateCartUnit: (
    medicineId: string,
    unitName: string,
    multiplier: number,
    price: number
  ) => void;
  clearCart: () => void;
  
  // Hold Sales
  onHoldSales: { id: string; customerName: string; date: string; items: PosCartItem[] }[];
  holdCurrentSale: (customerName?: string) => void;
  resumeSale: (holdId: string) => void;
  deleteHeldSale: (holdId: string) => void;
  
  // Process Sale
  completeSale: (
    paymentMethod: PosSale["paymentMethod"],
    customer?: CustomerPatient,
    paymentDetails?: PosSale["paymentDetails"]
  ) => PosSale;
  
  // Entity Actions
  addMedicine: (med: Partial<Medicine>) => void;
  updateMedicine: (id: string, med: Partial<Medicine>) => void;
  restockMedicine: (
    medicineId: string,
    quantityAdded: number,
    batchDetails: {
      batchNumber: string;
      expiryDate: string;
      mfgDate?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      supplierId?: string;
      supplierName?: string;
      location?: string;
    },
    recordAsExpense?: boolean,
    expensePaymentMethod?: string
  ) => void;
  deleteMedicine: (id: string) => void;
  
  addPrescription: (rx: Partial<Prescription>) => void;
  addCustomer: (cust: Partial<CustomerPatient>) => void;
  addCustomerDeposit: (customerId: string, amount: number, paymentMethod: string, notes?: string) => void;
  recordCreditPayment: (customerId: string, amount: number, paymentMethod: string, notes?: string) => void;
  addSupplier: (sup: Partial<Supplier>) => void;
  addPurchaseOrder: (po: Partial<PurchaseOrder>) => void;
  addStockTransfer: (tr: Partial<StockTransfer>) => void;
  addFinancialRecord: (rec: Partial<FinancialRecord>) => void;
  
  addAuditLog: (action: string, details: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  restoreSystemState: (backupObj: any) => boolean;
  resetToDefaultSeedData: () => void;
  
  // End of Day (Z-Report)
  endOfDayReports: EndOfDayReport[];
  saveEndOfDayReport: (report: Omit<EndOfDayReport, "id" | "reportNumber" | "closedAt">) => EndOfDayReport;
  
  // Global search query helper
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(MOCK_BRANCHES[0]);
  const [activeTab, setActiveTabState] = useState<string>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("mediflow_theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("mediflow_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("mediflow_theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // RBAC & System Users
  const [roles, setRoles] = useState<RoleDefinition[]>(MOCK_ROLES);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(MOCK_USERS[0]);
  const [currentRole, setCurrentRoleState] = useState<UserRole>("Super Admin");
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Loading Skeletons
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data Collections
  const [medicines, setMedicines] = useState<Medicine[]>(MOCK_MEDICINES);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [customers, setCustomers] = useState<CustomerPatient[]>(MOCK_CUSTOMERS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(MOCK_PRESCRIPTIONS);
  const [sales, setSales] = useState<PosSale[]>(MOCK_SALES);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS);
  const [transfers, setTransfers] = useState<StockTransfer[]>(MOCK_STOCK_TRANSFERS);
  const [financials, setFinancials] = useState<FinancialRecord[]>(MOCK_FINANCIALS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [payrollProfiles] = useState<PayrollProfile[]>(MOCK_PAYROLL_PROFILES);
  const [endOfDayReports, setEndOfDayReports] = useState<EndOfDayReport[]>([]);

  const saveEndOfDayReport = (reportData: Omit<EndOfDayReport, "id" | "reportNumber" | "closedAt">): EndOfDayReport => {
    const timestampStr = new Date().toISOString().replace(/\D/g, "").slice(0, 8);
    const newReport: EndOfDayReport = {
      ...reportData,
      id: `eod-${Date.now()}`,
      reportNumber: `ZREP-${timestampStr}-${Math.floor(100 + Math.random() * 900)}`,
      closedAt: new Date().toISOString(),
    };

    setEndOfDayReports((prev) => [newReport, ...prev]);

    addAuditLog(
      "EOD Reconciliation Completed",
      `Z-Report ${newReport.reportNumber} closed by ${newReport.cashierName}. Total Gross: ${formatCurrency(newReport.totalGrossRevenue)}, Cash Discrepancy: ${formatCurrency(newReport.cashDiscrepancy)} (${newReport.status}).`
    );

    return newReport;
  };

  // Custom role setter that updates currentRole, currentUser & branch state
  const setCurrentRole = (newRole: UserRole) => {
    if (newRole === "Super Admin" && currentRole !== "Super Admin") {
      addAuditLog("Role Switch Denied", "Blocked attempt to switch role to Super Admin.");
      alert("Access Denied: Role switching to Super Admin is prohibited. Only pre-authenticated Super Admin sessions possess Super Admin privileges.");
      return;
    }

    setCurrentRoleState(newRole);

    if (newRole === "Super Admin") {
      const superAdminUser = systemUsers.find((u) => u.roleName === "Super Admin") || MOCK_USERS[0];
      setCurrentUser(superAdminUser);
      const superBranch = branches.find((b) => b.id === superAdminUser.branchId) || branches[0];
      setCurrentBranch(superBranch);
    } else {
      const matchedUser = systemUsers.find((u) => u.roleName === newRole);
      if (matchedUser) {
        setCurrentUser(matchedUser);
        const userBranch = branches.find((b) => b.id === matchedUser.branchId);
        if (userBranch) setCurrentBranch(userBranch);
      } else if (currentUser) {
        const matchedRoleDef = roles.find((r) => r.name === newRole);
        setCurrentUser({
          ...currentUser,
          roleName: newRole,
          roleId: matchedRoleDef ? matchedRoleDef.id : currentUser.roleId,
        });
      }
    }

    addAuditLog("Role Switched", `Switched active system role to ${newRole}`);
  };

  // Idle Timer for Automatic Terminal Lock Screen (5-minute pharmacy security standard)
  const lastActivityRef = React.useRef<number>(Date.now());

  useEffect(() => {
    if (isLocked) return;

    const timeoutMinutes = settings.securityLockTimeoutMinutes ?? 5;
    if (timeoutMinutes <= 0) return; // Auto-lock disabled if set to 0

    const timeoutMs = timeoutMinutes * 60 * 1000;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // User activity listeners across the workspace
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Check inactivity every 5 seconds
    const intervalId = setInterval(() => {
      if (!isLocked) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMs) {
          setIsLocked(true);
          addAuditLog(
            "Terminal Auto-Locked",
            `System automatically locked after ${timeoutMinutes} minute(s) of inactivity.`
          );
        }
      }
    }, 5000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(intervalId);
    };
  }, [isLocked, settings.securityLockTimeoutMinutes]);

  // Automated Cloud Database Background Sync Timer
  useEffect(() => {
    const config = getCloudSyncConfig();
    if (!config.autoSyncEnabled) return;

    const intervalMinutes = config.syncIntervalMinutes || 5;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    const runAutoSync = () => {
      try {
        createCloudBackup({
          medicines,
          sales,
          customers,
          suppliers,
          prescriptions,
          purchaseOrders: purchases,
          stockTransfers: transfers,
          financialRecords: financials,
          auditLogs,
          systemUsers,
          settings,
        }, config.externalStorageEndpoint ? "CUSTOM_WEBHOOK" : "INTERNAL_CLOUD_VAULT");
      } catch (err) {
        console.warn("Automated cloud backup sync background run note:", err);
      }
    };

    // Run initial background sync after 10 seconds of app load
    const initialTimer = setTimeout(runAutoSync, 10000);
    const syncInterval = setInterval(runAutoSync, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(syncInterval);
    };
  }, [
    medicines.length,
    sales.length,
    customers.length,
    suppliers.length,
    prescriptions.length,
    purchases.length,
    transfers.length,
    financials.length,
    auditLogs.length,
  ]);

  // Helper to get user's attendance status today
  const getTodayAttendanceStatus = (userId: string): AttendanceRecord | undefined => {
    const today = new Date().toISOString().split("T")[0];
    return attendanceRecords.find((rec) => rec.userId === userId && rec.date === today);
  };

  // Clock In Action
  const clockIn = (targetUserId?: string, notes?: string) => {
    const targetUser = targetUserId
      ? systemUsers.find((u) => u.id === targetUserId) || currentUser
      : currentUser;

    if (!targetUser) {
      return { success: false, message: "No active user selected for Clock In." };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const existingToday = attendanceRecords.find(
      (rec) => rec.userId === targetUser.id && rec.date === todayStr
    );

    if (existingToday) {
      if (!existingToday.clockOutTime) {
        return { success: false, message: `${targetUser.name} is already clocked in today!` };
      }
    }

    const now = new Date();
    const scheduledStartHour = 8; // Standard 8:00 AM shift
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    let isLate = false;
    let lateMins = 0;
    if (currentHour > scheduledStartHour || (currentHour === scheduledStartHour && currentMin > 15)) {
      isLate = true;
      lateMins = (currentHour - scheduledStartHour) * 60 + currentMin;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.roleName,
      branchId: targetUser.branchId || currentBranch.id,
      branchName: targetUser.branchName || currentBranch.name,
      date: todayStr,
      clockInTime: now.toISOString(),
      status: isLate ? "Late" : "Clocked In",
      workHours: 0,
      overtimeHours: 0,
      lateMinutes: lateMins,
      notes: notes || (isLate ? `Clocked in ${lateMins} mins past 8:00 AM` : "Standard shift start"),
      ipAddress: "197.210.64.12",
    };

    setAttendanceRecords((prev) => [newRecord, ...prev]);
    addAuditLog("Attendance Clock-In", `${targetUser.name} clocked in at ${now.toLocaleTimeString()}`);

    return {
      success: true,
      message: `Clock In successful for ${targetUser.name} at ${now.toLocaleTimeString()}! (${isLate ? `${lateMins}m Late` : "On Time"})`,
    };
  };

  // Clock Out Action
  const clockOut = (targetUserId?: string, notes?: string) => {
    const targetUser = targetUserId
      ? systemUsers.find((u) => u.id === targetUserId) || currentUser
      : currentUser;

    if (!targetUser) {
      return { success: false, message: "No active user selected for Clock Out." };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const existingIndex = attendanceRecords.findIndex(
      (rec) => rec.userId === targetUser.id && rec.date === todayStr && !rec.clockOutTime
    );

    if (existingIndex === -1) {
      return { success: false, message: `No active clocked-in record found for ${targetUser.name} today.` };
    }

    const now = new Date();
    const activeRec = attendanceRecords[existingIndex];
    const clockInDate = new Date(activeRec.clockInTime);
    
    // Calculate hours worked
    const diffMs = now.getTime() - clockInDate.getTime();
    const hoursWorked = Math.max(0.1, Number((diffMs / (1000 * 60 * 60)).toFixed(1)));
    const overtimeHours = Math.max(0, Number((hoursWorked - 8.0).toFixed(1)));

    let finalStatus: AttendanceRecord["status"] = "On Time";
    if (overtimeHours > 0) finalStatus = "Overtime";
    else if (activeRec.lateMinutes > 15) finalStatus = "Late";

    const updatedRecord: AttendanceRecord = {
      ...activeRec,
      clockOutTime: now.toISOString(),
      workHours: hoursWorked,
      overtimeHours: overtimeHours,
      status: finalStatus,
      notes: notes ? `${activeRec.notes || ""} | Clock Out Note: ${notes}` : activeRec.notes,
    };

    setAttendanceRecords((prev) => {
      const next = [...prev];
      next[existingIndex] = updatedRecord;
      return next;
    });

    addAuditLog(
      "Attendance Clock-Out",
      `${targetUser.name} clocked out at ${now.toLocaleTimeString()} (Shift: ${hoursWorked} hrs)`
    );

    return {
      success: true,
      message: `Clock Out successful for ${targetUser.name}! Shift total: ${hoursWorked} hrs (${overtimeHours} hrs Overtime).`,
    };
  };

  const addAttendanceRecord = (record: Partial<AttendanceRecord>) => {
    const newRec: AttendanceRecord = {
      id: record.id || `att-${Date.now()}`,
      userId: record.userId || currentUser?.id || "usr-1",
      userName: record.userName || currentUser?.name || "Staff Member",
      userRole: record.userRole || currentUser?.roleName || "Staff",
      branchId: record.branchId || currentBranch.id,
      branchName: record.branchName || currentBranch.name,
      date: record.date || new Date().toISOString().split("T")[0],
      clockInTime: record.clockInTime || new Date().toISOString(),
      clockOutTime: record.clockOutTime,
      status: record.status || "On Time",
      workHours: record.workHours ?? 8,
      overtimeHours: record.overtimeHours ?? 0,
      lateMinutes: record.lateMinutes ?? 0,
      notes: record.notes || "Manual Entry by Admin",
      ipAddress: record.ipAddress || "127.0.0.1",
    };
    setAttendanceRecords((prev) => [newRec, ...prev]);
    addAuditLog("Attendance Record Manual Add", `Manual entry created for ${newRec.userName} on ${newRec.date}`);
  };

  // POS Cart
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [onHoldSales, setOnHoldSales] = useState<
    { id: string; customerName: string; date: string; items: PosCartItem[] }[]
  >([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Tab change triggers a brief loading skeleton state for smooth UI transition
  const setActiveTab = (tab: string) => {
    setIsLoading(true);
    setActiveTabState(tab);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  const triggerModuleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      userName: currentUser ? currentUser.name : `${currentRole} User`,
      userRole: currentRole,
      action,
      details,
      ipAddress: "192.168.1.100",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Multi-Currency Formatter Helper
  const formatCurrency = (amount: number): string => {
    const safeNum = typeof amount === "number" && !isNaN(amount) ? amount : Number(amount) || 0;
    const activeCurr = settings?.currencies?.find((c) => c.code === settings?.currencyCode) || {
      code: "NGN",
      symbol: "₦",
      rateAgainstNGN: 1.0,
    };

    let convertedAmount = safeNum;
    if (activeCurr.code !== "NGN") {
      // If code is foreign currency, rateAgainstNGN gives NGN value per 1 foreign currency unit (e.g., 1550 NGN per $1 USD)
      convertedAmount = safeNum / (activeCurr.rateAgainstNGN || 1);
    }

    const finalNum = typeof convertedAmount === "number" && !isNaN(convertedAmount) ? convertedAmount : 0;

    return `${activeCurr.symbol || "₦"}${finalNum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // RBAC Permission Check
  const hasPermission = (key: PermissionKey): boolean => {
    if (currentRole === "Super Admin") return true;
    const matchedRole = roles.find((r) => r.name === currentRole || r.id === currentRole);
    if (!matchedRole) return false;
    return matchedRole.permissions.includes(key);
  };

  const loginAsUser = (userId: string) => {
    const found = systemUsers.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.roleName as UserRole);
      const userBranch = branches.find((b) => b.id === found.branchId);
      if (userBranch) {
        setCurrentBranch(userBranch);
      }
      addAuditLog("Staff Login", `Logged in as ${found.name} (${found.roleName}) at ${found.branchName}`);
    }
  };

  const addSystemUser = (user: Partial<SystemUser>) => {
    const targetBranch = branches.find((b) => b.id === user.branchId) || branches[0];
    const targetRole = roles.find((r) => r.id === user.roleId || r.name === user.roleName) || roles[3];

    const newUser: SystemUser = {
      id: `usr-${Date.now()}`,
      name: user.name || "New Staff Member",
      email: user.email || "staff@mediflow.ng",
      phone: user.phone || "+234 800 000 0000",
      roleId: targetRole.id,
      roleName: targetRole.name,
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      pin: user.pin || "1234",
      status: user.status || "Active",
      lastActive: "Just now",
    };

    setSystemUsers((prev) => [newUser, ...prev]);
    addAuditLog("Staff Created", `Created staff profile ${newUser.name} assigned to ${newUser.branchName}`);
  };

  const updateSystemUser = (id: string, updated: Partial<SystemUser>) => {
    setSystemUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const targetBranch = updated.branchId ? branches.find((b) => b.id === updated.branchId) : null;
          const targetRole = updated.roleId ? roles.find((r) => r.id === updated.roleId) : null;

          return {
            ...u,
            ...updated,
            branchName: targetBranch ? targetBranch.name : u.branchName,
            roleName: targetRole ? targetRole.name : u.roleName,
          };
        }
        return u;
      })
    );
    addAuditLog("Staff Updated", `Updated staff credentials for user ID ${id}`);
  };

  const assignUserToBranch = (userId: string, branchId: string) => {
    const targetBranch = branches.find((b) => b.id === branchId);
    if (!targetBranch) return;

    setSystemUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              branchId,
              branchName: targetBranch.name,
            }
          : u
      )
    );

    if (currentUser?.id === userId) {
      setCurrentBranch(targetBranch);
    }

    addAuditLog("Branch Reassignment", `Super Admin reassigned user ID ${userId} to ${targetBranch.name}`);
  };

  const addRole = (role: Partial<RoleDefinition>) => {
    const newRole: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: role.name || "Custom Role",
      description: role.description || "Custom operational role permissions",
      isSystemRole: false,
      permissions: role.permissions || ["pos_sales"],
    };
    setRoles((prev) => [...prev, newRole]);
    addAuditLog("Role Created", `Super Admin created custom role ${newRole.name}`);
  };

  const updateRolePermissions = (roleId: string, permissions: PermissionKey[]) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions } : r))
    );
    addAuditLog("Role Permissions Modified", `Updated permission matrix for role ID ${roleId}`);
  };

  const lockTerminal = () => {
    setIsLocked(true);
    addAuditLog("Terminal Locked", `Session locked for user ${currentUser?.name}`);
  };

  const unlockTerminal = () => {
    lastActivityRef.current = Date.now();
    setIsLocked(false);
  };

  // Cart logic
  const addToCart = (
    medicine: Medicine,
    qty: number = 1,
    selectedUnit?: string,
    selectedUnitMultiplier?: number,
    customUnitPrice?: number
  ) => {
    playBeep();
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      const batchNumber = medicine.batches && medicine.batches.length > 0 ? medicine.batches[0].batchNumber : "BATCH-01";
      
      const defaultUnitName = selectedUnit || medicine.uomConfig?.baseUnit || medicine.dosageForm || "Unit";
      const defaultMultiplier = selectedUnitMultiplier || 1;
      const unitPrice = customUnitPrice !== undefined ? customUnitPrice : medicine.sellingPrice * defaultMultiplier;

      const taxAmount = (unitPrice * (medicine.taxPercent || 0)) / 100;
      const discountAmount = (unitPrice * (medicine.discountPercent || 0)) / 100;

      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((item) =>
          item.medicine.id === medicine.id
            ? {
                ...item,
                quantity: newQty,
                selectedUnit: selectedUnit || item.selectedUnit || defaultUnitName,
                selectedUnitMultiplier: selectedUnitMultiplier || item.selectedUnitMultiplier || defaultMultiplier,
                unitPrice: unitPrice || item.unitPrice,
                baseQuantityDeducted: newQty * (selectedUnitMultiplier || item.selectedUnitMultiplier || defaultMultiplier),
                totalPrice: newQty * (unitPrice + taxAmount - discountAmount),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicine,
            selectedBatch: batchNumber,
            selectedUnit: defaultUnitName,
            selectedUnitMultiplier: defaultMultiplier,
            baseQuantityDeducted: qty * defaultMultiplier,
            quantity: qty,
            unitPrice,
            discountAmount,
            taxAmount,
            totalPrice: qty * (unitPrice + taxAmount - discountAmount),
          },
        ];
      }
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== medicineId));
  };

  const updateCartUnit = (
    medicineId: string,
    unitName: string,
    multiplier: number,
    price: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.medicine.id === medicineId) {
          const taxAmount = (price * (item.medicine.taxPercent || 0)) / 100;
          const discountAmount = (price * (item.medicine.discountPercent || 0)) / 100;
          return {
            ...item,
            selectedUnit: unitName,
            selectedUnitMultiplier: multiplier,
            unitPrice: price,
            discountAmount,
            taxAmount,
            baseQuantityDeducted: item.quantity * multiplier,
            totalPrice: item.quantity * (price + taxAmount - discountAmount),
          };
        }
        return item;
      })
    );
  };

  const updateCartQty = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medicineId) {
            const newQty = Math.max(1, item.quantity + delta);
            const unitPrice = item.unitPrice;
            const taxAmount = (unitPrice * (item.medicine.taxPercent || 0)) / 100;
            const discountAmount = (unitPrice * (item.medicine.discountPercent || 0)) / 100;
            const multiplier = item.selectedUnitMultiplier || 1;
            return {
              ...item,
              quantity: newQty,
              baseQuantityDeducted: newQty * multiplier,
              totalPrice: newQty * (unitPrice + taxAmount - discountAmount),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const holdCurrentSale = (customerName: string = "Walk-in Customer") => {
    if (cart.length === 0) return;
    playHoldSound();
    const holdItem = {
      id: `hold-${Date.now()}`,
      customerName,
      date: new Date().toLocaleTimeString(),
      items: [...cart],
    };
    setOnHoldSales((prev) => [holdItem, ...prev]);
    clearCart();
    addAuditLog("Sale Held", `Held cart with ${cart.length} items for ${customerName}`);
  };

  const resumeSale = (holdId: string) => {
    const found = onHoldSales.find((h) => h.id === holdId);
    if (found) {
      setCart(found.items);
      setOnHoldSales((prev) => prev.filter((h) => h.id !== holdId));
      addAuditLog("Sale Resumed", `Resumed held sale ${holdId}`);
    }
  };

  const deleteHeldSale = (holdId: string) => {
    setOnHoldSales((prev) => prev.filter((h) => h.id !== holdId));
    addAuditLog("Held Sale Deleted", `Cancelled/deleted held sale ${holdId}`);
  };

  const completeSale = (
    paymentMethod: PosSale["paymentMethod"],
    customer?: CustomerPatient,
    paymentDetails?: PosSale["paymentDetails"]
  ): PosSale => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const totalDiscount = cart.reduce((acc, item) => acc + item.discountAmount * item.quantity, 0);
    const taxAmount = cart.reduce((acc, item) => acc + item.taxAmount * item.quantity, 0);
    const grandTotal = subtotal - totalDiscount + taxAmount;
    const pointsEarned = Math.floor(grandTotal / 10);

    // Play loud celebratory chime upon sale completion!
    playSuccessChime();

    const newSale: PosSale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      customerId: customer?.id,
      customerName: customer?.name || "Walk-in Customer",
      customerPhone: customer?.phone,
      cashierName: currentUser ? currentUser.name : `${currentRole} Agent`,
      items: cart.map((c) => ({
        medicineId: c.medicine.id,
        medicineName: c.medicine.name,
        genericName: c.medicine.genericName,
        dosageForm: c.medicine.dosageForm,
        batchNumber: c.selectedBatch,
        selectedUnit: c.selectedUnit || c.medicine.uomConfig?.baseUnit || "Unit",
        selectedUnitMultiplier: c.selectedUnitMultiplier || 1,
        baseQuantityDeducted: c.quantity * (c.selectedUnitMultiplier || 1),
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        total: c.totalPrice,
      })),
      subtotal,
      totalDiscount,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentDetails,
      status: "Completed",
      loyaltyPointsEarned: pointsEarned,
    };

    // Deduct stock from medicines based on base unit conversion multiplier!
    setMedicines((prev) =>
      prev.map((med) => {
        const cartMatch = cart.find((c) => c.medicine.id === med.id);
        if (cartMatch) {
          const multiplier = cartMatch.selectedUnitMultiplier || 1;
          const baseDeduct = cartMatch.quantity * multiplier;
          const newStock = Math.max(0, med.stock - baseDeduct);

          const updatedBatches = med.batches.map((b) => {
            if (b.batchNumber === cartMatch.selectedBatch) {
              return { ...b, quantity: Math.max(0, b.quantity - baseDeduct) };
            }
            return b;
          });
          return { ...med, stock: newStock, batches: updatedBatches };
        }
        return med;
      })
    );

    // Update customer points, deposit balance, and unpaid credit balance
    if (customer) {
      const creditAmt = paymentMethod === "Credit / Account" 
        ? grandTotal 
        : (paymentDetails?.creditAmount || 0);

      const depositAmt = paymentMethod === "Deposit Wallet" 
        ? grandTotal 
        : (paymentDetails?.depositUsed || 0);

      setCustomers((prev) =>
        prev.map((cust) =>
          cust.id === customer.id
            ? {
                ...cust,
                loyaltyPoints: cust.loyaltyPoints + pointsEarned,
                totalSpent: cust.totalSpent + grandTotal,
                unpaidBalance: (cust.unpaidBalance || 0) + creditAmt,
                depositBalance: Math.max(0, (cust.depositBalance || 0) - depositAmt),
                lastVisitDate: new Date().toISOString().split("T")[0],
              }
            : cust
        )
      );
    }

    setSales((prev) => [newSale, ...prev]);
    if (!navigator.onLine) {
      queueOfflineSale(newSale);
    }
    clearCart();
    addAuditLog(
      "Sale Completed",
      `Invoice ${newSale.invoiceNumber} processed for ${formatCurrency(grandTotal)} (${paymentMethod})${!navigator.onLine ? " [OFFLINE QUEUED]" : ""}`
    );

    return newSale;
  };

  // Entity Handlers
  const addMedicine = (med: Partial<Medicine>) => {
    const newMed: Medicine = {
      id: `med-${Date.now()}`,
      name: med.name || "New Medicine",
      genericName: med.genericName || "Generic Active Ingredient",
      brandName: med.brandName || "Brand Name",
      category: med.category || "Analgesics & Anti-Inflammatories",
      manufacturer: med.manufacturer || "Generic Manufacturer",
      strength: med.strength || "500mg",
      dosageForm: med.dosageForm || "Tablet",
      packSize: med.packSize || "10 Tablets",
      sku: med.sku || `SKU-${Date.now()}`,
      barcode: med.barcode || `${Math.floor(8900000000000 + Math.random() * 99999999999)}`,
      qrCode: med.qrCode || `QR-${Date.now()}`,
      supplierId: med.supplierId || suppliers[0]?.id || "sup-1",
      supplierName: med.supplierName || suppliers[0]?.name || "PharmaGlobal",
      purchasePrice: med.purchasePrice || 2500,
      sellingPrice: med.sellingPrice || 4500,
      wholesalePrice: med.wholesalePrice || 3500,
      taxPercent: med.taxPercent ?? 7.5,
      discountPercent: med.discountPercent ?? 0,
      stock: med.stock ?? 100,
      minStock: med.minStock ?? 20,
      maxStock: med.maxStock ?? 500,
      location: med.location || "Shelf A1",
      storageTemperature: med.storageTemperature || "15-25°C",
      prescriptionRequired: med.prescriptionRequired ?? false,
      isControlledDrug: med.isControlledDrug ?? false,
      status: med.status || "Active",
      branchId: currentBranch.id,
      batches: med.batches || [
        {
          batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString().split("T")[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          purchasePrice: med.purchasePrice || 2500,
          sellingPrice: med.sellingPrice || 4500,
          quantity: med.stock ?? 100,
          supplierId: med.supplierId || "sup-1",
        },
      ],
    };
    setMedicines((prev) => [newMed, ...prev]);
    addAuditLog("Medicine Added", `Added new product ${newMed.name} (${newMed.strength})`);
  };

  const updateMedicine = (id: string, updated: Partial<Medicine>) => {
    setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    addAuditLog("Medicine Updated", `Updated details for medicine ID ${id}`);
  };

  const restockMedicine = (
    medicineId: string,
    quantityAdded: number,
    batchDetails: {
      batchNumber: string;
      expiryDate: string;
      mfgDate?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      supplierId?: string;
      supplierName?: string;
      location?: string;
    },
    recordAsExpense: boolean = true,
    expensePaymentMethod: string = "Bank Transfer"
  ) => {
    const targetMed = medicines.find((m) => m.id === medicineId);
    if (!targetMed) return;

    const purchaseCost = batchDetails.purchasePrice ?? targetMed.purchasePrice;
    const sellingPrice = batchDetails.sellingPrice ?? targetMed.sellingPrice;

    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id === medicineId) {
          const newTotalStock = med.stock + quantityAdded;
          const existingBatchIdx = med.batches.findIndex(
            (b) => b.batchNumber.toLowerCase() === batchDetails.batchNumber.toLowerCase()
          );

          let updatedBatches = [...med.batches];
          if (existingBatchIdx >= 0) {
            updatedBatches[existingBatchIdx] = {
              ...updatedBatches[existingBatchIdx],
              quantity: updatedBatches[existingBatchIdx].quantity + quantityAdded,
              expiryDate: batchDetails.expiryDate || updatedBatches[existingBatchIdx].expiryDate,
              purchasePrice: purchaseCost,
              sellingPrice: sellingPrice,
            };
          } else {
            updatedBatches.unshift({
              batchNumber: batchDetails.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
              mfgDate: batchDetails.mfgDate || new Date().toISOString().split("T")[0],
              expiryDate: batchDetails.expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
              purchasePrice: purchaseCost,
              sellingPrice: sellingPrice,
              quantity: quantityAdded,
              supplierId: batchDetails.supplierId || med.supplierId || "sup-1",
            });
          }

          return {
            ...med,
            stock: newTotalStock,
            purchasePrice: purchaseCost,
            sellingPrice: sellingPrice,
            supplierId: batchDetails.supplierId || med.supplierId,
            supplierName: batchDetails.supplierName || med.supplierName,
            location: batchDetails.location || med.location,
            batches: updatedBatches,
          };
        }
        return med;
      })
    );

    const medName = targetMed.name;
    const totalCost = purchaseCost * quantityAdded;

    if (recordAsExpense && totalCost > 0) {
      addFinancialRecord({
        date: new Date().toISOString().split("T")[0],
        type: "Expense",
        category: "Inventory Restock Purchase",
        description: `Restocked ${quantityAdded} units of ${medName} (Batch #${batchDetails.batchNumber})`,
        amount: totalCost,
        paymentMethod: expensePaymentMethod,
        branchId: currentBranch.id,
        recordedBy: currentUser ? currentUser.name : `${currentRole} User`,
      });
    }

    addAuditLog(
      "Stock Restocked",
      `Restocked +${quantityAdded} units for ${medName}. Batch #${batchDetails.batchNumber} logged.`
    );
  };

  const deleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    addAuditLog("Medicine Deleted", `Deleted medicine ID ${id}`);
  };

  const addPrescription = (rx: Partial<Prescription>) => {
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: `RX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date: rx.date || new Date().toISOString().split("T")[0],
      patientId: rx.patientId || "cust-1",
      patientName: rx.patientName || "Walk-in Patient",
      patientAge: rx.patientAge || 40,
      patientGender: rx.patientGender || "Male",
      doctorName: rx.doctorName || "Dr. Primary Physician",
      doctorLicense: rx.doctorLicense || "MD-LIC-8821",
      clinicHospital: rx.clinicHospital || "General Medical Clinic",
      diagnosis: rx.diagnosis || "Routine Medical Consultation",
      medicines: rx.medicines || [],
      status: rx.status || "Pending",
      ocrScanned: rx.ocrScanned || false,
    };
    setPrescriptions((prev) => [newRx, ...prev]);
    addAuditLog("Prescription Created", `Prescription ${newRx.prescriptionNumber} for ${newRx.patientName}`);
  };

  const addCustomer = (cust: Partial<CustomerPatient>) => {
    const newCust: CustomerPatient = {
      id: `cust-${Date.now()}`,
      patientCode: `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
      name: cust.name || "New Patient",
      phone: cust.phone || "+234 800 000 0000",
      email: cust.email || "patient@example.ng",
      age: cust.age || 30,
      gender: cust.gender || "Male",
      address: cust.address || "Main Street",
      allergies: cust.allergies || [],
      medicalHistory: cust.medicalHistory || [],
      loyaltyPoints: cust.loyaltyPoints || 0,
      walletBalance: cust.walletBalance || 0,
      creditLimit: cust.creditLimit || 50000,
      insuranceProvider: cust.insuranceProvider,
      insurancePolicyNumber: cust.insurancePolicyNumber,
      totalSpent: 0,
      lastVisitDate: new Date().toISOString().split("T")[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    addAuditLog("Customer Registered", `Registered patient ${newCust.name} (${newCust.patientCode})`);
  };

  const addCustomerDeposit = (customerId: string, amount: number, paymentMethod: string, notes?: string) => {
    playDepositSound();
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, depositBalance: (c.depositBalance || 0) + amount }
          : c
      )
    );

    const targetCustomer = customers.find((c) => c.id === customerId);
    const customerName = targetCustomer?.name || "Customer";

    addFinancialRecord({
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "Customer Deposit / Advance",
      description: `Deposit credited to ${customerName} account balance (${notes || "Advance payment"})`,
      amount,
      paymentMethod,
      branchId: currentBranch.id,
      recordedBy: currentUser?.name || "Cashier",
    });

    addAuditLog(
      "Customer Deposit Added",
      `Credited ₦${amount.toLocaleString()} deposit to ${customerName} via ${paymentMethod}`
    );
  };

  const recordCreditPayment = (customerId: string, amount: number, paymentMethod: string, notes?: string) => {
    playDepositSound();
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? { ...c, unpaidBalance: Math.max(0, (c.unpaidBalance || 0) - amount) }
          : c
      )
    );

    const targetCustomer = customers.find((c) => c.id === customerId);
    const customerName = targetCustomer?.name || "Customer";

    addFinancialRecord({
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "Customer Debt Recovery / Credit Repayment",
      description: `Credit debt settlement received from ${customerName} (${notes || "Debt recovery"})`,
      amount,
      paymentMethod,
      branchId: currentBranch.id,
      recordedBy: currentUser?.name || "Cashier",
    });

    addAuditLog(
      "Credit Debt Settled",
      `Received ₦${amount.toLocaleString()} debt payment from ${customerName} via ${paymentMethod}`
    );
  };

  const addSupplier = (sup: Partial<Supplier>) => {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: sup.name || "New Pharma Supplier",
      contactPerson: sup.contactPerson || "Sales Representative",
      email: sup.email || "sales@supplier.com",
      phone: sup.phone || "+234 800 555 0000",
      address: sup.address || "Distribution Logistics Hub",
      balance: sup.balance || 0,
      rating: sup.rating || 5.0,
      totalPurchases: 0,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    addAuditLog("Supplier Created", `Added supplier ${newSup.name}`);
  };

  const addPurchaseOrder = (po: Partial<PurchaseOrder>) => {
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: po.expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      supplierId: po.supplierId || suppliers[0]?.id || "sup-1",
      supplierName: po.supplierName || suppliers[0]?.name || "Pharma Supplier",
      branchId: currentBranch.id,
      items: po.items || [],
      totalAmount: po.totalAmount || 0,
      paidAmount: po.paidAmount || 0,
      status: po.status || "Pending",
      grnNumber: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setPurchases((prev) => [newPo, ...prev]);
    addAuditLog("Purchase Order Created", `Created PO ${newPo.poNumber} for ${formatCurrency(newPo.totalAmount)}`);
  };

  const addStockTransfer = (tr: Partial<StockTransfer>) => {
    const newTr: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferCode: `TR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split("T")[0],
      fromBranch: tr.fromBranch || currentBranch.name,
      toBranch: tr.toBranch || branches[1]?.name || "Secondary Branch",
      items: tr.items || [],
      requestedBy: currentUser ? currentUser.name : `${currentRole} User`,
      status: "In Transit",
    };
    setTransfers((prev) => [newTr, ...prev]);
    addAuditLog("Stock Transfer Initiated", `Transfer ${newTr.transferCode} from ${newTr.fromBranch} to ${newTr.toBranch}`);
  };

  const addFinancialRecord = (rec: Partial<FinancialRecord>) => {
    const newRec: FinancialRecord = {
      id: `fin-${Date.now()}`,
      date: rec.date || new Date().toISOString().split("T")[0],
      type: rec.type || "Expense",
      category: rec.category || "General Operations",
      description: rec.description || "Operational ledger record",
      amount: rec.amount || 0,
      paymentMethod: rec.paymentMethod || "Bank Transfer",
      branchId: currentBranch.id,
      recordedBy: currentUser ? currentUser.name : `${currentRole} User`,
    };
    setFinancials((prev) => [newRec, ...prev]);
    addAuditLog("Financial Record Logged", `${newRec.type}: ${newRec.description} (${formatCurrency(newRec.amount)})`);
  };

  const updateSettings = (newSet: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSet };
      if (newSet.currencyCode) {
        const matched = updated.currencies.find((c) => c.code === newSet.currencyCode);
        if (matched) {
          updated.currencySymbol = matched.symbol;
        }
      }
      return updated;
    });
    addAuditLog("System Settings Updated", "Updated ERP settings and multi-currency configuration.");
  };

  const restoreSystemState = (backupObj: any): boolean => {
    try {
      const data = backupObj.data || backupObj;
      if (data.medicines && Array.isArray(data.medicines)) setMedicines(data.medicines);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.prescriptions && Array.isArray(data.prescriptions)) setPrescriptions(data.prescriptions);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.transfers && Array.isArray(data.transfers)) setTransfers(data.transfers);
      if (data.financials && Array.isArray(data.financials)) setFinancials(data.financials);
      if (data.auditLogs && Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
      if (data.settings && typeof data.settings === "object") setSettings(data.settings);
      if (data.roles && Array.isArray(data.roles)) setRoles(data.roles);
      if (data.systemUsers && Array.isArray(data.systemUsers)) setSystemUsers(data.systemUsers);

      addAuditLog("Database Restored", `System database state restored successfully.`);
      return true;
    } catch (err) {
      console.error("Error restoring database:", err);
      return false;
    }
  };

  const resetToDefaultSeedData = () => {
    setMedicines(MOCK_MEDICINES);
    setSuppliers(MOCK_SUPPLIERS);
    setCustomers(MOCK_CUSTOMERS);
    setPrescriptions(MOCK_PRESCRIPTIONS);
    setSales(MOCK_SALES);
    setPurchases(MOCK_PURCHASE_ORDERS);
    setTransfers(MOCK_STOCK_TRANSFERS);
    setFinancials(MOCK_FINANCIALS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setSettings(MOCK_SETTINGS);
    setRoles(MOCK_ROLES);
    setSystemUsers(MOCK_USERS);
    addAuditLog("Database Reset", "System database reset to factory seed data.");
  };

  return (
    <PharmacyContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentBranch,
        setCurrentBranch,
        branches,
        activeTab,
        setActiveTab,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        medicines,
        categories,
        suppliers,
        customers,
        prescriptions,
        sales,
        purchases,
        transfers,
        financials,
        auditLogs,
        settings,
        attendanceRecords,
        payrollProfiles,
        clockIn,
        clockOut,
        addAttendanceRecord,
        getTodayAttendanceStatus,
        roles,
        systemUsers,
        currentUser,
        loginAsUser,
        addSystemUser,
        updateSystemUser,
        assignUserToBranch,
        addRole,
        updateRolePermissions,
        hasPermission,
        isLocked,
        lockTerminal,
        unlockTerminal,
        formatCurrency,
        isLoading,
        triggerModuleRefresh,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        updateCartUnit,
        clearCart,
        onHoldSales,
        holdCurrentSale,
        resumeSale,
        deleteHeldSale,
        completeSale,
        addMedicine,
        updateMedicine,
        restockMedicine,
        deleteMedicine,
        addPrescription,
        addCustomer,
        addCustomerDeposit,
        recordCreditPayment,
        addSupplier,
        addPurchaseOrder,
        addStockTransfer,
        addFinancialRecord,
        addAuditLog,
        updateSettings,
        restoreSystemState,
        resetToDefaultSeedData,
        endOfDayReports,
        saveEndOfDayReport,
        globalSearchQuery,
        setGlobalSearchQuery,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error("usePharmacy must be used within a PharmacyProvider");
  }
  return context;
};

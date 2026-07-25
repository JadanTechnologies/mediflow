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
} from "../data/mockData";

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
  addToCart: (medicine: Medicine, qty?: number) => void;
  removeFromCart: (medicineId: string) => void;
  updateCartQty: (medicineId: string, delta: number) => void;
  clearCart: () => void;
  
  // Hold Sales
  onHoldSales: { id: string; customerName: string; date: string; items: PosCartItem[] }[];
  holdCurrentSale: (customerName?: string) => void;
  resumeSale: (holdId: string) => void;
  
  // Process Sale
  completeSale: (
    paymentMethod: PosSale["paymentMethod"],
    customer?: CustomerPatient,
    paymentDetails?: PosSale["paymentDetails"]
  ) => PosSale;
  
  // Entity Actions
  addMedicine: (med: Partial<Medicine>) => void;
  updateMedicine: (id: string, med: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  
  addPrescription: (rx: Partial<Prescription>) => void;
  addCustomer: (cust: Partial<CustomerPatient>) => void;
  addSupplier: (sup: Partial<Supplier>) => void;
  addPurchaseOrder: (po: Partial<PurchaseOrder>) => void;
  addStockTransfer: (tr: Partial<StockTransfer>) => void;
  addFinancialRecord: (rec: Partial<FinancialRecord>) => void;
  
  addAuditLog: (action: string, details: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  restoreSystemState: (backupObj: any) => boolean;
  resetToDefaultSeedData: () => void;
  
  // Global search query helper
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(MOCK_BRANCHES[0]);
  const [activeTab, setActiveTabState] = useState<string>("dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>("");

  // RBAC & System Users
  const [roles, setRoles] = useState<RoleDefinition[]>(MOCK_ROLES);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(MOCK_USERS[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>("Super Admin");
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
    const activeCurr = settings.currencies?.find((c) => c.code === settings.currencyCode) || {
      code: "NGN",
      symbol: "₦",
      rateAgainstNGN: 1.0,
    };

    let convertedAmount = amount;
    if (activeCurr.code !== "NGN") {
      // If code is foreign currency, rateAgainstNGN gives NGN value per 1 foreign currency unit (e.g., 1550 NGN per $1 USD)
      convertedAmount = amount / (activeCurr.rateAgainstNGN || 1);
    }

    return `${activeCurr.symbol}${convertedAmount.toLocaleString("en-US", {
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
    setIsLocked(false);
  };

  // Cart logic
  const addToCart = (medicine: Medicine, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id);
      const batchNumber = medicine.batches && medicine.batches.length > 0 ? medicine.batches[0].batchNumber : "BATCH-01";
      const unitPrice = medicine.sellingPrice;
      const taxAmount = (unitPrice * (medicine.taxPercent || 0)) / 100;
      const discountAmount = (unitPrice * (medicine.discountPercent || 0)) / 100;

      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((item) =>
          item.medicine.id === medicine.id
            ? {
                ...item,
                quantity: newQty,
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

  const updateCartQty = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medicineId) {
            const newQty = Math.max(1, item.quantity + delta);
            const unitPrice = item.medicine.sellingPrice;
            const taxAmount = (unitPrice * (item.medicine.taxPercent || 0)) / 100;
            const discountAmount = (unitPrice * (item.medicine.discountPercent || 0)) / 100;
            return {
              ...item,
              quantity: newQty,
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

    // Deduct stock from medicines
    setMedicines((prev) =>
      prev.map((med) => {
        const cartMatch = cart.find((c) => c.medicine.id === med.id);
        if (cartMatch) {
          const newStock = Math.max(0, med.stock - cartMatch.quantity);
          const updatedBatches = med.batches.map((b) => {
            if (b.batchNumber === cartMatch.selectedBatch) {
              return { ...b, quantity: Math.max(0, b.quantity - cartMatch.quantity) };
            }
            return b;
          });
          return { ...med, stock: newStock, batches: updatedBatches };
        }
        return med;
      })
    );

    // Update customer points if matched
    if (customer) {
      setCustomers((prev) =>
        prev.map((cust) =>
          cust.id === customer.id
            ? {
                ...cust,
                loyaltyPoints: cust.loyaltyPoints + pointsEarned,
                totalSpent: cust.totalSpent + grandTotal,
                lastVisitDate: new Date().toISOString().split("T")[0],
              }
            : cust
        )
      );
    }

    setSales((prev) => [newSale, ...prev]);
    clearCart();
    addAuditLog("Sale Completed", `Invoice ${newSale.invoiceNumber} processed for ${formatCurrency(grandTotal)} (${paymentMethod})`);

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
        clearCart,
        onHoldSales,
        holdCurrentSale,
        resumeSale,
        completeSale,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        addPrescription,
        addCustomer,
        addSupplier,
        addPurchaseOrder,
        addStockTransfer,
        addFinancialRecord,
        addAuditLog,
        updateSettings,
        restoreSystemState,
        resetToDefaultSeedData,
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

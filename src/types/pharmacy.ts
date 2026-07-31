export type UserRole = 
  | "Super Admin"
  | "Branch Manager"
  | "Pharmacist"
  | "Cashier"
  | "Inventory Officer"
  | "Accountant"
  | "Doctor"
  | "Customer"
  | string;

export type PermissionKey =
  | "pos_sales"
  | "inventory_manage"
  | "price_override"
  | "prescriptions_manage"
  | "purchases_manage"
  | "customers_manage"
  | "financials_view"
  | "analytics_view"
  | "reports_export"
  | "multi_branch_switch"
  | "system_settings_manage"
  | "roles_permissions_manage"
  | "user_management"
  | "attendance_manage";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: PermissionKey[];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  roleName: string;
  branchId: string;
  branchName: string;
  pin: string;
  avatar?: string;
  status: "Active" | "Inactive";
  lastActive?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateAgainstNGN: number;
  isDefault?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  rating: number; // 1-5
  totalPurchases: number;
}

export interface UnitConversionRule {
  unitName: string; // e.g., "Box", "Strip", "Pack", "Carton", "Container"
  conversionMultiplier: number; // Number of base units contained in 1 unit of this (e.g. 1 Strip = 10 Tablets)
  sellingPrice?: number; // Custom unit price override (if omitted, calculated as basePrice * multiplier)
  wholesalePrice?: number;
  barcode?: string;
}

export interface MedicineUomConfig {
  baseUnit: string; // e.g. "Tablet", "Capsule", "Sachet", "Bottle", "Ampoule", "Piece", "ml"
  conversions: UnitConversionRule[];
}

export interface BatchInfo {
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  supplierId: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  manufacturer: string;
  strength: string; // e.g., "500mg"
  dosageForm: string; // e.g., "Tablet", "Syrup", "Injection", "Capsule"
  packSize: string; // e.g., "10x10 Strip", "100ml Bottle"
  sku: string;
  barcode: string;
  qrCode?: string;
  image?: string;
  batches: BatchInfo[];
  supplierId: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice: number;
  taxPercent: number;
  discountPercent: number;
  stock: number;
  minStock: number;
  maxStock: number;
  location: string; // Shelf / Rack e.g. "Aisle 3 - Shelf B"
  storageTemperature: string; // e.g. "15-25°C", "2-8°C Refrigerated"
  prescriptionRequired: boolean;
  isControlledDrug: boolean;
  status: "Active" | "Discontinued" | "Out of Stock";
  branchId: string;
  uomConfig?: MedicineUomConfig;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  itemCount: number;
}

export interface DispensingUnit {
  id: string;
  name: string;
  shortCode: string;
  description?: string;
  isBaseUnit?: boolean;
}

export interface PosCartItem {
  medicine: Medicine;
  selectedBatch: string;
  selectedUnit?: string;
  selectedUnitMultiplier?: number;
  baseQuantityDeducted?: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
}

export interface PosSale {
  id: string;
  invoiceNumber: string;
  date: string;
  branchId: string;
  branchName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  patientId?: string;
  prescriptionId?: string;
  cashierName: string;
  items: {
    medicineId: string;
    medicineName: string;
    genericName: string;
    dosageForm: string;
    batchNumber: string;
    selectedUnit?: string;
    selectedUnitMultiplier?: number;
    baseQuantityDeducted?: number;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: "Cash" | "Card" | "Digital Wallet" | "Insurance" | "Deposit Wallet" | "Credit / Account" | "Split";
  paymentDetails?: {
    cashPaid?: number;
    cardPaid?: number;
    insuranceApproved?: number;
    walletPaid?: number;
    depositUsed?: number;
    creditAmount?: number;
    creditCharged?: number;
    changeGiven?: number;
  };
  status: "Completed" | "Returned" | "On Hold";
  loyaltyPointsEarned: number;
  notes?: string;
  isOfflineSale?: boolean;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  date: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  doctorName: string;
  doctorLicense: string;
  clinicHospital: string;
  diagnosis: string;
  medicines: {
    medicineName: string;
    dosage: string; // e.g., "500mg"
    morning: boolean;
    afternoon: boolean;
    night: boolean;
    durationDays: number;
    instructions: string;
  }[];
  status: "Pending" | "Dispensed" | "Cancelled";
  digitalSignatureUrl?: string;
  ocrScanned?: boolean;
}

export interface CustomerPatient {
  id: string;
  patientCode: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  address: string;
  allergies: string[];
  medicalHistory: string[];
  loyaltyPoints: number;
  walletBalance: number;
  depositBalance?: number;
  creditLimit: number;
  unpaidBalance?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  totalSpent: number;
  lastVisitDate: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  items: {
    medicineName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  status: "Draft" | "Pending" | "Received" | "Partially Received" | "Cancelled";
  grnNumber?: string;
  notes?: string;
}

export interface StockTransfer {
  id: string;
  transferCode: string;
  date: string;
  fromBranch: string;
  toBranch: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
  }[];
  requestedBy: string;
  status: "Pending" | "In Transit" | "Completed" | "Rejected";
}

export interface FinancialRecord {
  id: string;
  date: string;
  type: "Income" | "Expense" | "Payroll" | "Refund";
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  branchId: string;
  recordedBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress: string;
}

export type StockAdjustmentType =
  | "PHYSICAL_COUNT_CORRECTION"
  | "WASTAGE_SPILLAGE"
  | "EXPIRED_DISCARD"
  | "DAMAGED_TRANSIT"
  | "THEFT_DISCREPANCY"
  | "RETURN_TO_SUPPLIER"
  | "MANUAL_ADDITION"
  | "OTHER";

export interface StockAdjustment {
  id: string;
  timestamp: string;
  medicineId: string;
  medicineName: string;
  genericName?: string;
  category?: string;
  batchNumber?: string;
  adjustmentType: StockAdjustmentType;
  previousStock: number;
  adjustedQuantity: number;
  newStock: number;
  unit?: string;
  reason: string;
  performedBy: string;
  userRole: string;
  branchId?: string;
  branchName?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxId: string;
  currencySymbol: string;
  currencyCode: string;
  currencies: Currency[];
  timezone: string;
  defaultTaxRatePercent: number;
  enableLowStockAlerts: boolean;
  enableExpiryAlerts: boolean;
  expiryAlertThresholdDays: number;
  thermalPrinterWidthMm: number;
  allowNegativeStock: boolean;
  securityLockTimeoutMinutes: number;
  logoUrl?: string;
  posAccentColor?: string;
  receiptHeaderMessage?: string;
  receiptFooterMessage?: string;
  reportHeaderNote?: string;
  reportFooterNote?: string;
}

export type AttendanceStatus = "On Time" | "Late" | "Absent" | "Half Day" | "Overtime" | "Clocked In";

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  branchId: string;
  branchName: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // ISO String
  clockOutTime?: string; // ISO String
  status: AttendanceStatus;
  workHours: number;
  overtimeHours: number;
  lateMinutes: number;
  notes?: string;
  ipAddress?: string;
  verifiedBy?: string;
}

export interface PayrollProfile {
  userId: string;
  userName: string;
  roleName: string;
  baseMonthlySalaryNGN: number;
  hourlyRateNGN: number;
  overtimeRateMultiplier: number; // e.g., 1.5
  lateDeductionPerMinNGN: number; // e.g., 50 NGN per min late
  bankName: string;
  accountNumber: string;
}

export interface EndOfDayReport {
  id: string;
  reportNumber: string; // e.g., ZREP-20260728-001
  date: string;
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  openingFloat: number;
  totalSalesCount: number;
  totalGrossRevenue: number;
  totalCashSales: number;
  totalCardSales: number;
  totalWalletSales: number;
  totalInsuranceSales: number;
  totalCreditSales: number;
  totalSplitSales: number;
  expectedCashInDrawer: number;
  actualCashCounted: number;
  cashDiscrepancy: number;
  closingNotes: string;
  closedAt: string;
  status: "Balanced" | "Over" | "Short";
}

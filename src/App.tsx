import React, { useState } from "react";
import { PharmacyProvider, usePharmacy } from "./context/PharmacyContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { LockScreenModal } from "./components/auth/LockScreenModal";

// View Modules
import { DashboardOverview } from "./components/dashboard/DashboardOverview";
import { PosSystem } from "./components/pos/PosSystem";
import { MedicineManager } from "./components/inventory/MedicineManager";
import { PrescriptionModule } from "./components/prescriptions/PrescriptionModule";
import { PurchaseModule } from "./components/purchases/PurchaseModule";
import { CustomerPatientModule } from "./components/customers/CustomerPatientModule";
import { FinancialModule } from "./components/financials/FinancialModule";
import { AiAnalyticsModule } from "./components/analytics/AiAnalyticsModule";
import { ReportsAndLogs } from "./components/reports/ReportsAndLogs";
import { AttendanceTrackerModule } from "./components/attendance/AttendanceTrackerModule";
import { SystemSettings } from "./components/settings/SystemSettings";

const MainLayout: React.FC = () => {
  const { activeTab, isDarkMode } = usePharmacy();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "pos":
        return <PosSystem />;
      case "inventory":
        return <MedicineManager />;
      case "prescriptions":
        return <PrescriptionModule />;
      case "purchases":
        return <PurchaseModule />;
      case "customers":
        return <CustomerPatientModule />;
      case "financials":
        return <FinancialModule />;
      case "analytics":
        return <AiAnalyticsModule />;
      case "reports":
        return <ReportsAndLogs />;
      case "attendance":
        return <AttendanceTrackerModule />;
      case "settings":
        return <SystemSettings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className={`min-h-screen font-sans bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex relative ${isDarkMode ? "dark" : ""}`}>
      {/* Global Security Terminal Lock Screen */}
      <LockScreenModal />

      {/* Responsive Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Right Column: Header & Active Tab Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <MainLayout />
    </PharmacyProvider>
  );
}

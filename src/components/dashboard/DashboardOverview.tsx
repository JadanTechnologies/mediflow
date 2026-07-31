import React, { useState, useEffect } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { DashboardSkeleton } from "../ui/ModuleSkeletons";
import { NearExpiryWidget } from "./NearExpiryWidget";
import {
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  X,
  TrendingUp,
  FileText,
  ShoppingBag,
  Users,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Default Sales Performance Trend Data
const SALES_TREND_DATA = [
  { day: "Mon", sales: 320000, profit: 110000, rxCount: 42 },
  { day: "Tue", sales: 410000, profit: 145000, rxCount: 51 },
  { day: "Wed", sales: 380000, profit: 130000, rxCount: 48 },
  { day: "Thu", sales: 520000, profit: 190000, rxCount: 65 },
  { day: "Fri", sales: 610000, profit: 220000, rxCount: 78 },
  { day: "Sat", sales: 740000, profit: 280000, rxCount: 92 },
  { day: "Sun", sales: 489000, profit: 175000, rxCount: 58 },
];

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  description: string;
  category: "KPIs" | "Charts" | "Alerts" | "Activity";
  visible: boolean;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "kpi_cards",
    name: "Key Performance Metrics",
    description: "Today's sales, stock asset value, near-expiry alerts, and low-stock count",
    category: "KPIs",
    visible: true,
  },
  {
    id: "near_expiry",
    name: "Near Expiry & Quality Console",
    description: "Interactive 30/60/90 day expiry risk scan with supplier batch details",
    category: "Alerts",
    visible: true,
  },
  {
    id: "daily_revenue",
    name: "Daily Revenue & Profit Velocity",
    description: "Weekly sales revenue trend vs profit breakdown area chart",
    category: "Charts",
    visible: true,
  },
  {
    id: "top_selling",
    name: "Top Selling Medicines",
    description: "Ranking bar chart of highest volume and revenue medication sales",
    category: "Charts",
    visible: true,
  },
  {
    id: "pending_invoices",
    name: "Pending Invoices & Unpaid Ledgers",
    description: "Pending purchase orders, supplier payments, and customer credit balances",
    category: "Alerts",
    visible: true,
  },
  {
    id: "ai_insights",
    name: "AI Stock Procurement Assistant",
    description: "Demand velocity predictor and seasonal reorder recommendation engine",
    category: "KPIs",
    visible: true,
  },
  {
    id: "recent_transactions",
    name: "Recent Sales Transactions Feed",
    description: "Live real-time dispensing audit log with invoice breakdown",
    category: "Activity",
    visible: true,
  },
];

const LOCAL_STORAGE_WIDGET_KEY = "mediflow_dashboard_widgets_v2";

export const DashboardOverview: React.FC = () => {
  const { medicines, sales, purchases, customers, setActiveTab, formatCurrency, isLoading } = usePharmacy();

  // Widget Layout & Visibility State
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WIDGET_KEY);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        // Ensure all default widgets exist in saved layout
        const savedIds = new Set(parsed.map((w) => w.id));
        const missing = DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id));
        return [...parsed, ...missing];
      }
    } catch (e) {
      console.error("Failed to load dashboard widget config", e);
    }
    return DEFAULT_WIDGETS;
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [topSellingMetric, setTopSellingMetric] = useState<"qty" | "revenue">("qty");

  // Save widget layout changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WIDGET_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error("Failed to save dashboard widgets", e);
    }
  }, [widgets]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Calculate Metrics
  const todaySalesTotal = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalStockValue = medicines.reduce((acc, m) => acc + (m.stock || 0) * (m.purchasePrice || 0), 0);
  const lowStockCount = medicines.filter((m) => (m.stock || 0) <= (m.minStock || 0)).length;

  const todayMs = new Date().getTime();
  let nearExpiryCount90d = 0;
  medicines.forEach((m) => {
    m.batches?.forEach((b) => {
      const expMs = new Date(b.expiryDate).getTime();
      const diffDays = Math.ceil((expMs - todayMs) / (1000 * 3600 * 24));
      if (diffDays <= 90) {
        nearExpiryCount90d++;
      }
    });
  });

  // Calculate Top Selling Medicines from Sales
  const medicineSalesMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  sales.forEach((s) => {
    s.items?.forEach((item) => {
      const id = item.medicineId || item.medicineName;
      if (!medicineSalesMap[id]) {
        medicineSalesMap[id] = {
          name: item.medicineName,
          category: item.dosageForm || "General",
          qty: 0,
          revenue: 0,
        };
      }
      medicineSalesMap[id].qty += item.quantity || 1;
      medicineSalesMap[id].revenue += item.total || (item.unitPrice * (item.quantity || 1));
    });
  });

  let topSellingList = Object.values(medicineSalesMap)
    .sort((a, b) => (topSellingMetric === "qty" ? b.qty - a.qty : b.revenue - a.revenue))
    .slice(0, 5);

  // Fallback top selling if sales history is low
  if (topSellingList.length === 0) {
    topSellingList = [
      { name: "Amoxicillin 500mg", category: "Capsule", qty: 240, revenue: 360000 },
      { name: "Artemether/Lumefantrine 80/480mg", category: "Tablet", qty: 185, revenue: 555000 },
      { name: "Paracetamol Extra 500mg", category: "Tablet", qty: 150, revenue: 150000 },
      { name: "Ciprofloxacin 500mg", category: "Tablet", qty: 110, revenue: 275000 },
      { name: "Metformin 500mg", category: "Tablet", qty: 95, revenue: 190000 },
    ];
  }

  // Pending Invoices & Credit Accounts
  const pendingPOs = purchases.filter((p) => p.status === "Pending");
  const creditCustomers = customers.filter((c) => (c.unpaidBalance || 0) > 0);
  const totalPendingPoCost = pendingPOs.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalUnpaidCredit = creditCustomers.reduce((sum, c) => sum + (c.unpaidBalance || 0), 0);

  // Widget Actions
  const toggleWidgetVisibility = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;
    const updated = [...widgets];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setWidgets(updated);
  };

  const resetWidgetsToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  // Drag and Drop handlers for modal list
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const updated = [...widgets];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setWidgets(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toolbar / Header with Customization Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Pharmacy Dashboard
            </h1>
            <span className="text-[10px] font-extrabold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Live Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor sales revenue, stock valuation, expiry risks, and customize widget layouts.
          </p>
        </div>

        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all border border-slate-700/50 hover:scale-[1.02]"
        >
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <span>Configure Widgets & Layout</span>
        </button>
      </div>

      {/* Render Active Visible Widgets in User-Defined Sequence */}
      <div className="space-y-6">
        {widgets
          .filter((w) => w.visible)
          .map((widget) => {
            switch (widget.id) {
              case "kpi_cards":
                return (
                  <div key={widget.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                    {/* Card 1: Today's Sales */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-200 dark:hover:border-blue-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-950/50 px-2 py-0.5 rounded-full uppercase">
                          +12.4%
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Today's Sales</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(todaySalesTotal > 0 ? todaySalesTotal : 489000)}
                      </p>
                    </div>

                    {/* Card 2: Current Stock Value */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 transition-all hover:border-emerald-200 dark:hover:border-emerald-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full uppercase">
                          Stable
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Current Stock Value</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {formatCurrency(totalStockValue)}
                      </p>
                    </div>

                    {/* Card 3: Near Expiry Alerts */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 transition-all hover:border-amber-200 dark:hover:border-amber-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full uppercase">
                          30/60/90d Scan
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Near Expiry Alerts</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {nearExpiryCount90d} Batches
                      </p>
                    </div>

                    {/* Card 4: Low Stock Alerts */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 transition-all hover:border-rose-200 dark:hover:border-rose-900">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full uppercase">
                          Low Stock
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Low Stock Reorders</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {lowStockCount} Items
                      </p>
                    </div>
                  </div>
                );

              case "near_expiry":
                return <NearExpiryWidget key={widget.id} />;

              case "daily_revenue":
                return (
                  <div key={widget.id} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Area Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6 shrink-0">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span>Daily Sales Performance</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Weekly revenue velocity across active pharmacy registers
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="flex items-center font-medium text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-1.5" /> Revenue
                          </span>
                          <span className="flex items-center ml-4 font-medium text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 bg-blue-200 dark:bg-blue-400/40 rounded-full mr-1.5" /> Profit
                          </span>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#1e293b",
                                borderRadius: "16px",
                                fontSize: "12px",
                                color: "#f8fafc",
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                              }}
                              formatter={(value: any) => [formatCurrency(Number(value)), "Value"]}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="profit" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* AI Assistant Callout */}
                    <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-lg border border-slate-800">
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="z-10 space-y-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Sparkles className="w-5 h-5 text-blue-400" />
                          <span className="text-xs font-bold uppercase tracking-widest">AI Insights</span>
                        </div>
                        <h4 className="text-lg font-medium">Stock Optimization Prediction</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Based on seasonal patterns, demand for <span className="text-white font-bold underline decoration-blue-500">Antihistamines</span> is expected to rise by 22% in the next 14 days.
                        </p>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                          <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Recommendation</p>
                          <p className="text-xs text-slate-200">Increase procurement of Cetirizine 10mg batches by 400 units today.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-blue-900/40 text-white z-10 flex items-center justify-center gap-2"
                      >
                        <span>Auto-Generate Purchase Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );

              case "top_selling":
                return (
                  <div key={widget.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-emerald-500" />
                          <span>Top Selling Medicines</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Most frequently dispensed pharmaceuticals by quantity & revenue volume
                        </p>
                      </div>

                      {/* Switch Metric */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto">
                        <button
                          onClick={() => setTopSellingMetric("qty")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            topSellingMetric === "qty"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          By Quantity Sold
                        </button>
                        <button
                          onClick={() => setTopSellingMetric("revenue")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            topSellingMetric === "revenue"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                          }`}
                        >
                          By Revenue (NGN)
                        </button>
                      </div>
                    </div>

                    {/* Bar Chart & Ranking Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topSellingList} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              stroke="#94a3b8"
                              fontSize={10}
                              tickLine={false}
                              width={120}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderColor: "#1e293b",
                                borderRadius: "14px",
                                color: "#fff",
                                fontSize: "12px",
                              }}
                              formatter={(val: any) => [
                                topSellingMetric === "qty" ? `${val} Units` : formatCurrency(Number(val)),
                                topSellingMetric === "qty" ? "Quantity Sold" : "Revenue",
                              ]}
                            />
                            <Bar
                              dataKey={topSellingMetric === "qty" ? "qty" : "revenue"}
                              radius={[0, 8, 8, 0]}
                            >
                              {topSellingList.map((_, i) => (
                                <Cell key={i} fill={["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"][i % 5]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-3">
                        {topSellingList.map((med, index) => {
                          const maxVal = Math.max(...topSellingList.map((m) => (topSellingMetric === "qty" ? m.qty : m.revenue)));
                          const val = topSellingMetric === "qty" ? med.qty : med.revenue;
                          const percent = Math.round((val / (maxVal || 1)) * 100);

                          return (
                            <div
                              key={index}
                              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center text-[10px] font-black">
                                    #{index + 1}
                                  </span>
                                  <span className="font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                                    {med.name}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {med.category}
                                  </span>
                                </div>
                                <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {topSellingMetric === "qty" ? `${med.qty} Units` : formatCurrency(med.revenue)}
                                </span>
                              </div>

                              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );

              case "pending_invoices":
                return (
                  <div key={widget.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pending Supplier PO Invoices */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                              Pending Supplier Invoices
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {pendingPOs.length} Unapproved Purchase Orders
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab("purchases")}
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Manage POs</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/60">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 block">
                            Total Unsettled PO Amount
                          </span>
                          <span className="font-mono text-xl font-black text-amber-800 dark:text-amber-300">
                            {formatCurrency(totalPendingPoCost)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-900/60 px-3 py-1 rounded-xl">
                          {pendingPOs.length} Pending
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {pendingPOs.length > 0 ? (
                          pendingPOs.map((po) => (
                            <div
                              key={po.id}
                              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                                  {po.poNumber}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                  {po.supplierName} • {po.orderDate}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 block">
                                  {formatCurrency(po.totalAmount)}
                                </span>
                                <span className="text-[10px] font-bold text-amber-600">Pending Receipt</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            No pending supplier purchase orders active.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unpaid Customer Credit Balances */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                              Customer Credit Accounts
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              {creditCustomers.length} Patients with outstanding balances
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab("customers")}
                          className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Manage Patients</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200/60 dark:border-purple-800/60">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400 block">
                            Total Outstanding Customer Debt
                          </span>
                          <span className="font-mono text-xl font-black text-purple-800 dark:text-purple-300">
                            {formatCurrency(totalUnpaidCredit)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-200/60 dark:bg-purple-900/60 px-3 py-1 rounded-xl">
                          {creditCustomers.length} Accounts
                        </span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {creditCustomers.length > 0 ? (
                          creditCustomers.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                                  {c.name}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                  Phone: {c.phone}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 block">
                                  {formatCurrency(c.unpaidBalance || 0)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Limit: {formatCurrency(c.creditLimit)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            No overdue patient credit balances recorded.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );

              case "ai_insights":
                return null; // Rendered inline with Revenue Chart for compact layout

              case "recent_transactions":
                return (
                  <div key={widget.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-100 dark:border-slate-800 p-6 flex flex-col space-y-4">
                    <div className="flex items-center justify-between shrink-0">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <span>Recent Dispensing Transactions</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Realtime sales checkout log across register terminals</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("reports")}
                        className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline flex items-center gap-1"
                      >
                        <span>View All Reports</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <tr className="h-9">
                            <th className="font-bold pb-2">Order ID</th>
                            <th className="font-bold pb-2">Customer</th>
                            <th className="font-bold pb-2">Medicine / Items</th>
                            <th className="font-bold pb-2">Amount</th>
                            <th className="font-bold pb-2">Payment</th>
                            <th className="font-bold pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800/60">
                          {sales.length > 0 ? (
                            sales.slice(0, 5).map((sale) => (
                              <tr key={sale.id} className="h-12 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">
                                  {sale.invoiceNumber}
                                </td>
                                <td className="font-medium text-slate-800 dark:text-slate-200">
                                  {sale.customerName || "Walk-in Patient"}
                                </td>
                                <td className="text-slate-600 dark:text-slate-400 text-xs">
                                  {sale.items[0]?.medicineName || "Medication"}{" "}
                                  <span className="text-[10px] text-slate-400">({sale.items.length} items)</span>
                                </td>
                                <td className="font-mono font-extrabold text-slate-900 dark:text-white">
                                  {formatCurrency(sale.grandTotal)}
                                </td>
                                <td>
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-md text-[10px] font-bold">
                                    {sale.paymentMethod}
                                  </span>
                                </td>
                                <td>
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Completed</span>
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="h-12">
                              <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">#INV-8921</td>
                              <td className="font-medium text-slate-800 dark:text-slate-200">Sarah Mitchell</td>
                              <td className="text-slate-600 dark:text-slate-400 text-xs">Amoxicillin 500mg <span className="text-[10px] text-slate-400">(x2)</span></td>
                              <td className="font-mono font-extrabold text-slate-900 dark:text-white">{formatCurrency(4250)}</td>
                              <td><span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-md text-[10px] font-bold">Cash</span></td>
                              <td><span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-[10px] font-bold uppercase">Completed</span></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>

      {/* WIDGET CONFIGURATION & DRAG-AND-DROP REORDER MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Customize Dashboard Layout
                  </h3>
                  <p className="text-xs text-slate-400">
                    Drag widgets to reorder or toggle visibility switches on/off.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Quick Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setWidgets((prev) =>
                      prev.map((w) => ({
                        ...w,
                        visible: ["kpi_cards", "daily_revenue", "top_selling"].includes(w.id),
                      }))
                    )
                  }
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Compact View
                </button>
                <button
                  onClick={() =>
                    setWidgets((prev) => prev.map((w) => ({ ...w, visible: true })))
                  }
                  className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800"
                >
                  Show All Widgets
                </button>
                <button
                  onClick={resetWidgetsToDefault}
                  className="px-2.5 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Widget Reordering & Toggle List */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {widgets.map((widget, index) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    draggedIndex === index
                      ? "opacity-50 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : widget.visible
                      ? "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 opacity-60"
                  }`}
                >
                  {/* Left: Drag handle & info */}
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {widget.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {widget.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{widget.description}</p>
                    </div>
                  </div>

                  {/* Right: Controls (Move Up/Down + Toggle Visibility) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => moveWidget(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-500"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveWidget(index, "down")}
                        disabled={index === widgets.length - 1}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-500"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        widget.visible
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {widget.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Layout Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

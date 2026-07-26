import React from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { DashboardSkeleton } from "../ui/ModuleSkeletons";
import { RbacGuard } from "../auth/RbacGuard";
import { NearExpiryWidget } from "./NearExpiryWidget";
import {
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SALES_TREND_DATA = [
  { day: "Mon", sales: 320000, profit: 110000, rxCount: 42 },
  { day: "Tue", sales: 410000, profit: 145000, rxCount: 51 },
  { day: "Wed", sales: 380000, profit: 130000, rxCount: 48 },
  { day: "Thu", sales: 520000, profit: 190000, rxCount: 65 },
  { day: "Fri", sales: 610000, profit: 220000, rxCount: 78 },
  { day: "Sat", sales: 740000, profit: 280000, rxCount: 92 },
  { day: "Sun", sales: 489000, profit: 175000, rxCount: 58 },
];

export const DashboardOverview: React.FC = () => {
  const { medicines, sales, prescriptions, setActiveTab, formatCurrency, isLoading } = usePharmacy();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Metrics
  const todaySalesTotal = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalStockValue = medicines.reduce((acc, m) => acc + m.stock * m.purchasePrice, 0);
  const lowStockCount = medicines.filter((m) => m.stock <= m.minStock).length;
  
  // Calculate Near Expiry Count across batches
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {/* Card 1: Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
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

        {/* Card 3: Near Expiry Alerts (30, 60, 90 Days) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full uppercase">
              Low Stock
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium font-sans font-medium">Low Stock Reorders</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {lowStockCount} Items
          </p>
        </div>
      </div>

      {/* Daily Near Expiry Scan & Notification Console */}
      <NearExpiryWidget />

      {/* Main Analytics Section: Chart + Dark AI Insights Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sales Performance Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Weekly revenue velocity across active pharmacy registers</p>
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

        {/* AI Insights Dark Card */}
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
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl text-sm font-bold shadow-lg shadow-blue-900/40 text-white z-10"
          >
            Auto-Generate Purchase Order
          </button>
        </div>
      </div>

      {/* Recent Transactions Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab("reports")}
            className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
          >
            View All Activity →
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
                <th className="font-bold pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800/60">
              {sales.length > 0 ? (
                sales.slice(0, 4).map((sale) => (
                  <tr key={sale.id} className="h-12 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">{sale.invoiceNumber}</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{sale.customerName}</td>
                    <td className="text-slate-600 dark:text-slate-400">
                      {sale.items[0]?.medicineName || "Medication"}{" "}
                      <span className="text-[10px] text-slate-400">({sale.items.length} items)</span>
                    </td>
                    <td className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(sale.grandTotal)}</td>
                    <td>
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-md text-[10px] font-bold uppercase">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="h-12">
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-200">#INV-8921</td>
                  <td className="font-medium text-slate-800 dark:text-slate-200">Sarah Mitchell</td>
                  <td className="text-slate-600 dark:text-slate-400">Amoxicillin 500mg <span className="text-[10px] text-slate-400">(x2)</span></td>
                  <td className="font-extrabold text-slate-900 dark:text-white">{formatCurrency(4250)}</td>
                  <td><span className="px-2.5 py-1 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-md text-[10px] font-bold uppercase">COMPLETED</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

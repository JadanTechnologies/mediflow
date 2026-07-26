import React, { useState, useEffect } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { AttendanceRecord, SystemUser } from "../../types/pharmacy";
import {
  Clock,
  CalendarCheck,
  Calculator,
  UserCheck,
  UserX,
  AlertTriangle,
  Building2,
  Search,
  Filter,
  Printer,
  Download,
  PlusCircle,
  Key,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";

export const AttendanceTrackerModule: React.FC = () => {
  const {
    currentUser,
    systemUsers,
    attendanceRecords,
    payrollProfiles,
    currentBranch,
    branches,
    clockIn,
    clockOut,
    addAttendanceRecord,
    getTodayAttendanceStatus,
    formatCurrency,
    hasPermission,
  } = usePharmacy();

  // Active View Tabs
  const [activeSubTab, setActiveSubTab] = useState<"TERMINAL" | "LOGS" | "PAYROLL">("TERMINAL");

  // Terminal Clock In/Out State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser?.id || "usr-1");
  const [staffPin, setStaffPin] = useState<string>("");
  const [shiftNote, setShiftNote] = useState<string>("");
  const [terminalMessage, setTerminalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Daily Logs Filter State
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [logBranchFilter, setLogBranchFilter] = useState<string>("ALL");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("ALL");
  const [logDateFilter, setLogDateFilter] = useState<string>("");

  // Payroll Summary State
  const [payrollMonth, setPayrollMonth] = useState<string>("2026-07");
  const [selectedPayslipUser, setSelectedPayslipUser] = useState<string | null>(null);

  // Manual Log Entry Modal
  const [showManualLogModal, setShowManualLogModal] = useState<boolean>(false);
  const [manualLogUser, setManualLogUser] = useState<string>("usr-1");
  const [manualLogDate, setManualLogDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [manualClockIn, setManualClockIn] = useState<string>("08:00");
  const [manualClockOut, setManualClockOut] = useState<string>("17:00");
  const [manualStatus, setManualStatus] = useState<AttendanceRecord["status"]>("On Time");
  const [manualNotes, setManualNotes] = useState<string>("Approved by HR Manager");

  // Live timer for terminal
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update selected staff when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setSelectedStaffId(currentUser.id);
    }
  }, [currentUser]);

  const activeStaffUser = systemUsers.find((u) => u.id === selectedStaffId) || currentUser || systemUsers[0];
  const staffTodayRecord = activeStaffUser ? getTodayAttendanceStatus(activeStaffUser.id) : undefined;

  // Handle Clock In
  const handleClockIn = () => {
    setTerminalMessage(null);
    if (!activeStaffUser) return;

    // Optional PIN verification if PIN entered
    if (staffPin && staffPin !== activeStaffUser.pin) {
      setTerminalMessage({ type: "error", text: `Invalid Security PIN for ${activeStaffUser.name}.` });
      return;
    }

    const res = clockIn(activeStaffUser.id, shiftNote);
    if (res.success) {
      setTerminalMessage({ type: "success", text: res.message });
      setShiftNote("");
      setStaffPin("");
    } else {
      setTerminalMessage({ type: "error", text: res.message });
    }
  };

  // Handle Clock Out
  const handleClockOut = () => {
    setTerminalMessage(null);
    if (!activeStaffUser) return;

    if (staffPin && staffPin !== activeStaffUser.pin) {
      setTerminalMessage({ type: "error", text: `Invalid Security PIN for ${activeStaffUser.name}.` });
      return;
    }

    const res = clockOut(activeStaffUser.id, shiftNote);
    if (res.success) {
      setTerminalMessage({ type: "success", text: res.message });
      setShiftNote("");
      setStaffPin("");
    } else {
      setTerminalMessage({ type: "error", text: res.message });
    }
  };

  // Filtered Daily Logs
  const filteredLogs = attendanceRecords.filter((rec) => {
    const matchesSearch =
      rec.userName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      rec.userRole.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      rec.notes?.toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesBranch = logBranchFilter === "ALL" || rec.branchId === logBranchFilter;
    const matchesStatus = logStatusFilter === "ALL" || rec.status === logStatusFilter;
    const matchesDate = !logDateFilter || rec.date === logDateFilter;

    return matchesSearch && matchesBranch && matchesStatus && matchesDate;
  });

  // Calculate Monthly Payroll Aggregates per user
  const monthlyPayrollData = systemUsers.map((user) => {
    const profile = payrollProfiles.find((p) => p.userId === user.id) || {
      userId: user.id,
      userName: user.name,
      roleName: user.roleName,
      baseMonthlySalaryNGN: 250000,
      hourlyRateNGN: 1450,
      overtimeRateMultiplier: 1.5,
      lateDeductionPerMinNGN: 50,
      bankName: "First Bank of Nigeria",
      accountNumber: "0000000000",
    };

    // Filter user's attendance for selected month
    const userMonthRecords = attendanceRecords.filter((rec) => {
      return rec.userId === user.id && rec.date.startsWith(payrollMonth);
    });

    const daysPresent = userMonthRecords.length;
    const totalWorkHours = userMonthRecords.reduce((acc, r) => acc + (r.workHours || 0), 0);
    const totalOvertimeHours = userMonthRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
    const totalLateMinutes = userMonthRecords.reduce((acc, r) => acc + (r.lateMinutes || 0), 0);
    const lateOccurrences = userMonthRecords.filter((r) => r.status === "Late" || r.lateMinutes > 0).length;

    // Financial calculations (in NGN ₦)
    const overtimeBonusNGN = totalOvertimeHours * profile.hourlyRateNGN * profile.overtimeRateMultiplier;
    const lateDeductionNGN = totalLateMinutes * profile.lateDeductionPerMinNGN;
    const netPayableNGN = Math.max(0, profile.baseMonthlySalaryNGN + overtimeBonusNGN - lateDeductionNGN);

    return {
      user,
      profile,
      daysPresent,
      totalWorkHours: Number(totalWorkHours.toFixed(1)),
      totalOvertimeHours: Number(totalOvertimeHours.toFixed(1)),
      totalLateMinutes,
      lateOccurrences,
      overtimeBonusNGN,
      lateDeductionNGN,
      netPayableNGN,
    };
  });

  // Total Payroll Summary Metrics
  const grandTotalPayrollNGN = monthlyPayrollData.reduce((acc, item) => acc + item.netPayableNGN, 0);
  const grandTotalOvertimeNGN = monthlyPayrollData.reduce((acc, item) => acc + item.overtimeBonusNGN, 0);
  const grandTotalDeductionsNGN = monthlyPayrollData.reduce((acc, item) => acc + item.lateDeductionNGN, 0);
  const totalOnDutyToday = systemUsers.filter((u) => {
    const rec = getTodayAttendanceStatus(u.id);
    return rec && !rec.clockOutTime;
  }).length;

  // Handle Manual Log Submission
  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const userObj = systemUsers.find((u) => u.id === manualLogUser);
    if (!userObj) return;

    const clockInDateTime = `${manualLogDate}T${manualClockIn}:00`;
    const clockOutDateTime = manualClockOut ? `${manualLogDate}T${manualClockOut}:00` : undefined;

    // Estimate work hours
    let hours = 8;
    if (manualClockIn && manualClockOut) {
      const start = new Date(clockInDateTime).getTime();
      const end = new Date(clockOutDateTime!).getTime();
      hours = Math.max(0.5, Number(((end - start) / (1000 * 3600)).toFixed(1)));
    }

    addAttendanceRecord({
      userId: userObj.id,
      userName: userObj.name,
      userRole: userObj.roleName,
      branchId: userObj.branchId || currentBranch.id,
      branchName: userObj.branchName || currentBranch.name,
      date: manualLogDate,
      clockInTime: new Date(clockInDateTime).toISOString(),
      clockOutTime: clockOutDateTime ? new Date(clockOutDateTime).toISOString() : undefined,
      status: manualStatus,
      workHours: hours,
      overtimeHours: hours > 8 ? hours - 8 : 0,
      lateMinutes: manualStatus === "Late" ? 30 : 0,
      notes: manualNotes,
    });

    setShowManualLogModal(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:space-y-4 print:max-w-none print:w-full">
      {/* Printable Header - hidden on screen */}
      <div className="hidden print:block p-4 mb-4 border-b border-slate-300">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">MediFlow ERP - Official Staff Attendance & Payroll Ledger</h1>
            <p className="text-xs text-slate-600">
              Branch: {currentBranch?.name || "Main Branch"} | Period: {payrollMonth} | Generated: {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Currency: NGN (₦) | FIRS TIN: 23948102-0001</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-800 rounded border border-slate-300">
              PAYROLL & AUDIT SUMMARY
            </span>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Staff Attendance & Payroll Station
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Biometric shift clock terminal, daily attendance ledger, and automated NGN payroll calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sub-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveSubTab("TERMINAL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "TERMINAL"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Clock Terminal</span>
            </button>
            <button
              onClick={() => setActiveSubTab("LOGS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "LOGS"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              <span>Daily Logs</span>
            </button>
            <button
              onClick={() => setActiveSubTab("PAYROLL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === "PAYROLL"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Payroll Summary</span>
            </button>
          </div>

          <button
            onClick={() => setShowManualLogModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Top Quick Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Clocked In Now
            </span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {totalOnDutyToday} / {systemUsers.length} Staff
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Standard Shift
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              08:00 AM - 05:00 PM
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Est. Monthly Payroll
            </span>
            <span className="text-sm font-mono font-extrabold text-purple-600 dark:text-purple-400">
              {formatCurrency(grandTotalPayrollNGN)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Branch Location
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px] block">
              {currentBranch?.name || "Main HQ"}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: CLOCK IN / OUT TERMINAL STATION */}
      {activeSubTab === "TERMINAL" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Clock Terminal Box */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Staff Shift Terminal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify staff credentials & timestamp entry/exit
                  </p>
                </div>
              </div>

              {/* Live Digital Clock */}
              <div className="text-right">
                <div className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  {currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Feedback Alert Message */}
            {terminalMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
                  terminalMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20"
                }`}
              >
                {terminalMessage.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span>{terminalMessage.text}</span>
              </div>
            )}

            {/* Staff Selection Dropdown */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Staff Member to Clock In/Out:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {systemUsers.map((u) => {
                    const statusRec = getTodayAttendanceStatus(u.id);
                    const isClockedIn = statusRec && !statusRec.clockOutTime;
                    const isSelected = selectedStaffId === u.id;

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(u.id);
                          setTerminalMessage(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-[10px] text-slate-500">{u.roleName} • {u.branchName}</p>
                        </div>
                        {isClockedIn ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            ON DUTY
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            OFF DUTY
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected User Summary Card */}
              {activeStaffUser && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {activeStaffUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Role: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeStaffUser.roleName}</span> | Branch: {activeStaffUser.branchName}
                      </p>
                    </div>

                    {staffTodayRecord ? (
                      staffTodayRecord.clockOutTime ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          Completed Today ({staffTodayRecord.workHours} hrs)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 animate-pulse">
                          Clocked In @ {new Date(staffTodayRecord.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Not Clocked In Today
                      </span>
                    )}
                  </div>

                  {/* Optional Staff Security PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Staff Security PIN (4-digit):
                      </label>
                      <div className="relative">
                        <Key className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          maxLength={4}
                          value={staffPin}
                          onChange={(e) => setStaffPin(e.target.value)}
                          placeholder="Default PIN: 1111"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Shift / Activity Note:
                      </label>
                      <input
                        type="text"
                        value={shiftNote}
                        onChange={(e) => setShiftNote(e.target.value)}
                        placeholder="e.g. Morning inventory duty, traffic..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Big Action Clock Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleClockIn}
                  disabled={Boolean(staffTodayRecord && !staffTodayRecord.clockOutTime)}
                  className={`py-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-1 shadow-md transition-all ${
                    staffTodayRecord && !staffTodayRecord.clockOutTime
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    <span>CLOCK IN SHIFT</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-90">Start duty timestamp</span>
                </button>

                <button
                  type="button"
                  onClick={handleClockOut}
                  disabled={!staffTodayRecord || Boolean(staffTodayRecord.clockOutTime)}
                  className={`py-4 rounded-2xl font-extrabold text-sm flex flex-col items-center justify-center gap-1 shadow-md transition-all ${
                    !staffTodayRecord || staffTodayRecord.clockOutTime
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserX className="h-5 w-5" />
                    <span>CLOCK OUT SHIFT</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-90">End duty timestamp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Today's Live Roster Sidebar */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Today's Shift Roster ({new Date().toISOString().split("T")[0]})
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600">
                Live
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {systemUsers.map((usr) => {
                const rec = getTodayAttendanceStatus(usr.id);
                const isOnDuty = rec && !rec.clockOutTime;

                return (
                  <div
                    key={usr.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isOnDuty
                            ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                            : rec?.clockOutTime
                            ? "bg-blue-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-slate-100">{usr.name}</p>
                        <p className="text-[10px] text-slate-500">{usr.roleName} • {usr.branchName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {rec ? (
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                              rec.status === "Late"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}
                          >
                            {rec.status === "Clocked In" ? "Active" : rec.status}
                          </span>
                          <p className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                            In: {new Date(rec.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Not in yet</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DAILY ATTENDANCE LOGS */}
      {activeSubTab === "LOGS" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Search staff name, role, notes..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={logBranchFilter}
                onChange={(e) => setLogBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30 outline-hidden"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30 outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="Clocked In">Clocked In (Active)</option>
                <option value="On Time">On Time</option>
                <option value="Late">Late Arrival</option>
                <option value="Overtime">Overtime Shift</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={logDateFilter}
                onChange={(e) => setLogDateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30 outline-hidden"
              />
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Logs</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Branch</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Clock In</th>
                    <th className="p-3.5">Clock Out</th>
                    <th className="p-3.5 text-center">Work Hours</th>
                    <th className="p-3.5 text-center">Overtime</th>
                    <th className="p-3.5 text-center">Late Mins</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No attendance records found matching current search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {rec.userName}
                          <span className="block text-[10px] font-normal text-slate-500">{rec.userRole}</span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{rec.branchName}</td>
                        <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">{rec.date}</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">
                          {new Date(rec.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-rose-600">
                          {rec.clockOutTime
                            ? new Date(rec.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : "—"}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">{rec.workHours} hrs</td>
                        <td className="p-3.5 text-center font-mono text-purple-600 font-bold">
                          {rec.overtimeHours > 0 ? `+${rec.overtimeHours} hrs` : "—"}
                        </td>
                        <td className="p-3.5 text-center font-mono text-amber-600 font-bold">
                          {rec.lateMinutes > 0 ? `${rec.lateMinutes}m` : "0m"}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                              rec.status === "On Time"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : rec.status === "Late"
                                ? "bg-amber-500/10 text-amber-600"
                                : rec.status === "Overtime"
                                ? "bg-purple-500/10 text-purple-600"
                                : "bg-blue-500/10 text-blue-600"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500 max-w-[180px] truncate">{rec.notes || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MONTHLY ATTENDANCE & PAYROLL SUMMARY */}
      {activeSubTab === "PAYROLL" && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Monthly Payroll Ledger & NGN Calculation
                </h3>
                <p className="text-xs text-slate-500">
                  Automated overtime calculations & late arrival penalties
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Month:</label>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-blue-500/30 outline-hidden"
              />
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Payroll Report</span>
              </button>
            </div>
          </div>

          {/* Monthly Summary Totals Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-900 to-blue-950 text-white shadow-md space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
                Total Monthly Payroll (NGN)
              </span>
              <span className="text-2xl font-mono font-extrabold text-blue-100 block">
                {formatCurrency(grandTotalPayrollNGN)}
              </span>
              <span className="text-[10px] text-blue-300 block">Includes Base Salary + Overtime - Deductions</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">
                Total Overtime Pay
              </span>
              <span className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400 block">
                +{formatCurrency(grandTotalOvertimeNGN)}
              </span>
              <span className="text-[10px] text-slate-500 block">Rate 1.5x Hourly Base</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                Total Late Deductions
              </span>
              <span className="text-xl font-mono font-extrabold text-rose-600 block">
                -{formatCurrency(grandTotalDeductionsNGN)}
              </span>
              <span className="text-[10px] text-slate-500 block">Penalties applied for tardiness</span>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5">Staff Name & Bank Details</th>
                    <th className="p-3.5 text-center">Days Present</th>
                    <th className="p-3.5 text-center">Total Hours</th>
                    <th className="p-3.5 text-center">Overtime Hrs</th>
                    <th className="p-3.5 text-center">Late Mins</th>
                    <th className="p-3.5 text-right">Base Salary (₦)</th>
                    <th className="p-3.5 text-right">OT Bonus (₦)</th>
                    <th className="p-3.5 text-right">Deductions (₦)</th>
                    <th className="p-3.5 text-right">Net Payable (₦)</th>
                    <th className="p-3.5 text-center print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {monthlyPayrollData.map((item) => (
                    <tr key={item.user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {item.user.name}
                        <span className="block text-[10px] font-normal text-slate-500">
                          {item.user.roleName} • {item.profile.bankName} ({item.profile.accountNumber})
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold">{item.daysPresent} days</td>
                      <td className="p-3.5 text-center font-mono">{item.totalWorkHours} hrs</td>
                      <td className="p-3.5 text-center font-mono text-purple-600 font-bold">
                        {item.totalOvertimeHours > 0 ? `+${item.totalOvertimeHours} hrs` : "—"}
                      </td>
                      <td className="p-3.5 text-center font-mono text-amber-600 font-bold">
                        {item.totalLateMinutes > 0 ? `${item.totalLateMinutes}m` : "0m"}
                      </td>
                      <td className="p-3.5 text-right font-mono">{formatCurrency(item.profile.baseMonthlySalaryNGN)}</td>
                      <td className="p-3.5 text-right font-mono text-purple-600 font-bold">
                        +{formatCurrency(item.overtimeBonusNGN)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-bold">
                        -{formatCurrency(item.lateDeductionNGN)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-blue-700 dark:text-blue-400 text-sm">
                        {formatCurrency(item.netPayableNGN)}
                      </td>
                      <td className="p-3.5 text-center print:hidden">
                        <button
                          onClick={() => setSelectedPayslipUser(item.user.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors"
                        >
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL PAYSLIP MODAL */}
      {selectedPayslipUser && (() => {
        const item = monthlyPayrollData.find((p) => p.user.id === selectedPayslipUser);
        if (!item) return null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 printable-modal-overlay">
            <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 printable-modal-content">
              {/* Modal Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-sm">Employee Official Payslip</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedPayslipUser(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Payslip Content Body */}
              <div className="space-y-4 text-xs font-sans">
                <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                  <h2 className="text-base font-extrabold uppercase text-blue-950">
                    MEDIFLOW PHARMACY ENTERPRISE
                  </h2>
                  <p className="text-slate-500 text-[11px]">Plot 14 Victoria Island Expressway, Lagos, Nigeria</p>
                  <p className="text-slate-600 font-bold text-[11px]">SALARY ADVICE / PAYSLIP — {payrollMonth}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee Name</span>
                    <span className="font-extrabold text-slate-900">{item.user.name}</span>
                    <span className="block text-[10px] text-slate-500">{item.user.roleName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Bank Account</span>
                    <span className="font-bold text-slate-800">{item.profile.bankName}</span>
                    <span className="block text-[10px] font-mono text-slate-600">{item.profile.accountNumber}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Earnings Breakdown</h4>
                  <div className="space-y-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-slate-700">
                    <div className="flex justify-between">
                      <span>Base Monthly Salary:</span>
                      <span className="font-mono font-bold">{formatCurrency(item.profile.baseMonthlySalaryNGN)}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 font-semibold">
                      <span>Overtime Bonus ({item.totalOvertimeHours} hrs @ 1.5x):</span>
                      <span className="font-mono">+{formatCurrency(item.overtimeBonusNGN)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Deductions Breakdown</h4>
                  <div className="space-y-1 bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-slate-700">
                    <div className="flex justify-between text-rose-700 font-semibold">
                      <span>Late Arrival Penalties ({item.totalLateMinutes} mins):</span>
                      <span className="font-mono">-{formatCurrency(item.lateDeductionNGN)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-900 text-white rounded-2xl font-bold text-sm">
                  <span>NET PAYABLE SALARY:</span>
                  <span className="font-mono text-base">{formatCurrency(item.netPayableNGN)}</span>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-200">
                  This payslip is automatically generated by MediFlow ERP HR Module. Confidential.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MANUAL ATTENDANCE LOG MODAL */}
      {showManualLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Manual Attendance Entry
              </h3>
              <button
                type="button"
                onClick={() => setShowManualLogModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Staff Member:
                </label>
                <select
                  value={manualLogUser}
                  onChange={(e) => setManualLogUser(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-hidden"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Shift Date:
                </label>
                <input
                  type="date"
                  value={manualLogDate}
                  onChange={(e) => setManualLogDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Clock In Time:</label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Clock Out Time:</label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Status:</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as AttendanceRecord["status"])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-hidden"
                >
                  <option value="On Time">On Time</option>
                  <option value="Late">Late Arrival</option>
                  <option value="Overtime">Overtime Shift</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason / Notes:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Offsite meeting, medical leave..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-md"
                >
                  Save Attendance Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

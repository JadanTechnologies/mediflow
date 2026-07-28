import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { usePharmacy } from "../../context/PharmacyContext";
import { SystemUser } from "../../types/pharmacy";
import { Lock, ShieldCheck, KeyRound, User, ChevronDown, AlertCircle, Eye, EyeOff } from "lucide-react";

export const LockScreenModal: React.FC = () => {
  const { isLocked, unlockTerminal, currentUser, systemUsers, loginAsUser } = usePharmacy();
  const [selectedUser, setSelectedUser] = useState<SystemUser>(currentUser || systemUsers[0]);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);

  const handleKeypadPress = (val: string) => {
    setErrorMsg("");
    if (pinInput.length < 4) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg("");
    setPinInput((prev) => prev.slice(0, -1));
  };

  const verifyPin = (pinToTest: string) => {
    if (selectedUser && pinToTest === selectedUser.pin) {
      loginAsUser(selectedUser.id);
      unlockTerminal();
      setPinInput("");
      setErrorMsg("");
    } else {
      setErrorMsg("Invalid PIN code. Please check and try again.");
      setPinInput("");
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          key="lockscreen-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            key="lockscreen-modal"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-5 my-auto"
          >
            {/* Terminal Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shadow-inner">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                MediFlow Terminal Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select user account from dropdown and type PIN to log in
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900/50 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Idle Timer & Access Security Active</span>
              </div>
            </div>

            {/* User Selection Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Select Staff User Account</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase">
                  {selectedUser.roleName}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
                  <User className="h-4 w-4" />
                </div>
                <select
                  value={selectedUser.id}
                  onChange={(e) => {
                    const u = systemUsers.find((user) => user.id === e.target.value);
                    if (u) {
                      setSelectedUser(u);
                      setPinInput("");
                      setErrorMsg("");
                    }
                  }}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-xs transition-all"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-2 font-bold">
                      {u.name} — {u.roleName} ({u.branchName})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* PIN Input Field (Keyboard Direct Typing) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Type Security PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 dark:text-blue-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPinInput(val);
                    setErrorMsg("");
                    if (val.length === 4) {
                      verifyPin(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pinInput.length >= 4) {
                      verifyPin(pinInput);
                    }
                  }}
                  placeholder="Type 4-digit PIN..."
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono tracking-[0.4em] text-center text-lg font-black focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* PIN status indicator dots */}
              <div className="flex justify-center items-center space-x-2 pt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      pinInput.length > i
                        ? "bg-blue-600 border-blue-600 scale-110 shadow-xs"
                        : "border-slate-300 dark:border-slate-700 bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center font-mono pt-1">
                Demo PIN for {selectedUser.name}: <strong className="text-blue-600 dark:text-blue-400">{selectedUser.pin}</strong>
              </p>
            </div>

            {/* On-screen Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-base text-slate-800 dark:text-slate-100 transition-all active:scale-95 shadow-xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput("")}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-500 transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-base text-slate-800 dark:text-slate-100 transition-all active:scale-95 shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-500 transition-all"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Action Button */}
            <button
              type="button"
              onClick={() => verifyPin(pinInput)}
              disabled={pinInput.length < 4}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>Authenticate & Log In</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};


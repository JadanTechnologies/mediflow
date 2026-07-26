import React, { useState } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { SystemUser } from "../../types/pharmacy";
import { Lock, ShieldCheck, KeyRound, User, ChevronRight, AlertCircle, LogOut } from "lucide-react";

export const LockScreenModal: React.FC = () => {
  const { isLocked, unlockTerminal, currentUser, systemUsers, loginAsUser } = usePharmacy();
  const [selectedUser, setSelectedUser] = useState<SystemUser>(currentUser || systemUsers[0]);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isLocked) return null;

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
      setErrorMsg("Invalid PIN code. Please try again.");
      setPinInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            MediFlow POS Terminal Locked
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter staff PIN or select user account to authenticate session
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900/50 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Idle Timer Security Auto-Lock Active</span>
          </div>
        </div>

        {/* User Selection Pill */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Select Staff Account
          </label>
          <div className="grid grid-cols-2 gap-2">
            {systemUsers.map((u) => {
              const isSel = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setPinInput("");
                    setErrorMsg("");
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center space-x-2.5 ${
                    isSel
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSel ? "bg-white/20 text-white" : "bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400"
                  }`}>
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight">{u.name}</p>
                    <p className={`text-[10px] truncate ${isSel ? "text-blue-100" : "text-slate-400"}`}>
                      {u.roleName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PIN Display */}
        <div className="space-y-3">
          <div className="flex justify-center items-center space-x-3 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  pinInput.length > i
                    ? "bg-blue-600 border-blue-600 scale-110 shadow-sm"
                    : "border-slate-300 dark:border-slate-700 bg-transparent"
                }`}
              />
            ))}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center font-mono">
            Demo PIN for {selectedUser.name}: <strong className="text-blue-600 dark:text-blue-400">{selectedUser.pin}</strong>
          </p>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypadPress(num)}
              className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-base text-slate-800 dark:text-slate-100 transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPinInput("")}
            className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-500 transition-all"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeypadPress("0")}
            className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-base text-slate-800 dark:text-slate-100 transition-all active:scale-95 shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-500 transition-all"
          >
            ⌫
          </button>
        </div>

        {/* Quick Submit */}
        <button
          onClick={() => verifyPin(pinInput)}
          disabled={pinInput.length < 4}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 disabled:opacity-40 transition-all flex items-center justify-center space-x-2"
        >
          <ShieldCheck className="h-5 w-5" />
          <span>Unlock Terminal Session</span>
        </button>
      </div>
    </div>
  );
};

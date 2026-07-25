import React, { ReactNode } from "react";
import { usePharmacy } from "../../context/PharmacyContext";
import { PermissionKey } from "../../types/pharmacy";
import { ShieldAlert, Lock, UserCheck } from "lucide-react";

interface RbacGuardProps {
  permission: PermissionKey;
  children: ReactNode;
  fallbackText?: string;
}

export const RbacGuard: React.FC<RbacGuardProps> = ({
  permission,
  children,
  fallbackText,
}) => {
  const { hasPermission, currentUser, currentRole, systemUsers, loginAsUser } = usePharmacy();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  const superAdmin = systemUsers.find((u) => u.roleName === "Super Admin");

  return (
    <div className="p-8 max-w-2xl mx-auto my-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
      <div className="inline-flex p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
        <ShieldAlert className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          Access Restricted: Role Permission Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {fallbackText ||
            `Your current role (${currentRole}) does not have permission '${permission}' required to access this module.`}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1 text-left max-w-md mx-auto">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-400">Active User:</span>
          <span className="font-bold">{currentUser?.name || "Guest"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-400">Assigned Role:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{currentRole}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-slate-400">Required Permission:</span>
          <span className="font-mono text-amber-600 font-bold">{permission}</span>
        </div>
      </div>

      {superAdmin && (
        <div className="pt-2">
          <button
            onClick={() => loginAsUser(superAdmin.id)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all inline-flex items-center space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Elevate / Switch to Super Admin Account ({superAdmin.name})</span>
          </button>
        </div>
      )}
    </div>
  );
};

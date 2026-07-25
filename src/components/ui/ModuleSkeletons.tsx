import React from "react";
import { Skeleton } from "./Skeleton";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-2xl" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts & Table Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-36 rounded flex-1" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="p-4 flex gap-4 items-center">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-5 w-48 rounded-lg flex-1" />
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48 rounded-md" />
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const PosSkeleton: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-11 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <Skeleton className="h-6 w-36 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

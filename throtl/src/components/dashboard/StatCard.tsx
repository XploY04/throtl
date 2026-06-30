import React from "react";

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  hint?: string;
};

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-sm bg-neutral-900/40 hover:bg-neutral-900/60 p-4 border border-neutral-800/40">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}
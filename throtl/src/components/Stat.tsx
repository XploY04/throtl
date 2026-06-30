export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-neutral-900/40 p-3 border border-neutral-800 text-sm">
      <div className="text-neutral-400 text-xs">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
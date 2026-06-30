export function StatusDot({ color = "emerald-400" }: { color?: string }) {
  return (
    <span className="relative inline-block w-3 h-3">
      <span
        className={`absolute inset-0 rounded-full bg-${color} animate-ping opacity-75`}
      />
      <span
        className={`relative inline-block w-3 h-3 bottom-1.5 rounded-full bg-${color} shadow-sm`}
      />
    </span>
  );
}

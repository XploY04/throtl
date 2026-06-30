export function IconButton({
  children,
  ariaLabel,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-sm px-4 py-2 border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60 transition-all duration-200 ${className} cursor-pointer`}
    >
      {children}
    </button>
  );
}



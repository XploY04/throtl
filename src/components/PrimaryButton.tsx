export function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className={`btn-grain px-4 py-2 rounded-sm bg-gradient-to-r from-neutral-600 via-neutral-700 to-neutral-800
hover:from-neutral-500 hover:via-neutral-600 hover:to-neutral-700
text-neutral-100 font-medium text-sm cursor-pointer transition-all duration-300 ease-out
shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_2px_4px_rgba(0,0,0,0.6)]
hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),_0_4px_8px_rgba(0,0,0,0.8)]
active:scale-[0.99] flex items-center gap-2 group`}
    >
      {children}
    </button>
  );
}

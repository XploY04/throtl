import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTAButton({ children, to = "/dashboard" }: { children: React.ReactNode; to?: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 rounded-sm bg-gradient-to-r from-neutral-600 via-neutral-700 to-neutral-800
hover:from-neutral-500 hover:via-neutral-600 hover:to-neutral-700
text-neutral-100 font-medium text-sm cursor-pointer transition-all duration-300 ease-out
shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),_0_2px_4px_rgba(0,0,0,0.6)]
hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),_0_4px_8px_rgba(0,0,0,0.8)]
active:scale-[0.99]  group px-4 py-2 "
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}
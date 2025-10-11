// Filename: src/components/dashboard/Header.tsx

import { Cpu, RefreshCw } from "lucide-react";
import { IconButton } from "../IconButton";
import { PrimaryButton } from "../PrimaryButton";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Network Dashboard
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Realtime overview of network activity & connected devices
        </p>
      </div>

      <div className="flex items-center gap-3">
        <IconButton ariaLabel="Refresh">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </IconButton>
        
        <PrimaryButton>
          <Cpu className="w-4 h-4 inline" />
          Throtl
        </PrimaryButton>
      </div>
    </header>
  );
}
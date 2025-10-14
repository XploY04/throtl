// Filename: src/components/dashboard/Header.tsx

import { Cpu, RefreshCw } from "lucide-react";
import { IconButton } from "../IconButton";
import { PrimaryButton } from "../PrimaryButton";
import { ConnectionStatus } from "../ConnectionStatus";

interface HeaderProps {
  isConnected?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function Header({ isConnected = true, error = null, onRefresh }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Network Dashboard
          </h1>
          <ConnectionStatus isConnected={isConnected} error={error} />
        </div>
        <p className="text-sm text-neutral-400 mt-1">
          Real-time overview of your network
        </p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <IconButton
          ariaLabel="Refresh"
          onClick={onRefresh}
          className="w-full sm:w-auto flex-grow sm:flex-grow-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </IconButton>
        
        <PrimaryButton className="w-full sm:w-auto flex-grow sm:flex-grow-0">
          <Cpu className="w-4 h-4 inline" />
          <span>Throtl</span>
        </PrimaryButton>
      </div>
    </header>
  );
}
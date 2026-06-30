import { WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  className?: string;
}

export function ConnectionStatus({ isConnected, error, className = '' }: ConnectionStatusProps) {
  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-400 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Connection Error</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 text-yellow-400 ${className}`}>
        <WifiOff className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-green-400 ${className}`}>
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm">Connected</span>
    </div>
  );
}
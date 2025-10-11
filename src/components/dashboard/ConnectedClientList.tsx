// Filename: src/components/dashboard/ConnectedClientsList.tsx
import type { Client } from "../../types";
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, Wifi, WifiOff } from 'lucide-react';

const formatBps = (bps: number) => {
    if (bps > 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    return `${(bps / 1_000).toFixed(1)} Kbps`;
};

const BandwidthBar = ({ bps, maxBps }: { bps: number; maxBps: number }) => {
  const percentage = maxBps > 0 ? (bps / maxBps) * 100 : 0;
  return (
    <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
      <motion.div 
        className={`h-full ${percentage > 70 ? 'bg-red-500' : percentage > 40 ? 'bg-yellow-500' : 'bg-sky-500'}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

type Props = {
  clients: Client[];
  onClientSelect: (ip: string | null) => void;
  selectedClientIp: string | null;
  onThrottle?: (ip: string) => Promise<{ success: boolean; message: string }>;
  onUnthrottle?: (ip: string) => Promise<{ success: boolean; message: string }>;
};

export function ConnectedClientsList({ 
  clients, 
  onClientSelect, 
  selectedClientIp, 
  onThrottle, 
  onUnthrottle 
}: Props) {
  const sortedClients = [...clients].sort((a, b) => b.liveDownload - a.liveDownload);
  const maxBps = Math.max(...clients.map(c => c.liveDownload), 1);

  const handleThrottleClick = async (e: React.MouseEvent, client: Client) => {
    e.stopPropagation(); // Prevent client selection
    
    if (client.status === 'throttled') {
      if (onUnthrottle) {
        await onUnthrottle(client.ip);
      }
    } else {
      if (onThrottle) {
        await onThrottle(client.ip);
      }
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-200">Connected Clients</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Wifi className="w-4 h-4" />
          <span>{clients.length} devices</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence>
          {sortedClients.map((client) => (
            <motion.div
              key={client.ip}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => onClientSelect(selectedClientIp === client.ip ? null : client.ip)}
              className={`p-3 rounded-sm cursor-pointer transition-colors ${
                selectedClientIp === client.ip 
                  ? 'bg-sky-900/50 border border-sky-700' 
                  : 'hover:bg-neutral-800 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    client.status === 'throttled' 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-green-500'
                  }`}></span>
                  <div className="flex flex-col">
                    <span className="font-mono text-neutral-300 text-sm">
                      {client.hostname || client.ip}
                    </span>
                    {client.hostname && client.hostname !== client.ip && (
                      <span className="font-mono text-neutral-500 text-xs">{client.ip}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-mono text-neutral-400 block">
                      ↓ {formatBps(client.liveDownload)}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">
                      ↑ {formatBps(client.liveUpload)}
                    </span>
                  </div>
                  <BandwidthBar bps={client.liveDownload} maxBps={maxBps} />
                  
                  {(onThrottle || onUnthrottle) && (
                    <button
                      onClick={(e) => handleThrottleClick(e, client)}
                      className={`p-1.5 rounded transition-colors ${
                        client.status === 'throttled'
                          ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                          : 'text-neutral-400 hover:bg-neutral-700 hover:text-white'
                      }`}
                      title={client.status === 'throttled' ? 'Unthrottle device' : 'Throttle device'}
                    >
                      {client.status === 'throttled' ? (
                        <ZapOff className="w-4 h-4" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {client.mac && (
                <div className="mt-1 text-xs text-neutral-500 font-mono">
                  MAC: {client.mac}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {clients.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No devices detected</p>
            <p className="text-sm">Waiting for network data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
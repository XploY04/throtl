// Filename: src/components/dashboard/ConnectedClientsList.tsx
import type { Client } from "../../types";
import { motion, AnimatePresence } from 'framer-motion';

const formatBps = (bps: number) => {
    if (bps > 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    return `${(bps / 1_000).toFixed(1)} Kbps`;
};

const BandwidthBar = ({ bps, maxBps }: { bps: number; maxBps: number }) => {
  const percentage = maxBps > 0 ? (bps / maxBps) * 100 : 0;
  return (
    <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-sky-500" 
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
};

export function ConnectedClientsList({ clients, onClientSelect, selectedClientIp }: Props) {
  const sortedClients = [...clients].sort((a, b) => b.liveDownload - a.liveDownload);
  const maxBps = Math.max(...clients.map(c => c.liveDownload), 1); // Avoid division by zero

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4">
      <h3 className="text-lg font-semibold text-neutral-200 mb-4">Connected Clients</h3>
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
              className={`p-2 rounded-sm cursor-pointer flex items-center justify-between transition-colors ${selectedClientIp === client.ip ? 'bg-sky-900/50' : 'hover:bg-neutral-800'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${client.status === 'throttled' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                <span className="font-mono text-neutral-300">{client.ip}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-neutral-400 w-24 text-right">{formatBps(client.liveDownload)}</span>
                <BandwidthBar bps={client.liveDownload} maxBps={maxBps} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
// Filename: src/pages/Dashboard.tsx

import React from "react";
import { motion } from "framer-motion";

// Import your new components and hook
import { Header } from "../components/dashboard/Header";
import { StatCard } from "../components/dashboard/StatCard";
import { NetworkHealthChart } from "../components/dashboard/NetworkHealthChart";
import { ConnectedClientsList } from "../components/dashboard/ConnectedClientList";
import { BandwidthDonutChart } from "../components/dashboard/BandwidthDonutChart";
import { EventsLog } from "../components/dashboard/EventsLog";
import { useNetworkData, THRESHOLD_BPS } from "../hooks/useNetworkData";

export function Dashboard() {
  // All the complex logic is now hidden inside this single hook
  const { clients, chartData, events, selectedClientIp, setSelectedClientIp } = useNetworkData();

  const selectedClient = clients.find(c => c.ip === selectedClientIp);
  const totalBandwidthBps = clients.reduce((sum, client) => sum + client.liveDownload, 0);
  
  const formatBps = (bps: number) => {
    if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
    if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
    return `${(bps / 1_000).toFixed(1)} Kbps`;
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 shadow-2xl border border-neutral-800">
            {/* Header for the main chart card */}
            <h2 className="text-lg font-semibold">Network Activity</h2>
            <p className="text-sm text-neutral-400 mt-1">
              Real-time throughput and device status
            </p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <NetworkHealthChart 
                data={chartData} 
                threshold={THRESHOLD_BPS}
                selectedClientData={selectedClient?.downloadHistory}
                selectedClientIp={selectedClientIp}
              />
            </motion.div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Bandwidth" value={<>{formatBps(totalBandwidthBps)}</>} hint="Total throughput" />
              <StatCard title="Active Devices" value={clients.length} hint="Currently on network" />
              <StatCard title="Avg Latency" value={<>24 ms</>} hint="Stable" />
            </div>
          </div>
          <EventsLog events={events} />
        </section>

        <aside className="lg:col-span-1 space-y-8">
          <BandwidthDonutChart clients={clients} />
          <ConnectedClientsList 
            clients={clients} 
            onClientSelect={setSelectedClientIp}
            selectedClientIp={selectedClientIp}
          />
        </aside>
      </div>
    </div>
  );
}
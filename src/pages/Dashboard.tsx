import { motion } from "framer-motion";
import { Header } from "../components/dashboard/Header";
import { StatCard } from "../components/dashboard/StatCard";
import { NetworkHealthChart } from "../components/dashboard/NetworkHealthChart";
import { ConnectedClientsList } from "../components/dashboard/ConnectedClientList";
import { BandwidthDonutChart } from "../components/dashboard/BandwidthDonutChart";
import { EventsLog } from "../components/dashboard/EventsLog";
import { useNetworkData, THRESHOLD_BPS } from "../hooks/useNetworkData";
import { formatBandwidth } from "../services/api";

export function Dashboard() {
  const { 
    clients, 
    chartData, 
    events, 
    selectedClientIp, 
    setSelectedClientIp,
    globalStats,
    isConnected,
    error,
    throttleDevice,
    unthrottleDevice
  } = useNetworkData();

  const selectedClient = clients.find(c => c.ip === selectedClientIp);
  const totalBandwidthBps = globalStats.totalDownload;

  return (
    // Responsive padding: p-4 on mobile, md:p-8 on larger screens
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <Header 
        isConnected={isConnected} 
        error={error}
        onRefresh={() => window.location.reload()}
      />

      {/* Connection Status messages are already responsive */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-sm p-4">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}
      {!isConnected && !error && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-sm p-4">
          <p className="text-yellow-400 text-sm">🔄 Connecting to NetGuardian backend...</p>
        </div>
      )}

      {/* This grid is already responsive: 1 col on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-4 md:p-6 shadow-2xl border border-neutral-800">
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
            
            {/* These stat cards are also responsive: 1 col on mobile, 3 on sm+ */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard 
                title="Download" 
                value={formatBandwidth(totalBandwidthBps)} 
                hint="Total network download" 
              />
              <StatCard 
                title="Upload" 
                value={formatBandwidth(globalStats.totalUpload)} 
                hint="Total network upload" 
              />
              <StatCard 
                title="Active Devices" 
                value={clients.length} 
                hint="Currently on network" 
              />
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
            onThrottle={throttleDevice}
            onUnthrottle={unthrottleDevice}
          />
        </aside>
      </div>
    </div>
  );
}
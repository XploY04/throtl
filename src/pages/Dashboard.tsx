import React from "react";
import { motion } from "framer-motion";
import { StatusDot } from "../components/StatusDot";
import { IconButton } from "../components/IconButton";
import { Cpu, RefreshCw } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { DeviceList } from "../components/DeviceList";

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-sm bg-neutral-900/40 hover:bg-neutral-900/60 p-4 border border-neutral-800/40">
      <div className="text-sm text-neutral-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

function ChartCard() {
  return (
    <div className="rounded-sm bg-gradient-to-br from-neutral-900 to-neutral-800/50 h-96 flex items-center justify-center border border-neutral-800/40">
      <div className="text-neutral-500">Chart will go here</div>
    </div>
  );
}

function ActivityFeed() {
  const items = [
    '[12:32] Device "Printer-01" joined the network (192.168.1.45)',
    "[12:28] High throughput detected on VLAN 10",
    "[12:20] New TLS certificate issued for gateway.example.com",
    "[12:05] Firewall rule updated: blocked suspicious IP",
  ];

  return (
    <div className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 shadow-2xl border border-neutral-800">
      <h3 className="text-lg font-semibold mb-3">Activity Feed</h3>
      <div className="space-y-3 max-h-44 overflow-y-auto pr-2">
        {items.map((it, idx) => (
          <div key={idx} className="text-sm text-neutral-300">
            {it}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Header />

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <div className="rounded-sm bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 p-6 shadow-2xl border border-neutral-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Network Activity</h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    Throughput, latency and packet rates — updated in real time
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-neutral-400">Live</div>
                  <StatusDot color="neutral-400" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-6"
              >
                <ChartCard />
              </motion.div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Bandwidth"
                  value={<>1.2 Gbps</>}
                  hint="Peak 2.3 Gbps"
                />

                <StatCard
                  title="Active Connections"
                  value={384}
                  hint="+8% in last hour"
                />

                <StatCard
                  title="Avg Latency"
                  value={<>24 ms</>}
                  hint="Stable"
                />
              </div>
            </div>

            <ActivityFeed />
          </section>

          <aside className="lg:col-span-1">
            <DeviceList />
          </aside>
        </main>
      </div>
    </div>
  );
}

function Header() {
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
          <RefreshCw className="w-4 h-4 transition-transform duration-400 group-hover:rotate-180" />
          <span className="text-sm font-medium">Refresh</span>
        </IconButton>

        <PrimaryButton>
          <Cpu className="w-4 h-4 inline group-hover:scale-[1.02] transition-all duration-200" />
          Throtl
        </PrimaryButton>
      </div>
    </header>
  );
}

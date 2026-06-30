// Filename: src/components/dashboard/NetworkHealthChart.tsx
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Line } from 'recharts';

const formatBps = (bps: number) => {
  if (bps > 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps > 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps > 1_000) return `${(bps / 1_000).toFixed(2)} Kbps`;
  return `${bps} bps`;
};

type Props = {
  data: { name: string; download: number }[];
  threshold: number;
  selectedClientData?: { name: string; value: number }[];
  selectedClientIp: string | null;
};

export function NetworkHealthChart({ data, threshold, selectedClientData, selectedClientIp }: Props) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-4 h-96">
      <h3 className="text-lg font-semibold text-neutral-200 mb-4">Network Health (Last 30s)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tickFormatter={formatBps} tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040' }}
            formatter={(value: number) => [formatBps(value), "Download"]}
          />
          <Area type="monotone" dataKey="download" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorDownload)" />
          
          {/* CRITICAL: The red threshold line */}
          <ReferenceLine y={threshold} label={{ value: "Threshold", position: "insideTopRight", fill: "#ef4444" }} stroke="#ef4444" strokeDasharray="3 3" />

          {/* Render a line for the selected client for cross-filtering */}
          {selectedClientData && (
            <Line type="monotone" dataKey="value" data={selectedClientData} stroke="#f97316" strokeWidth={2} name={`Client: ${selectedClientIp}`} dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
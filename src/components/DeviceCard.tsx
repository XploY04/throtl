type DeviceCardProps = {
  name: string;
  ip: string;
  mac: string;
  bandwidth: string;
  isHog: boolean;
};

export function DeviceCard({ name, ip, mac, bandwidth, isHog }: DeviceCardProps) {
  return (
    <div
      className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800 p-3 rounded-sm hover:bg-neutral-900/60 transition"
    >
      <div>
        <div className="font-medium text-neutral-100">{name}</div>
        <div className="text-xs text-neutral-400">{ip}</div>
        <div className="text-xs text-neutral-500">{mac}</div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold">{bandwidth}</div>
        {isHog && (
          <span className="text-xs text-rose-400 font-medium">Bandwidth Hog</span>
        )}
      </div>
    </div>
  );
}

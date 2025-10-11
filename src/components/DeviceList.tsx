import { DeviceCard } from "./DeviceCard";

export function DeviceList() {
  const devices = [
    {
      name: "Phone-01",
      ip: "192.168.1.10",
      mac: "00:1B:44:11:3A:B7",
      bandwidth: "230 Mbps",
      isHog: true,
    },
    {
      name: "Laptop-01",
      ip: "192.168.1.12",
      mac: "A4:B3:C2:D1:E0:F9",
      bandwidth: "90 Mbps",
      isHog: false,
    },
  ];

  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <DeviceCard
          key={device.mac}
          name={device.name}
          ip={device.ip}
          mac={device.mac}
          bandwidth={device.bandwidth}
          isHog={device.isHog}
        />
      ))}
    </div>
  );
}

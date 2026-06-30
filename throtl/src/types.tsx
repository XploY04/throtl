// Backend API Response Types
export type NetworkDevice = {
  ip: string;
  mac?: string;
  hostname?: string;
  down_mbps: number;
  up_mbps: number;
  status: "normal" | "throttled";
};

export type NetworkStats = {
  timestamp: number;
  global: {
    total_down_mbps: number;
    total_up_mbps: number;
  };
  devices: NetworkDevice[];
  events: string[];
};

export type HealthResponse = {
  status: "healthy" | "unhealthy";
  services: {
    database: "connected" | "disconnected";
    redis: "connected" | "disconnected";
    ai_generation: "configured" | "not_configured";
  };
};

export type ThrottleRequest = {
  ip: string;
  action: "throttle" | "unthrottle";
  limit_mbps?: number;
  reason?: string;
};

export type ThrottleResponse = {
  success: boolean;
  message: string;
  device?: NetworkDevice;
};

// Frontend Types (transformed from backend data)
export type Client = {
  ip: string;
  mac?: string;
  hostname?: string;
  status: "normal" | "throttled";
  liveDownload: number; // in bps
  liveUpload: number; // in bps
  downloadHistory: { name: string; value: number }[];
};

export type Event = {
  timestamp: Date;
  message: string;
  type: "throttle" | "unthrottle" | "info";
};

export type GlobalStats = {
  totalDownload: number; // in bps
  totalUpload: number; // in bps;
  timestamp: Date;
};
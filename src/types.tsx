export type ApiClient = {
  bytes_window: number[];
  status: "normal" | "throttled";
};

export type Client = {
  ip: string;
  status: "normal" | "throttled";
  liveDownload: number; 
  downloadHistory: { name: string; value: number }[];
};

export type Event = {
  timestamp: Date;
  message: string;
  type: "throttle" | "unthrottle";
};
// API service for NetGuardian backend communication

import type { NetworkStats, HealthResponse, ThrottleRequest, ThrottleResponse} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8002';

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// API Service
export class NetGuardianAPI {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new ApiError(response.status, `API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Health check (using devices endpoint since health endpoint doesn't exist)
  static async getHealth(): Promise<HealthResponse> {
    try {
      await this.request<any>('/api/devices/');
      return {
        status: 'healthy',
        services: {
          database: 'connected',
          redis: 'connected',
          ai_generation: 'configured'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          database: 'disconnected',
          redis: 'disconnected',
          ai_generation: 'not_configured'
        }
      };
    }
  }

  // Get current network devices and stats (returns NetworkStats format)
  static async getDevices(): Promise<NetworkStats> {
    return this.request<NetworkStats>('/api/devices/');
  }

  // Throttle or unthrottle a device
  static async throttleDevice(request: ThrottleRequest): Promise<ThrottleResponse> {
    return this.request<ThrottleResponse>('/api/throttle/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Generate AI profile (for future use)
  static async generateProfile(answers: Record<string, string>, profileName: string) {
    return this.request('/api/generate-profile/', {
      method: 'POST',
      body: JSON.stringify({ answers, profile_name: profileName }),
    });
  }

  // WebSocket URL for real-time stats
  static getWebSocketUrl(): string {
    return `${WS_BASE_URL}/ws/stats/`;
  }
}

// WebSocket message handler
export function parseWebSocketMessage(data: any): NetworkStats | null {
  try {
    // The backend sends network stats through WebSocket
    if (data && typeof data === 'object') {
      return data as NetworkStats;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
    return null;
  }
}

// Utility functions
export function convertMbpsToBytes(mbps: number): number {
  return mbps * 1_000_000 / 8; // Convert Mbps to bytes per second
}

export function convertBytesToMbps(bytes: number): number {
  return (bytes * 8) / 1_000_000; // Convert bytes per second to Mbps
}

export function formatBandwidth(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps.toFixed(0)} bps`;
}
import { useState, useEffect, useRef, useCallback } from "react";
import useWebSocket from "react-use-websocket";
import type { Client, Event, NetworkStats, ThrottleRequest, GlobalStats } from "../types";
import { NetGuardianAPI, parseWebSocketMessage } from "../services/api";

export const THRESHOLD_MBPS = 10; // 10 Mbps threshold
export const THRESHOLD_BPS = THRESHOLD_MBPS * 1_000_000; // Convert to bits per second

export function useNetworkData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [chartData, setChartData] = useState<{ name: string; download: number }[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedClientIp, setSelectedClientIp] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalDownload: 0,
    totalUpload: 0,
    timestamp: new Date()
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keep track of historical data for charts
  const chartHistoryRef = useRef<{ name: string; download: number }[]>([]);
  const deviceHistoryRef = useRef<Record<string, { name: string; value: number }[]>>({});
  
  // WebSocket connection
  const { lastJsonMessage } = useWebSocket(
    NetGuardianAPI.getWebSocketUrl(),
    {
      onOpen: () => {
        console.log('WebSocket connected to NetGuardian backend');
        setIsConnected(true);
        setError(null);
      },
      onClose: () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      },
      onError: (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection failed');
        setIsConnected(false);
      },
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  // Process WebSocket messages
  useEffect(() => {
    if (lastJsonMessage) {
      const networkStats = parseWebSocketMessage(lastJsonMessage);
      if (networkStats) {
        processNetworkStats(networkStats);
      }
    }
  }, [lastJsonMessage]);

  // Function to process network stats from backend
  const processNetworkStats = useCallback((stats: NetworkStats) => {
    const timestamp = new Date(stats.timestamp * 1000);
    
    // Update global stats
    setGlobalStats({
      totalDownload: stats.global.total_down_mbps * 1_000_000, // Convert to bps
      totalUpload: stats.global.total_up_mbps * 1_000_000,
      timestamp
    });

    // Process devices
    const processedClients: Client[] = stats.devices.map(device => {
      const ip = device.ip;
      
      // Get or initialize device history
      if (!deviceHistoryRef.current[ip]) {
        deviceHistoryRef.current[ip] = [];
      }
      
      // Add current data point to device history
      const currentValue = device.down_mbps * 1_000_000; // Convert to bps
      deviceHistoryRef.current[ip].push({
        name: timestamp.toLocaleTimeString(),
        value: currentValue
      });
      
      // Keep only last 30 data points
      if (deviceHistoryRef.current[ip].length > 30) {
        deviceHistoryRef.current[ip] = deviceHistoryRef.current[ip].slice(-30);
      }

      return {
        ip: device.ip,
        mac: device.mac,
        hostname: device.hostname || device.ip,
        status: device.status,
        liveDownload: device.down_mbps * 1_000_000, // Convert Mbps to bps
        liveUpload: device.up_mbps * 1_000_000,
        downloadHistory: [...deviceHistoryRef.current[ip]]
      };
    });

    setClients(processedClients);

    // Update chart data for global bandwidth
    const totalDownloadBps = stats.global.total_down_mbps * 1_000_000;
    chartHistoryRef.current.push({
      name: timestamp.toLocaleTimeString(),
      download: totalDownloadBps
    });

    // Keep only last 30 data points for chart
    if (chartHistoryRef.current.length > 30) {
      chartHistoryRef.current = chartHistoryRef.current.slice(-30);
    }

    setChartData([...chartHistoryRef.current]);

    // Process events from backend
    if (stats.events && stats.events.length > 0) {
      const newEvents: Event[] = stats.events.map(eventMsg => {
        const isThrottle = eventMsg.toLowerCase().includes('throttled');
        const isUnthrottle = eventMsg.toLowerCase().includes('unthrottled');
        
        return {
          timestamp,
          message: eventMsg,
          type: isThrottle ? 'throttle' : isUnthrottle ? 'unthrottle' : 'info'
        };
      });

      setEvents(prev => [...newEvents, ...prev].slice(0, 50));
    }
  }, []);

  // Throttle/Unthrottle functions
  const throttleDevice = useCallback(async (ip: string, limitMbps?: number, reason?: string) => {
    try {
      const request: ThrottleRequest = {
        ip,
        action: 'throttle',
        limit_mbps: limitMbps || 2.0, // Default to 2 Mbps
        reason: reason || 'Manual throttle'
      };

      const response = await NetGuardianAPI.throttleDevice(request);
      
      if (response.success) {
        // Add immediate feedback event
        setEvents(prev => [{
          timestamp: new Date(),
          message: `Throttled ${ip} to ${limitMbps || 2}Mbps`,
          type: 'throttle' as const
        }, ...prev].slice(0, 50));
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to throttle device';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const unthrottleDevice = useCallback(async (ip: string) => {
    try {
      const request: ThrottleRequest = {
        ip,
        action: 'unthrottle'
      };

      const response = await NetGuardianAPI.throttleDevice(request);
      
      if (response.success) {
        // Add immediate feedback event
        setEvents(prev => [{
          timestamp: new Date(),
          message: `Unthrottled ${ip}`,
          type: 'unthrottle' as const
        }, ...prev].slice(0, 50));
        
        return { success: true, message: response.message };
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unthrottle device';
      setError(message);
      return { success: false, message };
    }
  }, []);

  // Initial data fetch and health check
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get initial data from REST API
        const networkStats = await NetGuardianAPI.getDevices();
        processNetworkStats(networkStats);
        
        // Test health
        await NetGuardianAPI.getHealth();
        setError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to connect to backend';
        setError(message);
        console.error('Backend connection error:', error);
      }
    };
    
    initializeData();
  }, []);

  return { 
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
  };
}
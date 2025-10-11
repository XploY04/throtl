import { useState, useEffect, useRef } from "react";
import useWebSocket from "react-use-websocket";
import type { ApiClient, Client, Event } from "../types";

const WEBSOCKET_URL = "ws://127.0.0.1:8000/ws";
export const THRESHOLD_BPS = 1_600_000 * 8; // 1.6 MBps in bits per second

export function useNetworkData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [chartData, setChartData] = useState<{ name: string; download: number }[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedClientIp, setSelectedClientIp] = useState<string | null>(null);
  
  const prevClientsRef = useRef<Record<string, ApiClient>>({});
  const { lastJsonMessage } = useWebSocket<{ clients: Record<string, ApiClient> }>(WEBSOCKET_URL);

  useEffect(() => {
     if (lastJsonMessage && 'clients' in lastJsonMessage) {
      // FIX: Corrected typo from ApiCENT to ApiClient
      const apiClients = (lastJsonMessage as { clients: Record<string, ApiClient> }).clients;

      const processedClients: Client[] = Object.entries(apiClients).map(([ip, data]) => ({
        ip,
        status: data.status,
        liveDownload: (data.bytes_window[data.bytes_window.length - 1] ?? 0) * 8,
        // FIX: Added explicit types to map parameters to remove 'any' error
        downloadHistory: data.bytes_window.map((bytes: number, i: number) => ({
          name: `t-${data.bytes_window.length - i}`,
          value: bytes * 8,
        })),
      }));

      // FIX: Added explicit type to map parameter 'i'
      const totalHistory = new Array(30).fill(0).map((_, i: number) => {
        let totalBytes = 0;
        Object.values(apiClients).forEach(client => {
          totalBytes += client.bytes_window[client.bytes_window.length - 1 - i] ?? 0;
        });
        return { name: `t-${i}`, download: totalBytes * 8 };
      }).reverse();

      setChartData(totalHistory);
      setClients(processedClients);

      const newEvents: Event[] = [];
      Object.entries(apiClients).forEach(([ip, current]) => {
        const previous = prevClientsRef.current[ip];
        if (previous && previous.status !== current.status) {
          newEvents.push({
            timestamp: new Date(),
            message: `${current.status === "throttled" ? "Throttled" : "Unthrottled"} ${ip}`,
            type: current.status === "throttled" ? "throttle" : "unthrottle",
          });
        }
      });
      if (newEvents.length > 0) {
        setEvents(prev => [...newEvents, ...prev].slice(0, 50));
      }
      prevClientsRef.current = apiClients;
    }
  }, [lastJsonMessage]);

  return { clients, chartData, events, selectedClientIp, setSelectedClientIp };
}
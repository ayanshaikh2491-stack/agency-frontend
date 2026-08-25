import { useEffect, useRef, useState } from "react";

// Live "Michael's Office" floor socket.
// Streams CEO controller state (ceo / workers / mandates / floor) every ~3s.
export function useOfficeSocket() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    // The backend (FastAPI + websockets) lives on a separate host from the
    // Vercel frontend. Use NEXT_PUBLIC_API_URL (e.g. https://backend.example.com)
    // so the office websocket reaches the real backend, not Vercel's origin.
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "http://18.213.66.136:9002";
    const proto = base.startsWith("https") ? "wss" : "ws";
    const host = base.replace(/^https?:\/\//, "");
    const url = `${proto}://${host}/api/ceo/ws/office`;
    const socket = new WebSocket(url);
    ws.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (e) => {
      try {
        setState(JSON.parse(e.data));
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => socket.close();
  }, []);

  return { state, connected };
}

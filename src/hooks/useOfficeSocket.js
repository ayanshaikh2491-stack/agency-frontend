import { useEffect, useRef, useState } from "react";

// Live "Michael's Office" floor socket.
// Streams CEO controller state (ceo / workers / mandates / floor) every ~3s.
export function useOfficeSocket() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${window.location.host}/api/ceo/ws/office`;
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

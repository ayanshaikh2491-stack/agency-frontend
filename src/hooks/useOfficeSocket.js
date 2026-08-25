import { useEffect, useRef, useState } from "react";

// Live office floor state via SAME-ORIGIN polling of the Next.js API proxy
// (/api/ceo/floor -> EC2 backend). A direct WebSocket cannot work: the old
// ws:// endpoint no longer exists server-side, and from an https site a
// ws:// raw-IP socket is blocked as mixed content anyway. Polling every 3s
// matches the old socket cadence and works everywhere (local + Vercel).
const POLL_MS = 3000;

export function useOfficeSocket() {
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/ceo/floor", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (!alive) return;
        setState(j);
        setConnected(true);
      } catch {
        if (alive) setConnected(false);
      }
    }
    tick();
    timer.current = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer.current);
    };
  }, []);

  return { state, connected };
}

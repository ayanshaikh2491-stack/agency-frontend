"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CeoChat from "./CeoChat";
import SbaLivePanel from "./SbaLivePanel";
import { useOfficeSocket } from "../../../hooks/useOfficeSocket";

// OfficeFloor uses PixiJS (canvas) — must only run in the browser.
const OfficeFloor = dynamic(() => import("./OfficeFloor"), { ssr: false });

export default function OfficePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const { state, connected } = useOfficeSocket();
  const floor = state?.floor || state?.workers || [];

  const activeMandates = state?.mandates?.filter((m) => m.status === "running") || [];

  return (
    <div style={{ background: "var(--office-bg)", minHeight: "100vh", color: "var(--office-text)", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>TAGS Agency — Michael&apos;s Office</h1>
          <p style={{ color: "var(--office-muted)", margin: "4px 0 0", fontSize: 13 }}>
            The CEO is the only boss entry point. Click his desk to talk to him.
          </p>
        </div>
        <div style={{ fontSize: 12, color: connected ? "var(--office-sba)" : "var(--office-muted)" }}>
          {connected ? "● live floor" : "○ connecting…"}
        </div>
      </header>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 12, padding: 12 }}>
          <OfficeFloor onSelectCeo={() => setChatOpen(true)} floor={floor} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 260 }}>
          <SbaLivePanel floor={floor} />
          <button
            onClick={() => setChatOpen(true)}
            style={{
              background: "var(--office-accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Talk to the CEO
          </button>

          <div style={{ background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 12, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Active CEO mandates</h3>
            {activeMandates.length === 0 ? (
              <p style={{ color: "var(--office-muted)", fontSize: 13, margin: 0 }}>No active mandates.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {activeMandates.map((m) => (
                  <li key={m.worker}>
                    <strong>{m.worker}</strong>: {m.standing_task || m.status}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {chatOpen && <CeoChat onClose={() => setChatOpen(false)} />}
    </div>
  );
}

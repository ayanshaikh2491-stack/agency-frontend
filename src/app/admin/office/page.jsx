"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CeoChat from "./CeoChat";
import { useOfficeSocket } from "../../../hooks/useOfficeSocket";

// OfficeFloor uses PixiJS (canvas) — must only run in the browser.
const OfficeFloor = dynamic(() => import("./OfficeFloor"), { ssr: false });

export default function OfficePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const { state, connected } = useOfficeSocket();

  return (
    <div style={{ background: "var(--office-bg)", width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <OfficeFloor onSelectCeo={() => setChatOpen(true)} liveState={state} />
      {/* Minimal connection indicator — bottom-right, unobtrusive */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          fontSize: 11,
          color: connected ? "#4ea1ff" : "#666",
          background: "rgba(11,13,17,0.85)",
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid var(--office-border)",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        {connected ? "● live floor" : "○ connecting…"}
      </div>
      {chatOpen && <CeoChat onClose={() => setChatOpen(false)} />}
    </div>
  );
}
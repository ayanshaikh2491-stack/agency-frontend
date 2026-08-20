"use client";

// Live SBA work panel — driven by the office WebSocket floor state.
export default function SbaLivePanel({ floor }) {
  const sba = (floor || []).find((a) => (a.agent_type || a.agent) === "sba");
  const status = sba?.status || "idle";
  const task = sba?.task || "watching leads";
  const dot = status === "working" ? "#16a34a" : status === "error" ? "#dc2626" : "#8b94a3";

  return (
    <div
      style={{
        background: "var(--office-panel)",
        color: "var(--office-text)",
        border: "1px solid var(--office-border)",
        borderRadius: 12,
        padding: 14,
        minWidth: 240,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot, display: "inline-block" }} />
        <h3 style={{ margin: 0, fontSize: 15 }}>SBA — live</h3>
      </div>
      <p style={{ color: "var(--office-muted)", fontSize: 13, margin: "8px 0 0" }}>status: {status}</p>
      <p style={{ fontSize: 13, margin: "4px 0 0" }}>{task}</p>
      {sba?.last_result && (
        <p style={{ fontSize: 12, color: "var(--office-muted)", margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
          {String(sba.last_result).slice(0, 200)}
        </p>
      )}
    </div>
  );
}

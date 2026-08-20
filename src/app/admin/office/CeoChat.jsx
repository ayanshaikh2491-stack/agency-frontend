"use client";
import { useState } from "react";

export default function CeoChat({ onClose }) {
  const [msg, setMsg] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/ceo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const j = await r.json();
      setReply(j.response || j.detail || "(no response)");
    } catch (e) {
      setReply("Error reaching CEO: " + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: 380,
        height: "100%",
        background: "var(--office-panel)",
        color: "var(--office-text)",
        padding: 16,
        borderLeft: "1px solid var(--office-border)",
        overflowY: "auto",
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Michael — CEO</strong>
        <button onClick={onClose} style={btnStyle}>Close</button>
      </div>
      <p style={{ color: "var(--office-muted)", fontSize: 12, margin: "8px 0" }}>
        Talk to the CEO only. He delegates to workers. Never message agents directly.
      </p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="e.g. Run the SBA lead loop and book 3 meetings this week"
        style={{ width: "100%", height: 90, background: "var(--office-bg)", color: "var(--office-text)", border: "1px solid var(--office-border)", borderRadius: 8 }}
      />
      <button onClick={send} disabled={busy} style={{ ...btnStyle, marginTop: 8, background: "var(--office-accent)" }}>
        {busy ? "Thinking…" : "Send to CEO"}
      </button>
      {reply && (
        <div style={{ marginTop: 16, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>{reply}</div>
      )}
    </div>
  );
}

const btnStyle = {
  background: "var(--office-border)",
  color: "var(--office-text)",
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  cursor: "pointer",
};

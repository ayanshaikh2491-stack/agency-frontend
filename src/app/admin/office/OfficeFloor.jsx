"use client";
import { useEffect, useRef } from "react";
import { Application, Graphics, Text } from "pixi.js";

const DESKS = [
  { id: "ceo", label: "CEO (Michael)", x: 400, y: 300, color: 0xf4d35e, ring: 0xffffff },
  { id: "sba", label: "SBA", x: 150, y: 150, color: 0x4ea1ff },
  { id: "seo", label: "SEO", x: 650, y: 150, color: 0x6e1423 },
  { id: "website", label: "Website", x: 150, y: 450, color: 0x6e1423 },
  { id: "ads", label: "Ads", x: 650, y: 450, color: 0x6e1423 },
  { id: "content", label: "Content", x: 250, y: 300, color: 0x232a33 },
  { id: "social", label: "Social", x: 550, y: 300, color: 0x232a33 },
  { id: "analytics", label: "Analytics", x: 400, y: 120, color: 0x232a33 },
];

export default function OfficeFloor({ onSelectCeo, floor }) {
  const ref = useRef(null);

  useEffect(() => {
    let app;
    let destroyed = false;

    (async () => {
      app = new Application();
      await app.init({ width: 800, height: 600, background: "#0f1115", antialias: true });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      ref.current.appendChild(app.canvas);

      const statusByName = {};
      for (const a of floor || []) statusByName[a.agent_type || a.agent] = a;

      for (const d of DESKS) {
        const accent = d.id === "ceo" ? 0xf4d35e : 0x9aa4b2;
        const g = new Graphics()
          .roundRect(d.x - 55, d.y - 38, 110, 76, 10)
          .fill(d.color)
          .stroke({ width: 2, color: accent });
        const t = new Text({
          text: d.label,
          style: { fill: 0xffffff, fontSize: 12, fontWeight: "600" },
        });
        t.x = d.x - 42;
        t.y = d.y - 8;

        // status dot
        const st = statusByName[d.id];
        const dotColor = st?.status === "working" ? 0x16a34a : st?.status === "error" ? 0xdc2626 : 0x8b94a3;
        const dot = new Graphics().circle(d.x + 40, d.y - 28, 5).fill(dotColor);
        g.addChild(dot);

        if (d.id === "ceo") {
          g.eventMode = "static";
          g.cursor = "pointer";
          g.on("pointerdown", onSelectCeo);
        }
        app.stage.addChild(g, t);
      }
    })();

    return () => {
      destroyed = true;
      if (app) app.destroy(true);
    };
  }, [onSelectCeo, floor]);

  return <div ref={ref} style={{ width: 800, maxWidth: "100%" }} />;
}

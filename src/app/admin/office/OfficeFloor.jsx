"use client";
import { useEffect, useRef } from "react";
import { Application, Graphics, Text, Container } from "pixi.js";
import { ROOMS, WORLD, STATIONS, COLORS, deskRectFor } from "./rooms";
import { OFFICE_CAST } from "./cast";
import { Character } from "./character";

// Munder-style living office floor.
// Renders multiple rooms (open office, CEO office, meeting room, cafeteria)
// and animates the cast as walking characters whose state is driven by the
// live CEO controller state (status / task / mandates) streamed over WebSocket.
export default function OfficeFloor({ onSelectCeo, liveState }) {
  const ref = useRef(null);
  const liveRef = useRef(null);

  // Keep the latest live state available to the Pixi ticker without
  // re-running the init effect.
  useEffect(() => {
    liveRef.current = liveState;
  }, [liveState]);

  useEffect(() => {
    let app;
    let destroyed = false;

    (async () => {
      app = new Application();
      await app.init({
        width: WORLD.w,
        height: WORLD.h,
        background: "#0b0d11",
        antialias: true,
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      ref.current.appendChild(app.canvas);
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      // ── Rooms ───────────────────────────────────────────────
      const world = new Container();
      app.stage.addChild(world);

      for (const r of ROOMS) {
        const rg = new Graphics();
        rg.rect(r.x, r.y, r.w, r.h).fill(r.fill);
        rg.rect(r.x, r.y, r.w, r.h).stroke({ width: 2, color: COLORS.wall });
        world.addChild(rg);
        const lbl = new Text({
          text: r.label,
          style: {
            fill: r.labelColor,
            fontSize: 13,
            fontWeight: "700",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        });
        lbl.x = r.x + 12;
        lbl.y = r.y + 10;
        world.addChild(lbl);
      }

      // ── Furniture: desks, meeting table, cafeteria ──────────
      const furniture = new Container();
      world.addChild(furniture);

      for (const m of OFFICE_CAST) {
        const d = deskRectFor(m);
        const g = new Graphics();
        g.roundRect(d.x, d.y, d.w, d.h, 10)
          .fill(COLORS.desk)
          .stroke({ width: 2, color: COLORS.deskStroke });
        furniture.addChild(g);
        const t = new Text({
          text: m.displayName,
          style: {
            fill: 0xcfd8e3,
            fontSize: 11,
            fontWeight: "700",
            fontFamily: "Inter, system-ui, sans-serif",
          },
        });
        t.x = d.x + 8;
        t.y = d.y + d.h + 4;
        furniture.addChild(t);
        if (m.isGod) {
          g.eventMode = "static";
          g.cursor = "pointer";
          g.on("pointerdown", () => onSelectCeo && onSelectCeo());
        }
      }

      // meeting table
      const mt = new Graphics();
      mt.roundRect(
        STATIONS.meeting.x - 72,
        STATIONS.meeting.y - 26,
        144,
        52,
        12
      )
        .fill(COLORS.station)
        .stroke({ width: 2, color: COLORS.stationStroke });
      furniture.addChild(mt);

      // cafeteria coffee station
      const cf = new Graphics();
      cf.roundRect(
        STATIONS.cafeteria.x - 16,
        STATIONS.cafeteria.y - 16,
        32,
        32,
        8
      )
        .fill(0x3a2a1a)
        .stroke({ width: 2, color: 0x6b4a2a });
      furniture.addChild(cf);

      // ── Characters ─────────────────────────────────────────
      const chars = OFFICE_CAST.map(
        (m) =>
          new Character({
            id: m.id,
            displayName: m.displayName,
            shirt: m.shirt,
            blurb: m.blurb,
            desk: m.desk,
            isGod: m.isGod,
          })
      );
      const charLayer = new Container();
      world.addChild(charLayer);
      for (const c of chars) charLayer.addChild(c.view);

      // ── Live ticker ────────────────────────────────────────
      const tick = (ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        const ls = liveRef.current || {};
        const floor = ls.floor || ls.workers || [];
        const fmap = {};
        for (const a of floor) fmap[a.agent_type || a.agent] = a;
        const mmap = {};
        for (const m of ls.mandates || [])
          if (m.status === "running") mmap[m.worker] = true;

        for (const c of chars) {
          const f = fmap[c.id];
          c.update(dt, {
            status: f?.status,
            task: f?.task,
            mandate: !!mmap[c.id],
          });
        }
      };
      app.ticker.add(tick);
    })();

    return () => {
      destroyed = true;
      if (app) app.destroy(true);
    };
  }, [onSelectCeo]);

  return (
    <div
      ref={ref}
      style={{
        width: WORLD.w,
        maxWidth: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--office-border)",
      }}
    />
  );
}

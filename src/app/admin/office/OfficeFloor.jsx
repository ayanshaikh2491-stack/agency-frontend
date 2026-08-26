"use client";
import { useEffect, useRef } from "react";
import { Application, Graphics, Text, Container, Sprite } from "pixi.js";
import {
  ROOMS,
  WORLD,
  STATIONS,
  COLORS,
  deskRectFor,
  wallRects,
  isWallCell,
  DECOR,
  COFFEE_BLOCKER,
  RUG,
} from "./rooms";
import { OFFICE_CAST } from "./cast";
import { Character } from "./character";
import { makeGrid } from "./pathfinding";
import { buildTileTextures, T } from "./tiles";

// Munder-style living office floor.
// Pixel-tile office (wood floors, walls with doorways, plants, coffee corner)
// + walking pixel-human characters routed by A* around furniture and walls.
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
        antialias: false,
      });
      if (destroyed) {
        app.destroy(true);
        return;
      }
      ref.current.appendChild(app.canvas);
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      const tex = buildTileTextures(app.renderer);
      const cols = Math.ceil(WORLD.w / T);
      const rows = Math.ceil(WORLD.h / T);

      // ── Floor layer ─────────────────────────────────────────
      const floorC = new Container();
      app.stage.addChild(floorC);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          let tname;
          if (col < 38) tname = "wood";
          else if (row <= 15) tname = "carpet";
          else if (row >= 17 && row <= 23) tname = "meet";
          else tname = "cafe";
          const s = new Sprite(tex[tname]);
          s.x = col * T;
          s.y = row * T;
          floorC.addChild(s);
        }
      }

      // ── Wall layer ──────────────────────────────────────────
      const wallC = new Container();
      app.stage.addChild(wallC);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (!isWallCell(col, row)) continue;
          const s = new Sprite(tex.wallTop);
          s.x = col * T;
          s.y = row * T;
          wallC.addChild(s);
        }
      }

      // ── Decor layer (plants, boards, coffee, mat) ───────────
      const decorC = new Container();
      app.stage.addChild(decorC);
      for (const d of DECOR) {
        const s = new Sprite(tex[d.tile]);
        s.x = d.col * T;
        s.y = d.row * T;
        decorC.addChild(s);
      }

      // Room labels
      for (const r of ROOMS) {
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
        lbl.y = r.y + r.h - 24;
        app.stage.addChild(lbl);
      }

      // ── Furniture layer ─────────────────────────────────────
      const furniture = new Container();
      app.stage.addChild(furniture);

      // meeting rug under the table
      for (let row = RUG.r0; row < RUG.r1; row++) {
        for (let col = RUG.c0; col < RUG.c1; col++) {
          const s = new Sprite(tex.rug);
          s.x = col * T;
          s.y = row * T;
          furniture.addChild(s);
        }
      }

      const deskMonitors = {}; // castId -> monitor Graphics (visible while coding)
      for (const m of OFFICE_CAST) {
        const d = deskRectFor(m);
        const g = new Graphics();
        g.roundRect(d.x, d.y, d.w, d.h, 8)
          .fill(0x4a3a28)
          .stroke({ width: 2, color: 0x63503a });
        g.rect(d.x + 4, d.y + 2, d.w - 8, 5).fill({ color: 0x5c4936 });
        furniture.addChild(g);

        if (!m.isGod) {
          // desktop PC on this desk — shown only while the agent is coding
          const mon = new Graphics();
          mon.roundRect(d.x + 26, d.y - 22, 40, 26, 3).fill(0x10141a)
            .stroke({ width: 2, color: 0x4ea1ff });
          mon.rect(d.x + 43, d.y + 4, 6, 5).fill(0x39424e);
          mon.rect(d.x + 36, d.y + 9, 20, 3, 1.5).fill(0x39424e);
          mon.visible = false;
          furniture.addChild(mon);
          deskMonitors[m.id] = mon;
        }

        // office chair at each workstation
        const ch = new Graphics();
        ch.circle(m.desk.x, m.desk.y + 40, 9).fill(0x27313d)
          .stroke({ width: 2, color: 0x3a4756 });
        furniture.addChild(ch);

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
        t.y = d.y + d.h + 2;
        furniture.addChild(t);
        if (m.isGod) {
          g.eventMode = "static";
          g.cursor = "pointer";
          g.on("pointerdown", () => onSelectCeo && onSelectCeo());
        }
      }

      // meeting table on the rug
      const mt = new Graphics();
      mt.roundRect(
        STATIONS.meeting.x - 72,
        STATIONS.meeting.y - 26,
        144,
        52,
        10
      )
        .fill(0x50412e)
        .stroke({ width: 2, color: 0x6a5740 });
      furniture.addChild(mt);

      // ── Characters ─────────────────────────────────────────
      // collision grid: walls + furniture so agents route through doorways
      const blockers = [
        ...wallRects(),
        ...OFFICE_CAST.map((m) => deskRectFor(m)),
        { x: STATIONS.meeting.x - 72, y: STATIONS.meeting.y - 26, w: 144, h: 52 },
        COFFEE_BLOCKER,
      ];
      const grid = makeGrid(blockers);
      const chars = OFFICE_CAST.map(
        (m) =>
          new Character({
            id: m.id,
            displayName: m.displayName,
            shirt: m.shirt,
            blurb: m.blurb,
            desk: m.desk,
            isGod: m.isGod,
            grid,
          })
      );
      const charLayer = new Container();
      app.stage.addChild(charLayer);
      for (const c of chars) charLayer.addChild(c.view);

      // ── Live ticker ────────────────────────────────────────
      const CODE_RE = /build|code|site|web|landing|deploy|page/i;
      const tick = (ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        const ls = liveRef.current || {};
        const floor = ls.floor || [];
        const fmap = {};
        for (const a of floor) fmap[a.agent_type || a.agent] = a;

        for (const c of chars) {
          const f = fmap[c.id];
          const active = f?.status === "working" || f?.status === "thinking";
          // coders work at their desktop PC; everyone else on a laptop
          const coding = !!active && (c.id === "website" || CODE_RE.test(f?.task || ""));
          c.showDesktop = coding;
          if (deskMonitors[c.id]) deskMonitors[c.id].visible = coding && c.state !== "walking";
          c.update(dt, { status: f?.status, task: f?.task });
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

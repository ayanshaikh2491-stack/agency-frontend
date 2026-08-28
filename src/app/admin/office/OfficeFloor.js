"use client";
import { useEffect, useRef } from "react";
import { Application, Container, Sprite, Texture, Rectangle, Graphics, Text } from "pixi.js";
import { Character, loadTexture } from "./character";
import { makeGrid } from "./pathfinding";
import { OFFICE_CAST } from "./cast";
import { ROOMS, WALLS } from "./rooms";

const TILE = 32;
const WALL_T = 16; // wall thickness (thick + clearly visible)

export default function OfficeFloor({ onSelectCeo, liveState }) {
  const ref = useRef(null);
  const liveRef = useRef(liveState);
  liveRef.current = liveState;

  useEffect(() => {
    let app, destroyed, building, chars;

    building = (async () => {
      const map = await (await fetch("/office/sprites/skyoffice/map.json")).json();
      const W = map.width * TILE;
      const H = map.height * TILE;

      app = new Application();
      await app.init({
        width: W,
        height: H,
        background: "#0b0d11",
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: "webgl",
      });
      if (destroyed) { app.destroy(true); return; }
      ref.current.appendChild(app.canvas);
      if (destroyed) { app.destroy(true); return; }
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      // ── Tilesets + collision ───────────────────────────────────
      const collidesByGid = new Map();
      const tilesetCache = [];
      for (const ts of map.tilesets) {
        const tex = await loadTexture("/office/sprites/skyoffice/" + ts.image);
        tex.source.scaleMode = "nearest";
        const cache = { firstgid: ts.firstgid, count: ts.tilecount, tex, cols: ts.columns };
        tilesetCache.push(cache);
        for (const t of ts.tiles || []) {
          const prop = (t.properties || []).find((p) => p.name === "collides");
          if (prop && prop.value) collidesByGid.set(ts.firstgid + t.id, true);
        }
      }
      const gidTex = new Map();
      const getTileTex = (gid) => {
        if (gid === 0) return null;
        if (gidTex.has(gid)) return gidTex.get(gid);
        const ts = tilesetCache.find((c) => gid >= c.firstgid && gid < c.firstgid + c.count);
        if (!ts) { gidTex.set(gid, null); return null; }
        const local = gid - ts.firstgid;
        const tex = new Texture(
          ts.tex,
          new Rectangle((local % ts.cols) * TILE, Math.floor(local / ts.cols) * TILE, TILE, TILE)
        );
        gidTex.set(gid, tex);
        return tex;
      };

      // ── 1. SOLID distinct room floors (opaque, per-room color) ─
      const floorLayer = new Container();
      floorLayer.label = "floors";
      for (const r of ROOMS) {
        const g = new Graphics();
        g.rect(r.x, r.y, r.w, r.h).fill({ color: r.fill });
        floorLayer.addChild(g);
      }
      app.stage.addChild(floorLayer);

      // ── 2. SkyOffice furniture (Obj layers; skip Ground's uniform floor) ─
      const blockers = [];
      for (const layer of map.layers) {
        if (layer.type !== "tilelayer") continue;
        if (layer.name === "Ground") continue; // we replaced the floor with solid room colors
        const lc = new Container();
        lc.label = layer.name;
        app.stage.addChild(lc);
        const data = layer.data;
        const lw = layer.width;
        for (let i = 0; i < data.length; i++) {
          const gid = data[i];
          if (gid === 0) continue;
          const tex = getTileTex(gid);
          if (!tex) continue;
          const s = new Sprite(tex);
          s.x = (i % lw) * TILE;
          s.y = Math.floor(i / lw) * TILE;
          lc.addChild(s);
          if (collidesByGid.get(gid)) blockers.push({ x: (i % lw) * TILE, y: Math.floor(i / lw) * TILE, w: TILE, h: TILE });
        }
      }

      // ── 3. Walls: inner dividers + outer border (thick + clear) ─
      const wallLayer = new Container();
      wallLayer.label = "walls";
      app.stage.addChild(wallLayer);
      const drawWall = (x, y, w, h) => {
        const g = new Graphics();
        g.rect(x, y, w, h).fill({ color: 0x10131a }).stroke({ width: 2, color: 0x3a4150 });
        wallLayer.addChild(g);
      };
      for (const wseg of WALLS) drawWall(wseg.x, wseg.y, wseg.w, wseg.h);
      drawWall(0, 0, W, WALL_T);
      drawWall(0, H - WALL_T, W, WALL_T);
      drawWall(0, 0, WALL_T, H);
      drawWall(W - WALL_T, 0, WALL_T, H);

      // ── 4. Per-agent desk (so each agent clearly sits at a desk) ─
      const deskLayer = new Container();
      deskLayer.label = "desks";
      app.stage.addChild(deskLayer);
      for (const m of OFFICE_CAST) {
        const g = new Graphics();
        g.rect(m.desk.x - 16, m.desk.y - 2, 32, 18).fill({ color: 0x4a3a28 }).stroke({ width: 1, color: 0x6b5236 });
        g.rect(m.desk.x - 8, m.desk.y - 14, 16, 10).fill({ color: 0x0d1b2a }).stroke({ width: 1, color: 0x2a4a6a });
        deskLayer.addChild(g);
      }

      // ── 5. Room labels ─────────────────────────────────────────
      const labelLayer = new Container();
      labelLayer.label = "labels";
      app.stage.addChild(labelLayer);
      for (const r of ROOMS) {
        const lbl = new Text({
          text: r.sub ? `${r.label} · ${r.sub}` : r.label,
          style: { fill: r.labelColor, fontSize: 18, fontWeight: "800", fontFamily: "Inter, system-ui, sans-serif", stroke: { color: 0x000000, width: 3 } },
        });
        lbl.x = r.x + 14;
        lbl.y = r.y + 10;
        labelLayer.addChild(lbl);
      }

      // ── 6. Agents (grouped into rooms) ─────────────────────────
      const grid = makeGrid(blockers);
      chars = OFFICE_CAST.map((m) =>
        new Character({
          id: m.id,
          displayName: m.displayName,
          shirt: m.shirt,
          blurb: m.blurb,
          desk: m.desk,
          isGod: m.isGod,
          grid,
          spriteIndex: m.spriteRow,
        })
      );
      const charLayer = new Container();
      charLayer.label = "characters";
      app.stage.addChild(charLayer);
      for (const c of chars) charLayer.addChild(c.view);
      const sortChars = () => charLayer.children.sort((a, b) => (a.y || 0) - (b.y || 0));

      const tick = (ticker) => {
        const dt = Math.min(0.05, ticker.deltaMS / 1000);
        const ls = liveRef.current || {};
        const floor = ls.floor || [];
        const fmap = {};
        for (const a of floor) fmap[a.agent_type || a.agent] = a;
        for (const c of chars) {
          const f = fmap[c.id];
          const active = f?.status === "working" || f?.status === "thinking";
          const coding = !!active && (c.id === "website" || /build|code|site|web|landing|deploy|page/i.test(f?.task || ""));
          c.showDesktop = coding;
          c.update(dt, { status: f?.status, task: f?.task });
        }
        sortChars();
      };
      app.ticker.add(tick);
      console.log("Office built v2 — rooms:", ROOMS.length, "walls:", WALLS.length + 4, "agents:", chars.length);
    })();

    building?.catch((e) => console.error("Office build failed:", e));

    return () => {
      destroyed = true;
      const teardown = () => { try { app?.destroy(true); } catch { /* gone */ } };
      if (building) building.then(teardown, teardown);
      else teardown();
    };
  }, [onSelectCeo]);

  return (
    <div
      ref={ref}
      style={{
        width: 1280,
        maxWidth: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--office-border)",
        background: "#0b0d11",
      }}
    />
  );
}

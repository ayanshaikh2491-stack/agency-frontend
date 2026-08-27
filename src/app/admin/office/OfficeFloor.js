"use client";
import { useEffect, useRef } from "react";
import { Application, Container, Sprite, Texture, Rectangle, Graphics, Text } from "pixi.js";
import { Character, loadTexture } from "./character";
import { makeGrid } from "./pathfinding";
import { OFFICE_CAST } from "./cast";

const TILE = 32; // SkyOffice office uses 32px tiles

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

      // ── Load tilesets + collision maps ──────────────────────────
      const collidesByGid = new Map();
      const tilesetCache = []; // { firstgid, count, tex, cols }
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

      // gid -> Texture (cached)
      const gidTex = new Map();
      const getTileTex = (gid) => {
        if (gid === 0) return null;
        if (gidTex.has(gid)) return gidTex.get(gid);
        const ts = tilesetCache.find((c) => gid >= c.firstgid && gid < c.firstgid + c.count);
        if (!ts) { gidTex.set(gid, null); return null; }
        const local = gid - ts.firstgid;
        const col = local % ts.cols;
        const row = Math.floor(local / ts.cols);
        const tex = new Texture(ts.tex, new Rectangle(col * TILE, row * TILE, TILE, TILE));
        gidTex.set(gid, tex);
        return tex;
      };

      // ── Render layers ───────────────────────────────────────────
      const blockers = [];
      for (const layer of map.layers) {
        if (layer.type !== "tilelayer") continue;
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
          const col = i % lw;
          const row = Math.floor(i / lw);
          const s = new Sprite(tex);
          s.x = col * TILE;
          s.y = row * TILE;
          lc.addChild(s);
          if (collidesByGid.get(gid)) blockers.push({ x: col * TILE, y: row * TILE, w: TILE, h: TILE });
        }
      }

      // ── Characters (agents already wired to backend) ────────────
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

      // ── Live ticker ─────────────────────────────────────────────
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
      console.log("Office built — tilesets:", map.tilesets.length, "blockers:", blockers.length, "agents:", chars.length);
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

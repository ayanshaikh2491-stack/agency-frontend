"use client";
import { useEffect, useRef, useState } from "react";
import { Application, Graphics, Text, Container, Sprite, Texture, Rectangle } from "pixi.js";
import { Character } from "./character";
import { makeGrid } from "./pathfinding";
import { OFFICE_CAST } from "./cast";
import { STATIONS } from "./rooms";

// Tilemap configuration
const TILE_SIZE = 16; // AI Town uses 16px tiles
const MAP_WIDTH = 40;
const MAP_HEIGHT = 40;
const WORLD_W = MAP_WIDTH * TILE_SIZE;
const WORLD_H = MAP_HEIGHT * TILE_SIZE;

// Layer rendering order (bottom to top)
const LAYER_ORDER = ["terrain", "objects", "objects2", "details", "collision"];

export default function OfficeFloor({ onSelectCeo, liveState }) {
  const ref = useRef(null);
  const liveRef = useRef(liveState);

  liveRef.current = liveState;

  useEffect(() => {
    let app;
    let destroyed = false;
    let building = null;
    let tilemapData = null;
    let tilesetTexture = null;
    let chars = [];

    building = (async () => {
      app = new Application();
      await app.init({
        width: WORLD_W,
        height: WORLD_H,
        background: "#1a1a2e",
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

      console.log("OfficeFloor: App initialized, canvas:", app.canvas.width, "x", app.canvas.height);

      // Load assets
      try {
        // Load tilemap
        console.log("Loading tilemap...");
        const tilemapRes = await fetch("/office/sprites/tilemap.json");
        if (!tilemapRes.ok) throw new Error("Failed to fetch tilemap");
        tilemapData = await tilemapRes.json();
        console.log("Tilemap loaded, layers:", tilemapData.layers?.length);

        // Load tileset
        console.log("Loading tileset...");
        const { Assets, Texture, Rectangle, BaseTexture, Spritesheet } = await import("pixi.js");
        const tilesetBaseTexture = await Assets.load("/office/sprites/rpg-tileset.png");
        const tilesetTexture = tilesetBaseTexture;
        tilesetTexture.baseTexture.scaleMode = "nearest";
        console.log("Tileset loaded:", tilesetTexture.width, "x", tilesetTexture.height);

        // Build the world
        await buildWorld(app, tilemapData, tilesetTexture);
        console.log("World built successfully");

      } catch (e) {
        console.error("Asset load failed:", e);
        // Fallback to procedural
        await buildFallbackWorld(app);
      }

      // Characters
      const blockers = buildBlockersFromTilemap(tilemapData);
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
            spriteIndex: m.spriteRow,
          })
      );

      const charLayer = new Container();
      charLayer.name = "characters";
      app.stage.addChild(charLayer);
      for (const c of chars) charLayer.addChild(c.view);

      // Depth sorting - sort characters by Y position each frame
      const sortCharacters = () => {
        charLayer.children.sort((a, b) => (a.y || 0) - (b.y || 0));
      };

      // Live ticker
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
          const coding = !!active && (c.id === "website" || /build|code|site|web|landing|deploy|page/i.test(f?.task || ""));
          c.showDesktop = coding;
          c.update(dt, { status: f?.status, task: f?.task });
        }
        sortCharacters();
      };
      app.ticker.add(tick);

    })();

    building?.catch((e) => console.error("Building failed:", e));

    return () => {
      destroyed = true;
      const teardown = () => {
        try { app?.destroy(true); } catch { /* already gone */ }
      };
      if (building) building.then(teardown, teardown);
      else teardown();
    };
  }, [onSelectCeo]);

  return (
    <div
      ref={ref}
      style={{
        width: WORLD_W,
        maxWidth: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--office-border)",
        background: "#1a1a2e",
      }}
    />
  );
}

async function buildWorld(app, tilemapData, tilesetTexture) {
  const { Container, Sprite, Graphics, Text, Texture, Rectangle } = await import("pixi.js");
  const TILE = 16;

  // Create layer containers in order
  const layers = {};
  for (const layerName of LAYER_ORDER) {
    layers[layerName] = new Container();
    layers[layerName].name = layerName;
    app.stage.addChild(layers[layerName]);
  }

  // Parse tileset into individual textures
  const frameWidth = 16;
  const frameHeight = 16;
  const sheetCols = Math.floor(tilesetTexture.width / frameWidth);
  const sheetRows = Math.floor(tilesetTexture.height / frameHeight);
  const textures = {};

  console.log("Tileset:", tilesetTexture.width, "x", tilesetTexture.height, "cols:", sheetCols, "rows:", sheetRows);

  for (let row = 0; row < sheetRows; row++) {
    for (let col = 0; col < sheetCols; col++) {
      const gid = row * sheetCols + col + 1;
      const frame = new Rectangle(col * frameWidth, row * frameHeight, frameWidth, frameHeight);
      textures[gid] = new Texture(tilesetTexture, frame);
    }
  }
  console.log("Generated", Object.keys(textures).length, "textures");

  // Render each layer from tilemap
  let spriteCount = 0;
  for (const layer of tilemapData.layers) {
    if (!layer.visible || layer.type !== "tilelayer") continue;
    const targetLayer = layers[layer.name] || layers.details;
    const data = layer.data;
    const width = layer.width;

    let layerSpriteCount = 0;
    for (let i = 0; i < data.length; i++) {
      const gid = data[i];
      if (gid === 0 || !textures[gid]) continue;
      const col = i % width;
      const row = Math.floor(i / width);
      const sprite = new Sprite(textures[gid]);
      sprite.x = col * 16;
      sprite.y = row * 16;
      targetLayer.addChild(sprite);
      layerSpriteCount++;
      spriteCount++;
    }
    console.log("Layer", layer.name, ":", layerSpriteCount, "sprites");
  }
  console.log("Total sprites rendered:", spriteCount);

  // Add room labels
  const roomLabels = [
    { name: "Open Office", x: 50, y: 600, color: 0x88ccff },
    { name: "Michael's Office", x: 650, y: 200, color: 0xffd700 },
    { name: "Meeting Room", x: 650, y: 400, color: 0x88ccff },
    { name: "Cafeteria", x: 650, y: 580, color: 0xffaa00 },
  ];
  for (const r of roomLabels) {
    const lbl = new Text({
      text: r.name,
      style: { fill: r.color, fontSize: 12, fontWeight: "700", fontFamily: "monospace", stroke: { color: 0x000000, width: 2 } },
    });
    lbl.x = r.x;
    lbl.y = r.y;
    app.stage.addChild(lbl);
  }

  // Add subtle lighting overlay
  const lighting = new Graphics();
  lighting.rect(0, 0, WORLD_W, WORLD_H).fill({ color: 0x000000, alpha: 0.15 });
  app.stage.addChild(lighting);
}

function buildFallbackWorld(app) {
  const floor = new Container();
  app.stage.addChild(floor);
  const TILE = 20;
  for (let row = 0; row < 34; row++) {
    for (let col = 0; col < 55; col++) {
      const g = new Graphics();
      g.rect(col * TILE, row * TILE, TILE, TILE).fill(col < 38 ? 0x8a6642 : 0x23262e);
      floor.addChild(g);
    }
  }
}

function buildBlockersFromTilemap(tilemapData) {
  const blockers = [];
  const TILE = 16;
  
  if (!tilemapData) return [
    { x: 0, y: 0, w: WORLD_W, h: TILE },
    { x: 0, y: WORLD_H - TILE, w: WORLD_W, h: TILE },
    { x: 0, y: 0, w: TILE, h: WORLD_H },
    { x: WORLD_W - TILE, y: 0, w: TILE, h: WORLD_H },
  ];

  for (const layer of tilemapData.layers) {
    if (layer.name === "collision" || layer.properties?.some?.(p => p.name === "collides" && p.value)) {
      const data = layer.data;
      const width = layer.width;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > 0) {
          const col = i % width;
          const row = Math.floor(i / width);
          blockers.push({ x: col * TILE, y: row * TILE, w: TILE, h: TILE });
        }
      }
    }
  }
  return mergeBlockers(blockers);
}

function mergeBlockers(blockers) {
  if (!blockers.length) return blockers;
  return blockers;
}
// src/app/admin/office/character.js
// Munder-style character using AI Town's 32x32folk.png spritesheet
// PixiJS v8 — AnimatedSprite with proper spritesheet parsing
// v2024-08-27: force rebuild for Vercel cache bust

import { Container, AnimatedSprite, Graphics, Text, Spritesheet, Texture } from "pixi.js";
import { STATIONS } from "./rooms";
import { findPath } from "./pathfinding";

// Visual tuning
const SPEED = 140; // px per second
const WALK_BOB_AMP = 3.0;
const IDLE_BOB_AMP = 0.4;
const SIT_SINK = 8;

const HAIR_COLORS = [0x171a1f, 0x3a2a1c, 0x6b4423, 0xa56a35, 0x8c3330, 0x494f59];
const SKIN = 0xf1c27d;

function hexToNum(hex) {
  return parseInt(String(hex).replace("#", ""), 16);
}

function shadeNum(num, f) {
  const n = Number.isFinite(num) ? num : 0x4ea1ff;
  return ((Math.round(((n >> 16) & 255) * f) << 16) |
          (Math.round(((n >> 8) & 255) * f) << 8) |
          Math.round((n & 255) * f));
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const TEXTURE_URL = "/office/sprites/32x32folk.png";
const SPRITESHEET_JSON = "/office/sprites/spritesheetData.json";

// Load an image as a PixiJS texture via a plain Image element (robust; always fires a real request)
export function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(Texture.from(img));
    img.onerror = () => reject(new Error("image load failed: " + url));
    img.src = url;
  });
}

// Spritesheet cache
let _sharedSpriteSheet = null;

export class Character {
  constructor({
    id,
    displayName,
    shirt,
    blurb,
    desk,
    isGod = false,
    grid = null,
    spriteIndex = 0, // 0-7 for f1-f8 on the sheet
  }) {
    this.id = id;
    this.displayName = displayName;
    this.shirt = typeof shirt === "string" ? hexToNum(shirt) : shirt;
    this.blurb = blurb;
    this.isGod = isGod;
    this.grid = grid || null;
    this.spriteIndex = spriteIndex; // which character on the sheet (0-7)

    this.homeDesk = { x: desk.x, y: desk.y + 38 };
    this.pos = { x: STATIONS.entrance.x, y: STATIONS.entrance.y };
    this.target = { ...this.homeDesk };
    this.onArrive = null;
    this.facing = 1; // 0=right, 1=down, 2=left, 3=up
    this.state = "walking";
    this.message = "";
    this.bobT = Math.random() * 10;
    this.sitting = false;

    this.desired = "desk";
    this.coffeeWait = 1.5 + Math.random() * 2;
    this.showDesktop = false;

    this._waypoints = [];
    if (this.grid) this._planRoute(this.homeDesk.x, this.homeDesk.y);

    // Colors
    this.shirtNum = this.shirt;
    this.pants = shadeNum(this.shirtNum, 0.45);
    this.hair = HAIR_COLORS[hashStr(String(id ?? "")) % HAIR_COLORS.length];

    this.view = new Container();
    this._build();
  }

  async _build() {
    try {
      // Load shared spritesheet once
      if (!_sharedSpriteSheet) {
        const data = await (await fetch(SPRITESHEET_JSON)).json();
        const texture = await loadTexture(TEXTURE_URL);
        texture.source.scaleMode = "nearest";
        const sheet = new Spritesheet(texture, data);
        await sheet.parse();
        _sharedSpriteSheet = sheet;
      }
      this.spriteSheet = _sharedSpriteSheet;

    // glow
    this.glow = new Graphics();
    this.glow.circle(0, 0, 36).fill({ color: this.isGod ? 0xf4d35e : 0x4ea1ff, alpha: 0 });
    this.view.addChild(this.glow);

    this.rig = new Container();
    this.view.addChild(this.rig);

    // shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 20, 16, 5).fill({ color: 0x000000, alpha: 0.3 });
    this.rig.addChild(shadow);

    this.body = new Container();
    this.rig.addChild(this.body);

    // AnimatedSprite using the shared spritesheet
    // The sheet has animations: down, left, right, up, sit
    this.anim = new AnimatedSprite({
      textures: this.spriteSheet.animations.down,
      animationSpeed: 0.15,
      anchor: { x: 0.5, y: 0.5 },
      scale: 1.5,
    });
    this.anim.play();
    this.body.addChild(this.anim);

    // outline
    this.outline = new Graphics();
    this.body.addChild(this.outline);

    // dust
    this.dust = new Container();
    this.rig.addChild(this.dust);
    this._dustTimer = 0;

    // glyph
    this.glyph = new Text({ text: "", style: { fill: 0xffffff, fontSize: 16, fontWeight: "800" } });
    this.glyph.anchor.set(0.5);
    this.glyph.y = -44;
    this.rig.addChild(this.glyph);

    // name tag
    this.nameTag = new Text({
      text: this.displayName,
      style: { fill: 0xdfe6ef, fontSize: 10, fontWeight: "700", fontFamily: "Inter, system-ui, sans-serif", stroke: { color: 0x000000, width: 2 } },
    });
    this.nameTag.anchor.set(0.5, 0);
    this.nameTag.y = -34;
    this.view.addChild(this.nameTag);

    // bubbles
    this.bubble = new Container();
    this.bubble.visible = false;
    this.view.addChild(this.bubble);
    this.convState = { isSpeaking: false, isThinking: false, bubbleText: "" };

    if (this.isGod) {
      this.crown = new Graphics();
      this.rig.addChild(this.crown);
    }
    } catch (e) {
      console.error("Character._build failed:", e);
    }
  }

  setConversationState(state) {
    this.convState = { ...this.convState, ...state };
    this._updateBubbles();
  }

  _updateBubbles() {
    this.bubble.removeChildren();
    const { isSpeaking, isThinking, bubbleText } = this.convState;
    if (isSpeaking) {
      const g = new Graphics();
      g.roundRect(-30, -18, 60, 26, 8).fill({ color: 0xf3f5f8, alpha: 0.95 }).stroke({ width: 1, color: 0xcbd3dd });
      this.bubble.addChild(g);
      const t = new Text({ text: "💬", style: { fontSize: 14 } });
      t.anchor.set(0.5); t.x = 0; t.y = -4;
      this.bubble.addChild(t);
    }
    if (isThinking) {
      const t = new Text({ text: "💭", style: { fontSize: 16 } });
      t.anchor.set(0.5); t.x = -20; t.y = -38;
      this.bubble.addChild(t);
    }
    if (bubbleText) {
      const g = new Graphics();
      g.roundRect(-50, -18, 100, 28, 8).fill({ color: 0x111827, alpha: 0.9 }).stroke({ width: 1, color: 0x4ea1ff });
      this.bubble.addChild(g);
      const t = new Text({ text: bubbleText, style: { fill: 0xf3f5f8, fontSize: 9, fontWeight: "600", wordWrap: true, wordWrapWidth: 90 } });
      t.anchor.set(0.5); t.x = 0; t.y = -4;
      this.bubble.addChild(t);
    }
  }

  setTarget(x, y, onArrive = null) {
    this.target = { x, y };
    this.onArrive = onArrive;
    this._waypoints = [];
    if (this.grid) this._planRoute(x, y);
  }

  _planRoute(x, y) {
    try {
      const path = findPath(this.grid, this.pos.x, this.pos.y, x, y);
      if (Array.isArray(path) && path.length > 0) {
        const q = path.slice();
        if (q.length > 1 && Math.hypot(q[0].x - this.pos.x, q[0].y - this.pos.y) < 2) q.shift();
        this._waypoints = q.filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
      }
    } catch (e) { this._waypoints = []; }
  }

  update(dt, live) {
    this._applyLive(live);

    const step = SPEED * dt;
    let moving = false;

    for (let guard = 0; guard < 128; guard++) {
      const goal = this._waypoints.length > 0 ? this._waypoints[0] : this.target;
      const dx = goal.x - this.pos.x;
      const dy = goal.y - this.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 1.5) {
        this.pos.x = goal.x; this.pos.y = goal.y;
        if (this._waypoints.length > 0) { this._waypoints.shift(); continue; }
        if (this.onArrive) { const cb = this.onArrive; this.onArrive = null; cb(); }
      } else {
        moving = true;
        const nx = dx / dist, ny = dy / dist;
        if (dist <= step) { this.pos.x = goal.x; this.pos.y = goal.y; }
        else { this.pos.x += nx * step; this.pos.y += ny * step; }
        if (Math.abs(nx) > 0.1) this.facing = nx >= 0 ? 0 : 2;
        if (Math.abs(ny) > 0.1 && Math.abs(ny) > Math.abs(nx)) this.facing = ny >= 0 ? 1 : 3;
        this.state = "walking";
      }
      break;
    }

    this._wander(dt);
    this._applyTransform(dt, moving);
  }

  _applyLive(live) {
    const status = live?.status;
    if (status === "error") {
      this.state = "error";
      if (this.desired !== "desk") { this.desired = "desk"; this.setTarget(this.homeDesk.x, this.homeDesk.y); }
      return;
    }
    if (status === "working" || status === "thinking") {
      this.state = "working"; this.message = live.task || "";
      this.coffeeWait = 1.5 + Math.random() * 2;
      if (this.desired !== "desk") { this.desired = "desk"; this.setTarget(this.homeDesk.x, this.homeDesk.y); }
      return;
    }
    this.state = "idle"; this.message = "";
  }

  _wander(dt) {
    if (this.isGod || this.state !== "idle" || this.desired === "coffee") return;
    this.coffeeWait -= dt;
    if (this.coffeeWait <= 0) {
      this.desired = "coffee";
      this.setTarget(STATIONS.cafeteria.x + (Math.random() * 90 - 45), STATIONS.cafeteria.y + (Math.random() * 50 - 25));
    }
  }

  _applyTransform(dt, moving) {
    if (!this.anim) return; // spritesheet still loading
    this.view.x = this.pos.x; this.view.y = this.pos.y;
    this.rig.scale.x = this.facing === 2 ? -1 : 1;

    this.bobT += dt * (moving ? 11 : 3);
    const bob = moving ? Math.sin(this.bobT) * WALK_BOB_AMP : Math.sin(this.bobT) * IDLE_BOB_AMP;
    this.rig.y = bob;

    const atHome = Math.hypot(this.homeDesk.x - this.pos.x, this.homeDesk.y - this.pos.y) < 4;
    this.sitting = !moving && atHome && this.state === "working";

    // Update AnimatedSprite based on facing and state
    const dirNames = ["right", "down", "left", "up"];
    const dirName = dirNames[this.facing] || "down";
    const isSitting = this.sitting && this.state === "working";

    if (isSitting && this.spriteSheet.animations.sit) {
      if (this.anim.textures !== this.spriteSheet.animations.sit) {
        this.anim.textures = this.spriteSheet.animations.sit;
        this.anim.animationSpeed = 0.05;
        this.anim.play();
      }
    } else if (moving) {
      if (this.anim.textures !== this.spriteSheet.animations[dirName]) {
        this.anim.textures = this.spriteSheet.animations[dirName];
        this.anim.animationSpeed = 0.15;
        this.anim.play();
      }
    } else {
      this.anim.stop();
      this.anim.texture = this.spriteSheet.animations[dirName]?.[0] || this.spriteSheet.animations.down[0];
    }

    // dust
    if (moving) {
      this._dustTimer -= dt;
      if (this._dustTimer <= 0) {
        this._dustTimer = 0.25;
        const d = new Graphics();
        const side = this.facing === 2 ? -1 : 1;
        d.circle(side * 6, 18 + this.rig.y, 3).fill({ color: 0x8899aa, alpha: 0.5 });
        d._life = 0.6;
        this.dust.addChild(d);
      }
    }
    for (let i = this.dust.children.length - 1; i >= 0; i--) {
      const d = this.dust.children[i];
      d._life -= dt;
      d.alpha = Math.max(0, d._life / 0.6) * 0.5;
      d.scale.set(d._life / 0.6 * 1.5);
      if (d._life <= 0) this.dust.removeChild(d);
    }

    // outline pulse
    const outlineAlpha = this.state === "working"
      ? 0.2 + 0.1 * Math.sin(this.bobT * 1.5)
      : 0.12;
    this.outline.clear().circle(0, -2, 20).stroke({
      width: 1.5, color: this.isGod ? 0xf4d35e : 0x4ea1ff, alpha: outlineAlpha,
    });

    this.glyph.text = this.state === "error" ? "!" : "";
    this._updateBubbles();

    if (this.isGod && this.crown) {
      this.crown.clear().roundRect(-10, -50, 20, 6, 2).fill(0xf4d35e);
    }
  }
}

export default Character;
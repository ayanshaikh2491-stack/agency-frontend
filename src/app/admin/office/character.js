// src/app/admin/office/character.js
// Munder-style walking character with REAL spritesheet (AnimatedSprite)
// PixiJS v8 — replaces procedural drawing with Kenney Folk 32x32 spritesheet.

import { Container, AnimatedSprite, Graphics, Text, Spritesheet, Texture, SCALE_MODES, Assets } from "pixi.js";
import { STATIONS } from "./rooms";
import { findPath } from "./pathfinding";

// Spritesheet data loaded at runtime via fetch (avoids webpack JSON import issues)
let spritesheetDataCache = null;
async function getSpritesheetData() {
  if (spritesheetDataCache) return spritesheetDataCache;
  const res = await fetch("/office/sprites/spritesheetData.json");
  spritesheetDataCache = await res.json();
  return spritesheetDataCache;
}

const SPEED = 155; // px per second
const TEXTURE_URL = "/office/sprites/32x32folk.png";

// Direction mapping: 0=right, 1=down, 2=left, 3=up
const DIR_NAMES = ["right", "down", "left", "up"];
const SIT_ANIM = "sit";

export class Character {
  constructor({
    id,
    displayName,
    shirt,
    blurb,
    desk,
    isGod = false,
    grid = null,
    spriteRow = 0, // which character on sheet (0-7)
  }) {
    this.id = id;
    this.displayName = displayName;
    this.shirt = shirt;
    this.blurb = blurb;
    this.isGod = isGod;
    this.grid = grid || null;
    this.spriteRow = spriteRow;

    // Stand in front of the desk, not on top of it.
    this.homeDesk = { x: desk.x, y: desk.y + 38 };
    this.pos = { x: STATIONS.entrance.x, y: STATIONS.entrance.y };
    this.target = { ...this.homeDesk };
    this.onArrive = null;
    this.facing = 1; // 1=down
    this.state = "walking"; // walking | working | idle | error
    this.message = "";
    this.bobT = Math.random() * 10;
    this.sitting = false;

    // behavior
    this.desired = "desk";
    this.coffeeWait = 1.5 + Math.random() * 2;
    this.showDesktop = false;

    // pathfinding
    this._waypoints = [];
    if (this.grid) this._planRoute(this.homeDesk.x, this.homeDesk.y);

    // Pixi setup
    this.view = new Container();
    this._build();
    this._applyTransform(0, false);
  }

  async _build() {
    // Load spritesheet once (static) using Assets.load for proper async loading
    if (!Character._spriteSheet) {
      const data = await getSpritesheetData();
      const texture = await Assets.load(TEXTURE_URL);
      texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
      const sheet = new Spritesheet(texture.baseTexture, data);
      await sheet.parse();
      Character._spriteSheet = sheet;
    }
    this.spriteSheet = Character._spriteSheet;

    // glow (behind everything)
    this.glow = new Graphics();
    this.glow.circle(0, 0, 32).fill({ color: this.isGod ? 0xf4d35e : 0x4ea1ff, alpha: 0 });
    this.view.addChild(this.glow);

    // rig container (flipped by facing)
    this.rig = new Container();
    this.view.addChild(this.rig);

    // shadow
    const shadow = new Graphics();
    shadow.ellipse(0, 20, 14, 4).fill({ color: 0x000000, alpha: 0.28 });
    this.rig.addChild(shadow);

    // AnimatedSprite for character
    this.anim = new AnimatedSprite({
      textures: this.spriteSheet.animations.down,
      animationSpeed: 0.15,
      anchor: { x: 0.5, y: 0.5 },
      scale: 1.5,
    });
    this.anim.play();
    this.rig.addChild(this.anim);

    // outline (subtle, always visible)
    this.outline = new Graphics();
    this.outline.circle(0, -4, 18).stroke({ width: 1.5, color: 0x4ea1ff, alpha: 0.12 });
    this.rig.addChild(this.outline);

    // dust particles
    this.dust = new Container();
    this.rig.addChild(this.dust);
    this._dustTimer = 0;

    // status glyph
    this.glyph = new Text({
      text: "",
      style: { fill: 0xffffff, fontSize: 16, fontWeight: "800" },
    });
    this.glyph.anchor.set(0.5);
    this.glyph.y = -42;
    this.rig.addChild(this.glyph);

    // name tag (on view, not flipped)
    this.nameTag = new Text({
      text: this.displayName,
      style: {
        fill: 0xdfe6ef,
        fontSize: 10,
        fontWeight: "700",
        fontFamily: "Inter, system-ui, sans-serif",
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.nameTag.anchor.set(0.5, 0);
    this.nameTag.y = -30;
    this.view.addChild(this.nameTag);

    // conversation bubbles (container on view)
    this.bubble = new Container();
    this.bubble.visible = false;
    this.view.addChild(this.bubble);

    // conversation state
    this.convState = {
      isSpeaking: false,
      isThinking: false,
      bubbleText: "",
    };

    // God crown
    if (this.isGod) {
      this.crown = new Graphics();
      this.crown.roundRect(-10, -48, 20, 6, 2).fill(0xf4d35e);
      this.rig.addChild(this.crown);
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
        if (q.length > 1 && Math.hypot(q[0].x - this.pos.x, q[0].y - this.pos.y) < 2) {
          q.shift();
        }
        this._waypoints = q.filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y));
      }
    } catch (e) {
      this._waypoints = [];
    }
  }

  // Called externally to update conversation visual state
  setConversationState(state) {
    this.convState = { ...this.convState, ...state };
    this._updateBubbles();
  }

  _updateBubbles() {
    this.bubble.removeChildren();
    const { isSpeaking, isThinking, bubbleText } = this.convState;

    if (isSpeaking) {
      const g = new Graphics();
      g.roundRect(-30, -16, 60, 24, 8).fill({ color: 0xf3f5f8, alpha: 0.95 }).stroke({ width: 1, color: 0xcbd3dd });
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
        this.pos.x = goal.x;
        this.pos.y = goal.y;
        if (this._waypoints.length > 0) {
          this._waypoints.shift();
          continue;
        }
        if (this.onArrive) {
          const cb = this.onArrive;
          this.onArrive = null;
          cb();
        }
      } else {
        moving = true;
        const nx = dx / dist;
        const ny = dy / dist;
        if (dist <= step) {
          this.pos.x = goal.x;
          this.pos.y = goal.y;
        } else {
          this.pos.x += nx * step;
          this.pos.y += ny * step;
        }
        if (Math.abs(nx) > 0.1) this.facing = nx >= 0 ? 2 : 0; // 2=left, 0=right
        if (Math.abs(ny) > 0.1 && Math.abs(ny) > Math.abs(nx)) this.facing = ny >= 0 ? 1 : 3; // 1=down, 3=up
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
      if (this.desired !== "desk") {
        this.desired = "desk";
        this.setTarget(this.homeDesk.x, this.homeDesk.y);
      }
      return;
    }

    if (status === "working" || status === "thinking") {
      this.state = "working";
      this.message = live.task || "";
      this.coffeeWait = 1.5 + Math.random() * 2;
      if (this.desired !== "desk") {
        this.desired = "desk";
        this.setTarget(this.homeDesk.x, this.homeDesk.y);
      }
      return;
    }

    this.state = "idle";
    this.message = "";
  }

  _wander(dt) {
    if (this.isGod || this.state !== "idle" || this.desired === "coffee") return;
    this.coffeeWait -= dt;
    if (this.coffeeWait <= 0) {
      this.desired = "coffee";
      this.setTarget(
        STATIONS.cafeteria.x + (Math.random() * 90 - 45),
        STATIONS.cafeteria.y + (Math.random() * 50 - 25)
      );
    }
  }

  _applyTransform(dt, moving) {
    this.view.x = this.pos.x;
    this.view.y = this.pos.y;
    this.rig.scale.x = this.facing === 2 ? -1 : 1; // flip for left

    this.bobT += dt * (moving ? 11 : 3);
    const bob = moving ? Math.sin(this.bobT) * 2.8 : Math.sin(this.bobT) * 0.5;
    this.rig.y = bob;

    // sitting
    const atHome = Math.hypot(this.homeDesk.x - this.pos.x, this.homeDesk.y - this.pos.y) < 4;
    this.sitting = !moving && atHome && this.state === "working";
    const ease = Math.min(1, dt * 10);
    this.rig.y += (this.sitting ? 7 : 0) * ease;

    // Update animation based on facing and state
    const dirName = ["right", "down", "left", "up"][this.facing] || "down";
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

    // dust while walking
    if (moving) {
      this._dustTimer -= dt;
      if (this._dustTimer <= 0) {
        this._dustTimer = 0.25;
        const dust = new Graphics();
        const side = this.facing === 2 ? -1 : 1;
        const footX = side * 6;
        const footY = 20;
        dust.circle(footX * side, footY + this.rig.y, 2.5).fill({ color: 0x8899aa, alpha: 0.5 });
        dust._life = 0.6;
        this.dust.addChild(dust);
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
      ? 0.18 + 0.08 * Math.sin(this.bobT * 1.5)
      : 0.12;
    this.outline.clear().circle(0, -4, 18).stroke({
      width: 1.5, color: this.isGod ? 0xf4d35e : 0x4ea1ff, alpha: outlineAlpha,
    });

    this.glyph.text = this.state === "error" ? "!" : "";
  }
}

// Static cache for spritesheet
Character._spriteSheet = null;

export default Character;
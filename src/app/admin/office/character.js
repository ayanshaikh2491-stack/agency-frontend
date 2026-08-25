// src/app/admin/office/character.js
// A Munder-style walking character for the office floor.
// PixiJS v8 procedural pixel-human avatar with smooth movement (straight-line,
// or waypoint-following when a collision grid is provided), an
// idle/walk/working/error state machine, a pulsing glow, a thought bubble, a
// sitting/typing pose, plus wander + delegation (walk-to-meeting) behaviors
// driven by live floor state.

import { Container, Graphics, Text } from "pixi.js";
import { STATIONS } from "./rooms";
import { findPath } from "./pathfinding";

const SPEED = 155; // px per second

// Rig geometry shared by _build and _applyTransform.
const LEG_X = 3.6; // leg resting offset from center x
const LEG_Y = 8; // leg resting top y
const ARM_X = 8; // shoulder offset from center x
const ARM_Y = -4; // shoulder y

const HAIR_COLORS = [0x171a1f, 0x3a2a1c, 0x6b4423, 0xa56a35, 0x8c3330, 0x494f59];

// Convert "#rrggbb" to a number.
function hexToNum(hex) {
  return parseInt(String(hex).replace("#", ""), 16);
}

// Darken a numeric color by a factor (0..1).
function shadeNum(num, f) {
  const n = Number.isFinite(num) ? num : 0x4ea1ff;
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return (r << 16) | (g << 8) | b;
}

// Tiny stable string hash (per-character hair color pick).
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export class Character {
  constructor({
    id,
    displayName,
    shirt,
    blurb,
    desk,
    isGod = false,
    grid = null,
  }) {
    this.id = id;
    this.displayName = displayName;
    this.shirt = typeof shirt === "string" ? hexToNum(shirt) : shirt;
    this.blurb = blurb;
    this.isGod = isGod;
    this.grid = grid || null; // optional tile grid; enables pathfinding
    // Stand in front of the desk, not on top of it.
    this.homeDesk = { x: desk.x, y: desk.y + 38 };
    this.pos = { x: STATIONS.entrance.x, y: STATIONS.entrance.y };
    this.target = { ...this.homeDesk };
    this.onArrive = null;
    this.facing = 1;
    this.state = "walking"; // walking | working | idle | error | briefed
    this.message = "";
    this.bobT = Math.random() * 10;
    this.sitting = false;

    // behavior bookkeeping
    this.desired = "desk"; // desk | coffee
    this.coffeeWait = 1.5 + Math.random() * 2;
    this.showDesktop = false; // floor sets this when the agent is coding

    // Waypoint queue from pathfinding. Empty queue => straight-line movement,
    // identical to the pre-grid behavior.
    this._waypoints = [];
    if (this.grid) this._planRoute(this.homeDesk.x, this.homeDesk.y);

    this.view = new Container();
    this._build();
    this._applyTransform(0, false);
  }

  _build() {
    // glow (behind everything)
    this.glow = new Graphics();
    this.glow
      .circle(0, 0, 32)
      .fill({ color: this.isGod ? 0xf4d35e : 0x4ea1ff, alpha: 0 });
    this.view.addChild(this.glow);

    // rig (body) — flipped by facing
    this.rig = new Container();
    this.view.addChild(this.rig);

    // grounded shadow — stays on the floor even when seated
    const shadow = new Graphics();
    shadow.ellipse(0, 17, 13, 4.5).fill({ color: 0x000000, alpha: 0.28 });
    this.rig.addChild(shadow);

    // body group — sinks ~6px when sitting (see _applyTransform)
    this.body = new Container();
    this.rig.addChild(this.body);

    const SKIN = 0xf1c27d;
    const SHIRT = Number.isFinite(this.shirt) ? this.shirt : 0x4ea1ff;
    const PANTS = shadeNum(SHIRT, 0.45);
    const HAIR =
      HAIR_COLORS[hashStr(String(this.id ?? "")) % HAIR_COLORS.length];

    // legs: darker pants + shoe, pivot at hip (y grows downward)
    const makeLeg = () => {
      const lg = new Graphics();
      lg.roundRect(-1.8, 0, 3.6, 7, 1).fill(PANTS); // pant leg
      lg.roundRect(-2.1, 6, 4.2, 2.4, 1).fill(0x232a35); // shoe
      return lg;
    };
    this.legL = makeLeg();
    this.legR = makeLeg();
    this.legL.position.set(-LEG_X, LEG_Y);
    this.legR.position.set(LEG_X, LEG_Y);
    this.body.addChild(this.legL, this.legR);

    // torso: colored shirt + collar px
    const torso = new Graphics();
    torso.roundRect(-7.5, -7, 15, 15, 3).fill(SHIRT);
    torso.rect(-3, -7, 6, 2).fill(shadeNum(SHIRT, 0.7));
    this.body.addChild(torso);

    // arms: small sleeve nubs pivoting at the shoulder, skin hands
    const makeArm = () => {
      const ag = new Graphics();
      ag.roundRect(-1.6, -1, 3.2, 7, 1.6).fill(SHIRT); // sleeve
      ag.circle(0, 6, 1.6).fill(SKIN); // hand
      return ag;
    };
    this.armL = makeArm();
    this.armL.position.set(-ARM_X, ARM_Y);
    this.armR = makeArm();
    this.armR.position.set(ARM_X, ARM_Y);
    this.body.addChild(this.armL, this.armR);

    // head: hair circle behind, face circle in front => hair crescent on top,
    // plus a back-of-head block, eyes and a tiny mouth px (facing +x).
    const head = new Graphics();
    head.circle(0, -15.5, 8).fill(HAIR); // hair block
    head.circle(0, -13.5, 8).fill(SKIN); // face
    head.rect(-8.6, -15, 2.6, 6.5).fill(HAIR); // back-of-head hair
    head.rect(-8, -19, 5, 2).fill(HAIR); // fringe px
    head.circle(-2.6, -14, 1.5).fill(0x222222); // eyes
    head.circle(2.6, -14, 1.5).fill(0x222222);
    head.rect(1.5, -10.5, 3, 1.2).fill(0x9c6b4e); // tiny mouth px
    this.body.addChild(head);

    if (this.isGod) {
      const crown = new Graphics();
      crown.roundRect(-11, -27, 22, 5, 2).fill(0xf4d35e); // little crown brim
      this.body.addChild(crown);
    }

    // status glyph (error "!"), child of rig so it flips with the body
    this.glyph = new Text({
      text: "",
      style: { fill: 0xffffff, fontSize: 16, fontWeight: "800" },
    });
    this.glyph.anchor.set(0.5);
    this.glyph.y = -32;
    this.rig.addChild(this.glyph);

    // held props (children of body so they settle when seated)
    this.laptop = new Graphics();
    this.laptop.roundRect(-10, 2, 20, 3.5, 1.5).fill(0x39424e); // base
    this.laptop
      .roundRect(-9, -6, 18, 9, 1.5)
      .fill(0x222a33)
      .stroke({ width: 1, color: 0x4ea1ff }); // screen
    this.body.addChild(this.laptop);
    this.laptop.visible = false;

    this.cup = new Graphics();
    this.cup.roundRect(6, 3, 6, 7, 1.5).fill(0xf3f5f8); // cup
    this.cup.circle(13, 6.5, 2.2).stroke({ width: 1.5, color: 0xf3f5f8 }); // handle
    this.body.addChild(this.cup);
    this.cup.visible = false;

    // name tag (child of view — never flipped, always readable)
    this.nameTag = new Text({
      text: this.displayName,
      style: {
        fill: 0xdfe6ef,
        fontSize: 10,
        fontWeight: "700",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    });
    this.nameTag.anchor.set(0.5, 0);
    this.nameTag.y = 24;
    this.view.addChild(this.nameTag);

    // thought bubble (child of view — never flipped)
    this.bubble = new Container();
    this.bubbleBg = new Graphics();
    this.bubbleText = new Text({
      text: "",
      style: {
        fill: 0x111827,
        fontSize: 10,
        fontWeight: "600",
        wordWrap: true,
        wordWrapWidth: 132,
        fontFamily: "Inter, system-ui, sans-serif",
      },
    });
    this.bubble.addChild(this.bubbleBg, this.bubbleText);
    this.bubble.visible = false;
    this.view.addChild(this.bubble);
  }

  setTarget(x, y, onArrive = null) {
    this.target = { x, y };
    this.onArrive = onArrive;
    this._waypoints = [];
    if (this.grid) this._planRoute(x, y);
  }

  // Ask pathfinding for waypoints to (x, y). Any failure (null path, throw,
  // malformed data) silently leaves the queue empty => straight-line fallback.
  _planRoute(x, y) {
    try {
      const path = findPath(this.grid, this.pos.x, this.pos.y, x, y);
      if (Array.isArray(path) && path.length > 0) {
        const q = path.slice();
        // Drop a leading waypoint that just restates where we already are.
        if (
          q.length > 1 &&
          Math.hypot(q[0].x - this.pos.x, q[0].y - this.pos.y) < 2
        ) {
          q.shift();
        }
        this._waypoints = q.filter(
          (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)
        );
      }
    } catch (e) {
      this._waypoints = [];
    }
  }

  // live = { status, task, mandate } for this character (or undefined)
  update(dt, live) {
    this._applyLive(live);

    const step = SPEED * dt;
    let moving = false;

    // Head to the next queued waypoint; when the queue is empty, fall back to
    // a straight line toward this.target (classic behavior, unchanged).
    for (let guard = 0; guard < 128; guard++) {
      const goal =
        this._waypoints.length > 0 ? this._waypoints[0] : this.target;
      const dx = goal.x - this.pos.x;
      const dy = goal.y - this.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 1.5) {
        this.pos.x = goal.x;
        this.pos.y = goal.y;
        if (this._waypoints.length > 0) {
          this._waypoints.shift(); // intermediate waypoint reached; next leg
          continue;
        }
        // final arrival: fire the original callback exactly once
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
        if (Math.abs(nx) > 0.1) this.facing = nx >= 0 ? 1 : -1;
        this.state = "walking";
      }
      break;
    }

    this._wander(dt);
    this._applyTransform(dt, moving);
  }

  // live = { status, task } for this character (or undefined)
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

    // idle / standby / no data -> free time (coffee break)
    this.state = "idle";
    this.message = "";
  }

  // Free agents drift to the cafeteria for coffee. Michael never leaves.
  _wander(dt) {
    if (this.isGod || this.state !== "idle" || this.desired === "coffee")
      return;
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
    this.rig.scale.x = this.facing >= 0 ? 1 : -1;

    this.bobT += dt * (moving ? 11 : 3);
    const bob = moving ? Math.sin(this.bobT) * 2.2 : Math.sin(this.bobT) * 0.6;
    this.rig.y = bob;

    // --- sitting pose ---------------------------------------------------
    // Seated once parked at the home desk while working; stands back up as
    // soon as the state leaves working or the character starts moving again.
    const atHome =
      Math.hypot(this.homeDesk.x - this.pos.x, this.homeDesk.y - this.pos.y) <
      4;
    this.sitting = !moving && atHome && this.state === "working";
    const ease = Math.min(1, dt * 10);
    this.body.y += ((this.sitting ? 6 : 0) - this.body.y) * ease;

    // legs: visible alternating stride while walking, tucked fold while
    // seated, quietly standing otherwise.
    if (moving) {
      const sw = Math.sin(this.bobT);
      this.legL.x = -LEG_X + sw * 1.2;
      this.legL.y = LEG_Y + Math.max(0, sw) * 2.4;
      this.legR.x = LEG_X - sw * 1.2;
      this.legR.y = LEG_Y + Math.max(0, -sw) * 2.4;
      this.legL.scale.y = 1;
      this.legR.scale.y = 1;
    } else if (this.sitting) {
      this.legL.position.set(-LEG_X + 2.5, LEG_Y + 2.5);
      this.legR.position.set(LEG_X + 2.5, LEG_Y + 2.5);
      this.legL.scale.y = 0.55;
      this.legR.scale.y = 0.55;
    } else {
      this.legL.position.set(-LEG_X, LEG_Y);
      this.legR.position.set(LEG_X, LEG_Y);
      this.legL.scale.y = 1;
      this.legR.scale.y = 1;
    }

    // arms: hang as side nubs; angle forward (typing) while working; tiny
    // alternating hand tap while seated at the desktop.
    let armLT, armRT;
    if (this.state === "working") {
      armLT = -1.05;
      armRT = -0.7;
      if (this.sitting && this.showDesktop) {
        const tap = Math.sin(this.bobT * 2.4);
        armLT += tap * 0.09;
        armRT -= tap * 0.09;
      }
    } else if (moving) {
      const sw = Math.sin(this.bobT);
      armLT = sw * 0.3;
      armRT = -sw * 0.3;
    } else {
      armLT = 0;
      armRT = 0;
    }
    this.armL.rotation += (armLT - this.armL.rotation) * ease;
    this.armR.rotation += (armRT - this.armR.rotation) * ease;

    const wantGlow =
      this.state === "working" ? 0.22 + 0.16 * Math.sin(this.bobT * 1.5) : 0;
    this.glow.alpha += (wantGlow - this.glow.alpha) * Math.min(1, dt * 6);

    this.glyph.text = this.state === "error" ? "!" : "";

    // activity props: laptop in hands while working on the go,
    // desktop monitor is drawn by the floor at the agent's own desk,
    // coffee cup during breaks.
    this.laptop.visible = this.state === "working" && !this.showDesktop;
    this.cup.visible = this.state === "idle" && this.desired === "coffee";

    const showBubble =
      this.state === "working" && (this.message || "").trim().length > 0;
    this.bubble.visible = showBubble;
    if (showBubble) {
      this.bubbleText.text = this.message;
      const w = Math.min(154, Math.max(64, this.bubbleText.width + 16));
      const h = this.bubbleText.height + 12;
      this.bubbleText.x = 2;
      this.bubbleText.y = -h - 12 + 6;
      this.bubbleBg
        .clear()
        .roundRect(-6, -h - 12, w, h, 9)
        .fill({ color: 0xf3f5f8, alpha: 0.97 })
        .stroke({ width: 1, color: 0xcbd3dd });
      this.bubbleBg.circle(0, -8, 3).fill({ color: 0xf3f5f8, alpha: 0.97 });
      this.bubbleBg.circle(4, -4, 2).fill({ color: 0xf3f5f8, alpha: 0.97 });
    }
  }
}

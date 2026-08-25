// src/app/admin/office/character.js
// A Munder-style walking character for the office floor.
// PixiJS v8 Graphics avatar with smooth movement, an idle/walk/working/error
// state machine, a pulsing glow, a thought bubble, plus wander + delegation
// (walk-to-meeting) behaviors driven by live floor state.

import { Container, Graphics, Text } from "pixi.js";
import { STATIONS } from "./rooms";

const SPEED = 155; // px per second

// Convert "#rrggbb" to a number.
function hexToNum(hex) {
  return parseInt(String(hex).replace("#", ""), 16);
}

export class Character {
  constructor({ id, displayName, shirt, blurb, desk, isGod = false }) {
    this.id = id;
    this.displayName = displayName;
    this.shirt = typeof shirt === "string" ? hexToNum(shirt) : shirt;
    this.blurb = blurb;
    this.isGod = isGod;
    // Stand in front of the desk, not on top of it.
    this.homeDesk = { x: desk.x, y: desk.y + 38 };
    this.pos = { x: STATIONS.entrance.x, y: STATIONS.entrance.y };
    this.target = { ...this.homeDesk };
    this.onArrive = null;
    this.facing = 1;
    this.state = "walking"; // walking | working | idle | error | briefed
    this.message = "";
    this.bobT = Math.random() * 10;

    // behavior bookkeeping
    this.desired = "desk";
    this.wanderCooldown = 6 + Math.random() * 9;
    this.wanderPhase = "none"; // none | toCafe | atCafe | back
    this.wanderWait = 0;

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

    const g = new Graphics();
    g.ellipse(0, 18, 14, 5).fill({ color: 0x000000, alpha: 0.28 }); // shadow
    g.roundRect(-12, -4, 24, 24, 7).fill(this.shirt); // torso
    g.circle(0, -16, 9).fill(0xf1c27d); // head
    g.circle(-3, -17, 1.7).fill(0x222222); // eyes
    g.circle(3, -17, 1.7).fill(0x222222);
    if (this.isGod) {
      g.roundRect(-13, -22, 26, 5, 2).fill(0xf4d35e); // little crown brim
    }
    this.rig.addChild(g);

    // status glyph (error "!"), child of rig so it flips with the body
    this.glyph = new Text({
      text: "",
      style: { fill: 0xffffff, fontSize: 16, fontWeight: "800" },
    });
    this.glyph.anchor.set(0.5);
    this.glyph.y = -16;
    this.rig.addChild(this.glyph);

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
  }

  // live = { status, task, mandate } for this character (or undefined)
  update(dt, live) {
    this._applyLive(live);

    const dx = this.target.x - this.pos.x;
    const dy = this.target.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    const step = SPEED * dt;
    const moving = dist > 1.5;

    if (moving) {
      const nx = dx / dist;
      const ny = dy / dist;
      if (dist <= step) {
        this.pos.x = this.target.x;
        this.pos.y = this.target.y;
      } else {
        this.pos.x += nx * step;
        this.pos.y += ny * step;
      }
      if (Math.abs(nx) > 0.1) this.facing = nx >= 0 ? 1 : -1;
      this.state = "walking";
    } else {
      this.pos.x = this.target.x;
      this.pos.y = this.target.y;
      if (this.onArrive) {
        const cb = this.onArrive;
        this.onArrive = null;
        cb();
      }
    }

    this._wander(dt, moving);
    this._applyTransform(dt, moving);
  }

  _applyLive(live) {
    if (!live) return;
    if (live.task) this.message = live.task;
    else if (this.state !== "working") this.message = "";

    if (live.status === "error") {
      this.state = "error";
      if (this.desired !== "error") {
        this.desired = "error";
        this.setTarget(this.homeDesk.x, this.homeDesk.y);
      }
      return;
    }

    if (live.mandate) {
      // CEO delegated a standing task -> walk to the meeting table, stay briefed.
      this.state = "briefed";
      this.message = live.task || "briefed by Michael";
      if (this.desired !== "meeting") {
        this.desired = "meeting";
        this.setTarget(STATIONS.meeting.x, STATIONS.meeting.y);
      }
      return;
    }

    if (live.status === "working" || live.status === "thinking") {
      this.state = "working";
      if (this.desired !== "desk") {
        this.desired = "desk";
        this.setTarget(this.homeDesk.x, this.homeDesk.y);
      }
      return;
    }

    // idle
    this.state = "idle";
    this.desired = "desk";
  }

  _wander(dt, moving) {
    if (this.state === "working" || this.state === "error" || this.state === "briefed")
      return;
    if (this.desired !== "desk") return; // e.g. off at a meeting

    const atHome =
      Math.hypot(this.pos.x - this.homeDesk.x, this.pos.y - this.homeDesk.y) < 4;

    if (this.wanderPhase === "none") {
      if (atHome) {
        this.wanderCooldown -= dt;
        if (this.wanderCooldown <= 0) {
          this.wanderPhase = "toCafe";
          this.setTarget(STATIONS.cafeteria.x, STATIONS.cafeteria.y);
        }
      }
    } else if (this.wanderPhase === "toCafe") {
      if (!moving) {
        this.wanderPhase = "atCafe";
        this.wanderWait = 3 + Math.random() * 3;
      }
    } else if (this.wanderPhase === "atCafe") {
      this.wanderWait -= dt;
      if (this.wanderWait <= 0) {
        this.wanderPhase = "back";
        this.setTarget(this.homeDesk.x, this.homeDesk.y);
      }
    } else if (this.wanderPhase === "back") {
      if (!moving) {
        this.wanderPhase = "none";
        this.wanderCooldown = 9 + Math.random() * 11;
      }
    }
  }

  _applyTransform(dt, moving) {
    this.view.x = this.pos.x;
    this.view.y = this.pos.y;
    this.rig.scale.x = this.facing >= 0 ? 1 : -1;

    this.bobT += dt * (moving ? 11 : 3);
    const bob = moving ? Math.sin(this.bobT) * 2.2 : Math.sin(this.bobT) * 0.6;
    this.rig.y = bob;

    const wantGlow =
      this.state === "working"
        ? 0.22 + 0.16 * Math.sin(this.bobT * 1.5)
        : this.state === "briefed"
        ? 0.2
        : 0;
    this.glow.alpha += (wantGlow - this.glow.alpha) * Math.min(1, dt * 6);

    this.glyph.text = this.state === "error" ? "!" : "";

    const showBubble =
      (this.state === "working" || this.state === "briefed") &&
      (this.message || "").trim().length > 0;
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

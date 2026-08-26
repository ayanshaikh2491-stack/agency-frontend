/**
 * tiles.js - pixel-art tile textures for the 2D office floor (PixiJS v8).
 *
 * Every tile is exactly T x T (20x20) logical pixels. Textures are generated
 * at resolution 2, so keep Sprite scale at 1 and position sprites on the
 * T-pixel grid.
 *
 * Usage:
 *
 *   import { buildTileTextures, T } from "./tiles";
 *
 *   const tex = buildTileTextures(app.renderer);
 *   const s = new Sprite(tex.wood);
 *   s.x = col * T;
 *   s.y = row * T;
 *
 * The returned map is keyed by: wood, carpet, meet, cafe, wallTop, wallFace,
 * plant, coffee, board, rug, mat. Floor/wall tiles are fully opaque; the
 * decor tiles (plant, coffee, board) have transparent backgrounds and should
 * be layered on top of a floor tile.
 *
 * All patterns are hand-placed and fully deterministic (no Math.random), so
 * the floor renders identically on every run.
 */

import { Graphics } from "pixi.js";

/** Tile size in logical screen pixels. */
export const T = 20;

/**
 * Invisible spacer rect used by the transparent-background decor tiles:
 * it locks generateTexture() bounds to the full 20x20 frame even though the
 * visible artwork only occupies part of the tile.
 */
const SPACER = { color: 0xffffff, alpha: 0 };

/** Draw one axis-aligned "pixel" rectangle (the unit of all patterns here). */
function px(g, color, x, y, w = 1, h = 1) {
  g.rect(x, y, w, h).fill(color);
}

/** Opaque base fill covering the whole 20x20 tile. */
function base(g, color) {
  px(g, color, 0, 0, T, T);
}

/** Transparent bounds keeper for decor tiles. */
function spacer(g) {
  px(g, SPACER, 0, 0, T, T);
}

/** Warm wood plank floor. */
function wood() {
  const g = new Graphics();
  base(g, "#8a6642");
  // Horizontal plank seam line every 5px (periodic across tiled rows).
  for (const y of [4, 9, 14, 19]) {
    px(g, "#6f5033", 0, y, T, 1);
  }
  // One vertical seam per plank row, offset per row.
  px(g, "#6f5033", 12, 0, 1, 4);
  px(g, "#6f5033", 5, 5, 1, 4);
  px(g, "#6f5033", 15, 10, 1, 4);
  px(g, "#6f5033", 8, 15, 1, 4);
  // A few lighter grain flecks (placed away from seams).
  const flecks = [
    [3, 2],
    [16, 1],
    [10, 6],
    [2, 11],
    [17, 12],
    [5, 16],
  ];
  for (const [x, y] of flecks) {
    px(g, "#9c7852", x, y, 2, 1);
  }
  return g;
}

/** Executive dark carpet with subtle 2px speckles. */
function carpet() {
  const g = new Graphics();
  base(g, "#23262e");
  const lights = [
    [2, 4],
    [12, 2],
    [16, 8],
    [4, 14],
    [10, 18],
  ];
  const darks = [
    [6, 6],
    [2, 10],
    [14, 12],
    [8, 16],
  ];
  for (const [x, y] of lights) {
    px(g, "#2c303a", x, y, 2, 2);
  }
  for (const [x, y] of darks) {
    px(g, "#1d2027", x, y, 2, 2);
  }
  return g;
}

/** Meeting-room floor: cool gray tiles with a 10px grout grid. */
function meet() {
  const g = new Graphics();
  base(g, "#2e3540");
  px(g, "#262c36", 0, 0, 1, T);
  px(g, "#262c36", 10, 0, 1, T);
  px(g, "#262c36", 0, 0, T, 1);
  px(g, "#262c36", 0, 10, T, 1);
  return g;
}

/** Cafeteria floor: soft 10px checker. */
function cafe() {
  const g = new Graphics();
  px(g, "#242031", 0, 0, 10, 10);
  px(g, "#2a2438", 10, 0, 10, 10);
  px(g, "#2a2438", 0, 10, 10, 10);
  px(g, "#242031", 10, 10, 10, 10);
  return g;
}

/** Wall cap seen from above, with a highlighted top edge. */
function wallTop() {
  const g = new Graphics();
  base(g, "#454f5e");
  px(g, "#5a6577", 0, 0, T, 1);
  return g;
}

/** Wall front face with vertical panel seams and a darker baseboard. */
function wallFace() {
  const g = new Graphics();
  base(g, "#39424f");
  px(g, "#2f3742", 0, 0, 1, T);
  px(g, "#2f3742", 10, 0, 1, T);
  // Baseboard strip covers the bottom of the seams.
  px(g, "#232932", 0, 17, T, 3);
  return g;
}

/** Potted plant decor on a transparent background. */
function plant() {
  const g = new Graphics();
  spacer(g);
  // Bush blob cluster filling the upper 14px (pot overlaps its base).
  g.circle(10, 5, 5).fill("#3f7d44");
  g.circle(5, 10, 4).fill("#3f7d44");
  g.circle(15, 10, 4).fill("#3f7d44");
  g.circle(10, 11, 3).fill("#3f7d44");
  // Leaf highlights.
  px(g, "#57a05a", 8, 3, 2, 2);
  px(g, "#57a05a", 12, 6, 2, 2);
  px(g, "#57a05a", 4, 9, 2, 2);
  // Pot: rounded rect in the bottom half, centered.
  g.roundRect(5, 11, 10, 9, 2).fill("#7a5230");
  return g;
}

/** Coffee machine decor on a transparent background. */
function coffee() {
  const g = new Graphics();
  spacer(g);
  // Dark body (rows 3..16, horizontally centered).
  g.roundRect(5, 3, 10, 14, 2).fill("#20242c");
  // Silver top band just under the rounded cap.
  px(g, "#9aa4b2", 5, 5, 10, 2);
  // Red indicator light.
  px(g, "#e05252", 6, 8, 2, 2);
  // Cup notch near the bottom front.
  px(g, "#161a21", 8, 12, 4, 3);
  return g;
}

/** Whiteboard fragment decor on a transparent background. */
function board() {
  const g = new Graphics();
  spacer(g);
  // Frame + white surface.
  px(g, "#5a6577", 2, 4, 16, 12);
  px(g, "#e8edf2", 3, 5, 14, 10);
  // Faint marker scribbles: short straight strokes only.
  px(g, "#7fb3d3", 5, 7, 6, 1);
  px(g, "#7fb3d3", 5, 10, 9, 1);
  px(g, "#7fb3d3", 8, 12, 5, 1);
  return g;
}

/** Deep teal meeting rug tile with border pattern and diamond hint. */
function rug() {
  const g = new Graphics();
  base(g, "#1d4e4a");
  // 1px border pattern around the tile edge.
  px(g, "#2a6a64", 0, 0, T, 1);
  px(g, "#2a6a64", 0, 19, T, 1);
  px(g, "#2a6a64", 0, 0, 1, T);
  px(g, "#2a6a64", 19, 0, 1, T);
  // Subtle outlined diamond centered in the tile.
  const diamond = [
    [10, 6],
    [9, 7],
    [11, 7],
    [8, 8],
    [12, 8],
    [7, 9],
    [13, 9],
    [6, 10],
    [14, 10],
    [7, 11],
    [13, 11],
    [8, 12],
    [12, 12],
    [9, 13],
    [11, 13],
    [10, 14],
  ];
  for (const [x, y] of diamond) {
    px(g, "#2a6a64", x, y, 1, 1);
  }
  return g;
}

/** Welcome mat with woven cross-lines and a lighter inset border. */
function mat() {
  const g = new Graphics();
  base(g, "#5a3030");
  // Woven cross-lines every 4px.
  for (const p of [3, 7, 11, 15]) {
    px(g, "#6e4040", p, 0, 1, T);
    px(g, "#6e4040", 0, p, T, 1);
  }
  // Lighter border inset 1px from the edge (drawn over the weave).
  px(g, "#7a4a42", 1, 1, 18, 1);
  px(g, "#7a4a42", 1, 18, 18, 1);
  px(g, "#7a4a42", 1, 1, 1, 18);
  px(g, "#7a4a42", 18, 1, 1, 18);
  return g;
}

/**
 * Build the office tile texture set with a PixiJS v8 renderer.
 *
 * @param {import("pixi.js").Renderer} renderer - e.g. `app.renderer`.
 * @returns {Object<string, import("pixi.js").Texture>} Map keyed by
 *   wood, carpet, meet, cafe, wallTop, wallFace, plant, coffee, board,
 *   rug, mat. Each texture covers one 20x20 logical tile (generated at
 *   resolution 2).
 */
export function buildTileTextures(renderer) {
  const builders = {
    wood,
    carpet,
    meet,
    cafe,
    wallTop,
    wallFace,
    plant,
    coffee,
    board,
    rug,
    mat,
  };
  const textures = {};
  for (const [name, build] of Object.entries(builders)) {
    const graphics = build();
    textures[name] = renderer.generateTexture({
      target: graphics,
      resolution: 2,
    });
    graphics.destroy();
  }
  return textures;
}

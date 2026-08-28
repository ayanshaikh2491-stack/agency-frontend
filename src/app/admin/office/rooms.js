// src/app/admin/office/rooms.js
// World layout for the Munder-style TAGS Agency office floor.
// Pure data: the scene (OfficeFloor) reads these to draw rooms and to place
// desks / stations. Characters walk between these coordinates.

export const WORLD = { w: 1280, h: 960 };

// Room zones drawn on top of the SkyOffice base map (tint + label + wall dividers).
// Coordinates are pixels in the 1280x960 office space.
export const ROOMS = [
  { id: "ceo",     x: 800, y: 32,  w: 448, h: 304, label: "CEO Office",    fill: 0x1b1d12, labelColor: 0xf4d35e, sub: "Michael" },
  { id: "meeting", x: 32,  y: 32,  w: 768, h: 304, label: "Meeting Room",  fill: 0x121b1b, labelColor: 0x5fd0c5 },
  { id: "open",    x: 32,  y: 352, w: 1216,h: 576, label: "Open Office",   fill: 0x14181f, labelColor: 0x6b7686 },
];

// Interior wall divider segments (rectangles) — drawn over the floor to separate rooms.
// Door gaps left between segments so agents can walk between rooms.
export const WALLS = [
  // horizontal divider between top rooms and open office (y=336), with 2 door gaps
  { x: 32,  y: 330, w: 348, h: 12 },   // meeting door gap after x=380
  { x: 440, y: 330, w: 540, h: 12 },   // ceo door gap after x=980
  { x: 1040,y: 330, w: 208, h: 12 },
  // vertical divider between CEO (right) and Meeting (left) at x=792, with door gap
  { x: 792, y: 32,  w: 12, h: 150 },   // door gap y=182..230
  { x: 792, y: 230, w: 12, h: 106 },
];

// Shared stations characters walk to (besides their own desk).
export const STATIONS = {
  entrance:  { x: 640, y: 560, label: "Entrance" },
  cafeteria: { x: 1180, y: 560, label: "Coffee" },
  meeting:   { x: 416, y: 200, label: "Table" },
};

// Floor / wall accent colors
export const COLORS = {
  floorLine: 0x222a33,
  wall: 0x2c3540,
  desk: 0x222a33,
  deskStroke: 0x3a4756,
  station: 0x2a3340,
  stationStroke: 0x44546a,
};

// Helper: build a desk rect for a cast member.
export function deskRectFor(member) {
  const { x, y } = member.desk;
  return { x: x - 46, y: y - 30, w: 92, h: 60 };
}

// ── Walls, doors & decor (pixel-tile era) ────────────────────────
// The world is a 55x34 grid of 20px tiles. A vertical wall runs down
// col 38 with three doorways; two horizontal walls split the right wing.
export const WALL_COL = 38;
export const H_ROWS = [16, 24]; // horizontal wall rows (right wing only)
export const DOOR_ROWS = [
  [9, 13],   // CEO office door    (y 180-260)
  [20, 24],  // meeting room door  (y 400-480)
  [29, 33],  // cafeteria door     (y 580-660)
];

// Pixel-space wall rects for the pathfinding collision grid.
export function wallRects() {
  const segs = [];
  let y = 0;
  for (const [a, b] of DOOR_ROWS) {
    if (y < a) segs.push({ x: 760, y, w: 20, h: a - y });
    y = b;
  }
  if (y < 680) segs.push({ x: 760, y, w: 20, h: 680 - y });
  segs.push({ x: 780, y: 320, w: 320, h: 20 });
  segs.push({ x: 780, y: 480, w: 320, h: 20 });
  return segs;
}

// Is this grid cell a wall tile? (visual layer uses this)
export function isWallCell(col, row) {
  if (col === WALL_COL && !DOOR_ROWS.some(([a, b]) => row >= a && row < b))
    return true;
  if (col > WALL_COL && H_ROWS.includes(row)) return true;
  return false;
}

// Decorative tiles keyed by texture name from tiles.js
export const DECOR = [
  { tile: "plant", col: 2, row: 2 },
  { tile: "plant", col: 2, row: 31 },
  { tile: "plant", col: 37, row: 14 },
  { tile: "plant", col: 53, row: 1 },
  { tile: "plant", col: 52, row: 26 },
  { tile: "plant", col: 51, row: 32 },
  { tile: "board", col: 44, row: 17 },
  { tile: "board", col: 45, row: 17 },
  { tile: "coffee", col: 46, row: 29 },
  { tile: "coffee", col: 47, row: 29 },
  { tile: "mat", col: 1, row: 32 },
  { tile: "mat", col: 2, row: 32 },
];

// Extra solid rect for the coffee machines (they sit above the station).
export const COFFEE_BLOCKER = { x: 920, y: 580, w: 40, h: 40 };

// Rug area under the meeting table (cell range, ends exclusive).
export const RUG = { c0: 42, c1: 50, r0: 19, r1: 23 };

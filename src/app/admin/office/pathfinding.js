/**
 * pathfinding.js
 *
 * Grid-based A* pathfinding for the PixiJS v8 office-floor scene.
 *
 * World model:
 *   - Pixel-space world is 1100 x 680.
 *   - Cells are TILE x TILE pixels (20px), giving 55 columns x 34 rows.
 *   - Blocker rects (pixel space) are rasterized to solid cells: a cell is
 *     solid iff its CENTER lies inside any blocker rect.
 *   - The outermost ring of cells is always solid (world border).
 *
 * Public API:
 *   makeGrid(blockers)                  -> opaque grid object
 *   findPath(grid, startX, startY, endX, endY)
 *                                       -> [{x,y}, ...] pixel waypoints
 *                                          (cell centers) including start and
 *                                          end, or null if no path exists
 *   __selftest()                        -> true/false (never throws)
 */

export const TILE = 20;

/** World width in pixels. @type {number} */
const WORLD_WIDTH = 1100;
/** World height in pixels. @type {number} */
const WORLD_HEIGHT = 680;
/** Grid width in cells. @type {number} */
const COLS = WORLD_WIDTH / TILE; // 55
/** Grid height in cells. @type {number} */
const ROWS = WORLD_HEIGHT / TILE; // 34

/** 4-directional movement offsets. @type {Array<[number, number]>} */
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Build a navigation grid from pixel-space blocker rects.
 *
 * @param {Array<{x:number, y:number, w:number, h:number}>} blockers
 *        Rects in pixel space that must be avoided. May be empty/null.
 * @returns {{cols:number, rows:number, solid:Uint8Array}}
 *          Opaque grid object (1 = solid cell, 0 = free).
 */
export function makeGrid(blockers) {
  const solid = new Uint8Array(COLS * ROWS);

  // Outermost cell ring is always solid (world border).
  for (let x = 0; x < COLS; x++) {
    solid[x] = 1;
    solid[(ROWS - 1) * COLS + x] = 1;
  }
  for (let y = 0; y < ROWS; y++) {
    solid[y * COLS] = 1;
    solid[y * COLS + COLS - 1] = 1;
  }

  // Rasterize blockers: a cell is solid iff its center lies inside the rect.
  const list = Array.isArray(blockers) ? blockers : [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    const minX = b.x;
    const maxX = b.x + b.w;
    const minY = b.y;
    const maxY = b.y + b.h;
    for (let cy = 0; cy < ROWS; cy++) {
      const centerY = cy * TILE + TILE / 2;
      if (centerY < minY || centerY >= maxY) continue;
      for (let cx = 0; cx < COLS; cx++) {
        const centerX = cx * TILE + TILE / 2;
        if (centerX >= minX && centerX < maxX) {
          solid[cy * COLS + cx] = 1;
        }
      }
    }
  }

  return { cols: COLS, rows: ROWS, solid };
}

/**
 * Convert pixel coordinates to a cell index pair, clamped into the world.
 *
 * @param {number} x Pixel x.
 * @param {number} y Pixel y.
 * @returns {{cx:number, cy:number}} Cell indices.
 */
function pixelToCell(x, y) {
  const cx = Math.min(COLS - 1, Math.max(0, Math.floor(x / TILE)));
  const cy = Math.min(ROWS - 1, Math.max(0, Math.floor(y / TILE)));
  return { cx, cy };
}

/**
 * Pixel-space center x of a cell column.
 * @param {number} cx Cell column index.
 * @returns {number}
 */
function cellCenterX(cx) {
  return cx * TILE + TILE / 2;
}

/**
 * Pixel-space center y of a cell row.
 * @param {number} cy Cell row index.
 * @returns {number}
 */
function cellCenterY(cy) {
  return cy * TILE + TILE / 2;
}

/**
 * Solid test for a cell.
 *
 * @param {{cols:number, rows:number, solid:Uint8Array}} grid Grid object.
 * @param {number} cx Cell column index.
 * @param {number} cy Cell row index.
 * @returns {boolean} True when the cell is blocked.
 */
function isSolid(grid, cx, cy) {
  return grid.solid[cy * grid.cols + cx] === 1;
}

/**
 * Find the nearest free cell to (cx, cy) by expanding square rings outward.
 * Deterministic; used to clamp start/end points that fall inside blockers.
 *
 * @param {{cols:number, rows:number, solid:Uint8Array}} grid Grid object.
 * @param {number} cx Cell column index.
 * @param {number} cy Cell row index.
 * @returns {{cx:number, cy:number}|null} Nearest free cell, or null when the
 *          entire grid is solid.
 */
function nearestFreeCell(grid, cx, cy) {
  const maxR = Math.max(grid.cols, grid.rows);
  for (let r = 0; r <= maxR; r++) {
    const x0 = cx - r;
    const x1 = cx + r;
    const y0 = cy - r;
    const y1 = cy + r;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        // For r > 0 only visit the new ring perimeter, not the interior.
        if (r > 0 && x > x0 && x < x1 && y > y0 && y < y1) continue;
        if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) continue;
        if (!isSolid(grid, x, y)) return { cx: x, cy: y };
      }
    }
  }
  return null;
}

/**
 * Manhattan distance heuristic (admissible for 4-directional cost-1 steps).
 *
 * @param {number} ax From-cell column.
 * @param {number} ay From-cell row.
 * @param {number} bx To-cell column.
 * @param {number} by To-cell row.
 * @returns {number}
 */
function heuristic(ax, ay, bx, by) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

/**
 * Reconstruct the cell path from the parent map.
 *
 * @param {Int32Array} parent came-from cell index per cell (-1 for start).
 * @param {number} endIdx Goal cell index.
 * @param {number} cols Grid width in cells.
 * @returns {Array<[number, number]>} Cell coords ordered start -> end.
 */
function reconstruct(parent, endIdx, cols) {
  const cells = [];
  let cur = endIdx;
  while (cur !== -1) {
    const cx = cur % cols;
    cells.push([cx, (cur - cx) / cols]);
    cur = parent[cur];
  }
  cells.reverse();
  return cells;
}

/**
 * 4-directional A* on the cell grid (cost 1 per step).
 *
 * ponytail: open list uses a linear scan for the min-f node instead of a
 * binary heap. Fine at 55x34 = 1870 cells; swap in a heap only if the world
 * grows orders of magnitude larger.
 *
 * @param {{cols:number, rows:number, solid:Uint8Array}} grid Grid object.
 * @param {{cx:number, cy:number}} start Start cell (must be free).
 * @param {{cx:number, cy:number}} end End cell (must be free).
 * @returns {Array<[number, number]>|null} Cell coords start -> end, or null
 *          when no path exists.
 */
function astar(grid, start, end) {
  const n = grid.cols * grid.rows;
  const g = new Float64Array(n).fill(Infinity);
  const f = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);

  const startIdx = start.cy * grid.cols + start.cx;
  const endIdx = end.cy * grid.cols + end.cx;

  g[startIdx] = 0;
  f[startIdx] = heuristic(start.cx, start.cy, end.cx, end.cy);

  // Open list of candidate cell indices; pop scans for the lowest f score.
  const open = [startIdx];

  while (open.length > 0) {
    let bestPos = 0;
    for (let i = 1; i < open.length; i++) {
      if (f[open[i]] < f[open[bestPos]]) bestPos = i;
    }
    const cur = open[bestPos];
    open[bestPos] = open[open.length - 1];
    open.pop();

    if (cur === endIdx) return reconstruct(parent, cur, grid.cols);

    closed[cur] = 1;

    const cx = cur % grid.cols;
    const cy = (cur - cx) / grid.cols;

    for (let d = 0; d < DIRS.length; d++) {
      const nx = cx + DIRS[d][0];
      const ny = cy + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= grid.cols || ny >= grid.rows) continue;
      const nIdx = ny * grid.cols + nx;
      if (closed[nIdx] || isSolid(grid, nx, ny)) continue;

      const tentativeG = g[cur] + 1;
      if (tentativeG < g[nIdx]) {
        g[nIdx] = tentativeG;
        parent[nIdx] = cur;
        f[nIdx] = tentativeG + heuristic(nx, ny, end.cx, end.cy);
        if (open.indexOf(nIdx) === -1) open.push(nIdx);
      }
    }
  }

  return null;
}

/**
 * Merge consecutive collinear waypoints so straight runs become single
 * segments, keeping corner points and both endpoints. Works purely along
 * grid lines (no diagonal corner cutting), so it stays safe with respect to
 * solid cells.
 *
 * @param {Array<[number, number]>} cells Cell coords start -> end.
 * @returns {Array<[number, number]>} Reduced waypoint list (>= 2 entries).
 */
function mergeCollinear(cells) {
  if (cells.length <= 2) return cells.slice();
  const out = [cells[0]];
  for (let i = 1; i < cells.length - 1; i++) {
    const prev = out[out.length - 1];
    const mid = cells[i];
    const next = cells[i + 1];
    const collinear =
      (prev[0] === mid[0] && mid[0] === next[0]) ||
      (prev[1] === mid[1] && mid[1] === next[1]);
    if (!collinear) out.push(mid);
  }
  out.push(cells[cells.length - 1]);
  return out;
}

/**
 * Find a walkable path between two pixel-space points.
 *
 * Start/end that fall inside a blocker are clamped to the nearest free cell
 * first. Returns waypoints in PIXEL space (cell centers), including the start
 * and end points, or null when no path exists.
 *
 * @param {{cols:number, rows:number, solid:Uint8Array}} grid Grid from makeGrid.
 * @param {number} startX Start x in pixels.
 * @param {number} startY Start y in pixels.
 * @param {number} endX End x in pixels.
 * @param {number} endY End y in pixels.
 * @returns {Array<{x:number, y:number}>|null} Waypoints or null.
 */
export function findPath(grid, startX, startY, endX, endY) {
  if (!grid || !grid.solid) return null;
  if (![startX, startY, endX, endY].every(Number.isFinite)) return null;

  const s0 = pixelToCell(startX, startY);
  const e0 = pixelToCell(endX, endY);

  const start = isSolid(grid, s0.cx, s0.cy) ? nearestFreeCell(grid, s0.cx, s0.cy) : s0;
  const end = isSolid(grid, e0.cx, e0.cy) ? nearestFreeCell(grid, e0.cx, e0.cy) : e0;
  if (!start || !end) return null;

  // Same resolved cell: straight shot, just report both endpoints.
  if (start.cx === end.cx && start.cy === end.cy) {
    return [
      { x: cellCenterX(start.cx), y: cellCenterY(start.cy) },
      { x: cellCenterX(end.cx), y: cellCenterY(end.cy) },
    ];
  }

  const cells = astar(grid, start, end);
  if (!cells) return null;

  const corners = mergeCollinear(cells);
  return corners.map((c) => ({ x: cellCenterX(c[0]), y: cellCenterY(c[1]) }));
}

/**
 * Built-in smoke test: builds a grid with one blocker rect
 * {x:100,y:100,w:200,h:60}, paths from (50,550) to (500,130), and checks:
 *   - result is a non-empty array,
 *   - it starts near (50,550) and ends near (500,130),
 *   - no intermediate waypoint's containing cell is solid.
 *
 * Never throws; returns true on success, false otherwise.
 *
 * @returns {boolean}
 */
export function __selftest() {
  try {
    const grid = makeGrid([{ x: 100, y: 100, w: 200, h: 60 }]);

    const sx = 50;
    const sy = 550;
    const ex = 500;
    const ey = 130;

    const path = findPath(grid, sx, sy, ex, ey);
    if (!Array.isArray(path) || path.length === 0) return false;

    const tol = TILE; // one cell of slack for clamped/center-snapped points

    const first = path[0];
    const last = path[path.length - 1];
    if (Math.abs(first.x - sx) > tol || Math.abs(first.y - sy) > tol) return false;
    if (Math.abs(last.x - ex) > tol || Math.abs(last.y - ey) > tol) return false;

    for (let i = 1; i < path.length - 1; i++) {
      const p = path[i];
      const cx = Math.floor(p.x / TILE);
      const cy = Math.floor(p.y / TILE);
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
      if (isSolid(grid, cx, cy)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/*
 * ---------------------------------------------------------------------------
 * How to run the self-test (from the agency-frontend directory):
 *
 *   node --input-type=module -e "import('./src/app/admin/office/pathfinding.js').then(m=>console.log('SELFTEST:',m.__selftest()))"
 *
 * Expected output:  SELFTEST: true
 * ---------------------------------------------------------------------------
 */

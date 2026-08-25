// src/app/admin/office/rooms.js
// World layout for the Munder-style TAGS Agency office floor.
// Pure data: the scene (OfficeFloor) reads these to draw rooms and to place
// desks / stations. Characters walk between these coordinates.

export const WORLD = { w: 1100, h: 680 };

// Rooms are drawn as filled rectangles with a label + divider walls.
export const ROOMS = [
  { id: "main",    x: 0,   y: 0,   w: 760, h: 680, label: "Open Office",      fill: 0x14181f, labelColor: 0x6b7686 },
  { id: "ceo",     x: 760, y: 0,   w: 340, h: 340, label: "Michael's Office", fill: 0x1b1d12, labelColor: 0xf4d35e },
  { id: "meeting", x: 760, y: 340, w: 340, h: 170, label: "Meeting Room",     fill: 0x121b1b, labelColor: 0x5fd0c5 },
  { id: "cafe",    x: 760, y: 510, w: 340, h: 170, label: "Cafeteria",        fill: 0x1a141b, labelColor: 0xd98cff },
];

// Shared stations characters walk to (besides their own desk).
export const STATIONS = {
  entrance:  { x: 44,  y: 648, label: "Entrance" },
  cafeteria: { x: 940, y: 600, label: "Coffee" },
  meeting:   { x: 930, y: 425, label: "Table" },
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

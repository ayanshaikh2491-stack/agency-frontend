// src/app/admin/office/cast.js
// Cast roster for the Munder-style agency office floor.
// A CastMember is a plain JS object:
//   { id, displayName, isGod, shirt, blurb, desk: { x, y } }
// Desk coordinates match the room layout in rooms.js
// (Michael sits in his own office; the rest in the open office).

export const OFFICE_CAST = [
  { id: "michael",  displayName: "Michael",  isGod: true,  shirt: "#f4d35e", blurb: "CEO — the only boss entry point", desk: { x: 1040, y: 200 }, spriteRow: 0 },
  { id: "sba",      displayName: "SBA",      isGod: false, shirt: "#4ea1ff", blurb: "Lead → Email → Meeting",          desk: { x: 200, y: 480 }, spriteRow: 1 },
  { id: "seo",      displayName: "SEO",      isGod: false, shirt: "#6e1423", blurb: "Technical + on-page SEO",         desk: { x: 400, y: 480 }, spriteRow: 2 },
  { id: "website",  displayName: "Website",  isGod: false, shirt: "#6e1423", blurb: "Design, build, host",            desk: { x: 600, y: 480 }, spriteRow: 3 },
  { id: "ads",      displayName: "Ads",      isGod: false, shirt: "#6e1423", blurb: "Meta + Google Ads",              desk: { x: 800, y: 480 }, spriteRow: 4 },
  { id: "content",  displayName: "Content",  isGod: false, shirt: "#232a33", blurb: "Visual execution",               desk: { x: 200, y: 700 }, spriteRow: 5 },
  { id: "social",   displayName: "Social",   isGod: false, shirt: "#232a33", blurb: "Social strategy",                desk: { x: 400, y: 700 }, spriteRow: 6 },
  { id: "analytics",displayName: "Analytics",isGod: false, shirt: "#232a33", blurb: "Performance + reporting",       desk: { x: 1000, y: 620 }, spriteRow: 7 },
];

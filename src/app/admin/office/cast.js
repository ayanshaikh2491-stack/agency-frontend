// src/app/admin/office/cast.js
// Cast roster for the Munder-style agency office floor.
// A CastMember is a plain JS object:
//   { id, displayName, isGod, shirt, blurb, desk: { x, y } }

export const OFFICE_CAST = [
  { id: "michael",  displayName: "Michael",  isGod: true,  shirt: "#f4d35e", blurb: "CEO — the only boss entry point", desk: { x: 400, y: 300 } },
  { id: "sba",      displayName: "SBA",      isGod: false, shirt: "#4ea1ff", blurb: "Lead → Email → Meeting",          desk: { x: 150, y: 150 } },
  { id: "seo",      displayName: "SEO",      isGod: false, shirt: "#6e1423", blurb: "Technical + on-page SEO",         desk: { x: 650, y: 150 } },
  { id: "website",  displayName: "Website",  isGod: false, shirt: "#6e1423", blurb: "Design, build, host",            desk: { x: 150, y: 450 } },
  { id: "ads",      displayName: "Ads",      isGod: false, shirt: "#6e1423", blurb: "Meta + Google Ads",              desk: { x: 650, y: 450 } },
  { id: "content",  displayName: "Content",  isGod: false, shirt: "#232a33", blurb: "Visual execution",               desk: { x: 250, y: 300 } },
  { id: "social",   displayName: "Social",   isGod: false, shirt: "#232a33", blurb: "Social strategy",                desk: { x: 550, y: 300 } },
  { id: "analytics",displayName: "Analytics",isGod: false, shirt: "#232a33", blurb: "Performance + reporting",       desk: { x: 400, y: 120 } },
];

export const CAST_BY_NAME =
  Object.fromEntries(OFFICE_CAST.map((c) => [c.id, c]));

export function hexToNumber(hex) {
  return parseInt(hex.replace("#", ""), 16);
}

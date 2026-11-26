// Geometry check for the homepage scatter field.
//
// Mirrors the pure math in lib/scatter.ts and the home positions seeded in
// scripts/seed.js. Keep all three in sync:
//   - lib/scatter.ts          runtime geometry used by the app
//   - scripts/seed.js         home_x / home_y / home_rot per product
//   - scripts/test-scatter.js this file
//
// Run with: npm run test:scatter
//
// Verifies the settled (home) layout only: products stay inside the field,
// within the tilt limit, and never overlap or stack (SRS 4.3 / 29). Also
// sanity-checks the deterministic entrance displacement.

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 1250;
const CARD_WIDTH_PCT = 24;
const CARD_ASPECT = 3 / 4;
const DISPLACE_MIN = 120;
const DISPLACE_MAX = 300;
const DISPLACE_ROT = 20;
const HOME_ROT_MAX = 8;
const GAP = 8; // required breathing room between home cards, in field px

// --- mirrored from lib/scatter.ts -------------------------------------------
function hashId(id) {
  let h = 0x811c9dc5;
  const s = String(id);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function displacedFor(id, homeX, homeY) {
  const homePxX = (homeX / 100) * FIELD_WIDTH;
  const homePxY = (homeY / 100) * FIELD_HEIGHT;
  let dx = homePxX - FIELD_WIDTH / 2;
  let dy = homePxY - FIELD_HEIGHT / 2;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  const rand = mulberry32(hashId(id));
  const distance = DISPLACE_MIN + rand() * (DISPLACE_MAX - DISPLACE_MIN);
  const rot = (rand() * 2 - 1) * DISPLACE_ROT;
  return {
    x: Math.round(dx * distance),
    y: Math.round(dy * distance),
    rot: Math.round(rot),
  };
}

function cardSize() {
  const width = (CARD_WIDTH_PCT / 100) * FIELD_WIDTH;
  return { width, height: width / CARD_ASPECT };
}

function homeAabb(p) {
  const { width, height } = cardSize();
  const cx = (p.homeX / 100) * FIELD_WIDTH;
  const cy = (p.homeY / 100) * FIELD_HEIGHT;
  return {
    minX: cx - width / 2,
    minY: cy - height / 2,
    maxX: cx + width / 2,
    maxY: cy + height / 2,
  };
}

function expanded(a, g) {
  return {
    minX: a.minX - g / 2,
    minY: a.minY - g / 2,
    maxX: a.maxX + g / 2,
    maxY: a.maxY + g / 2,
  };
}

function overlap(a, b) {
  return (
    a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
  );
}

// --- mirrored from scripts/seed.js (id, name, home_x, home_y, home_rot) ------
// 6 products with show_on_home = 1
// Positions for CARD_WIDTH_PCT=20 (card ~20% x 26.7% of field)
// Tighter two-column layout: left column x~22%, right column x~68%
// Vertical: both columns at 14%, 42%, 66% (24-28% gaps > card 267 + GAP 8)
const products = [
  { id: 1, name: "Bone Signet Ring", homeX: 22, homeY: 16, homeRot: -6 },
  { id: 2, name: "Thorn Band Ring", homeX: 68, homeY: 20, homeRot: 5 },
  { id: 3, name: "Oath Chain Bracelet", homeX: 24, homeY: 43, homeRot: 4 },
  { id: 4, name: "Widow's Web Bracelet", homeX: 68, homeY: 47, homeRot: -5 },
  { id: 5, name: "Reliquary Pendant", homeX: 20, homeY: 70, homeRot: -4 },
  { id: 6, name: "Hollow Cross Necklace", homeX: 66, homeY: 74, homeRot: 6 },
];

let failures = 0;
function check(name, cond, detail) {
  const line = "  " + (cond ? "PASS" : "FAIL") + " " + name +
    (detail ? " - " + detail : "");
  if (cond) {
    console.log(line);
  } else {
    failures += 1;
    console.error(line);
  }
}

// 1. Home positions and tilt are in range.
for (const p of products) {
  const inRange =
    p.homeX >= 0 && p.homeX <= 100 && p.homeY >= 0 && p.homeY <= 100;
  check("home in range " + p.id, inRange, "(" + p.homeX + ", " + p.homeY + ")");
  check(
    "tilt <= " + HOME_ROT_MAX + "deg " + p.id,
    Math.abs(p.homeRot) <= HOME_ROT_MAX,
    p.homeRot + "deg",
  );
}

// 2. Home cards stay fully inside the field.
for (const p of products) {
  const b = homeAabb(p);
  const inside =
    b.minX >= 0 && b.minY >= 0 && b.maxX <= FIELD_WIDTH && b.maxY <= FIELD_HEIGHT;
  check(
    "card in field " + p.id,
    inside,
    "x[" + b.minX.toFixed(0) + "," + b.maxX.toFixed(0) + "] y[" +
      b.minY.toFixed(0) + "," + b.maxY.toFixed(0) + "]",
  );
}

// 3. No two home cards overlap (with a safety gap so they stay clickable).
for (let i = 0; i < products.length; i += 1) {
  for (let j = i + 1; j < products.length; j += 1) {
    const a = expanded(homeAabb(products[i]), GAP);
    const b = expanded(homeAabb(products[j]), GAP);
    check(
      "no overlap " + products[i].id + "/" + products[j].id,
      !overlap(a, b),
    );
  }
}

// 4. Entrance displacement is deterministic and within limits.
for (const p of products) {
  const d1 = displacedFor(p.id, p.homeX, p.homeY);
  const d2 = displacedFor(p.id, p.homeX, p.homeY);
  const dist = Math.hypot(d1.x, d1.y);
  check(
    "displace deterministic " + p.id,
    d1.x === d2.x && d1.y === d2.y && d1.rot === d2.rot,
  );
  check(
    "displace distance " + p.id,
    dist >= DISPLACE_MIN - 2 && dist <= DISPLACE_MAX + 2,
    dist.toFixed(0) + "px",
  );
  check(
    "displace rotation " + p.id,
    Math.abs(d1.rot) <= DISPLACE_ROT,
    d1.rot + "deg",
  );
}

console.log("");
if (failures === 0) {
  console.log("scatter geometry: all checks passed (" + products.length + " cards)");
  process.exit(0);
} else {
  console.error("scatter geometry: " + failures + " check(s) failed");
  process.exit(1);
}
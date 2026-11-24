// Homepage scatter-field geometry.
//
// Pure, deterministic helpers shared by the server page, the client entrance
// animation (components/ScatterField.tsx) and the geometry check
// (scripts/test-scatter.js, which mirrors this math).
//
// Keep the geometry in sync between lib/scatter.ts and scripts/test-scatter.js.

// The field is an art-directed portrait canvas. Positions are stored as
// percentages of this field so they scale with the rendered size.
export const FIELD_WIDTH = 1000;
export const FIELD_HEIGHT = 1250;
export const FIELD_ASPECT = FIELD_WIDTH / FIELD_HEIGHT; // width / height (0.8)

// Each product card is 15% of the field width, portrait 3:4.
export const CARD_WIDTH_PCT = 15;
export const CARD_ASPECT = 3 / 4; // width / height

// Entrance "throw": cards start this far (in field px) outside their home spot
// and tilted, then spring back to their fixed home position.
export const DISPLACE_MIN = 120;
export const DISPLACE_MAX = 300;
export const DISPLACE_ROT = 20; // +/- degrees

// Home tilt is clamped to this range (degrees). SRS 4.3: controlled tilt,
// products never upside down or sideways.
export const HOME_ROT_MAX = 8;

export type HomeProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  homeX: number; // percent of field width, 0-100
  homeY: number; // percent of field height, 0-100
  homeRot: number; // degrees
};

export type Displaced = {
  x: number; // px offset from home
  y: number; // px offset from home
  rot: number; // degrees
};

export type Aabb = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const round = (n: number): number => Math.round(n);

// FNV-1a 32-bit hash of the product id. Deterministic across server and client
// (no Math.random), so the server-rendered markup and the hydrated markup match.
export function hashId(id: number): number {
  let h = 0x811c9dc5;
  const s = String(id);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Mulberry32 PRNG seeded from the id hash. Returns floats in [0, 1).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Where a card starts before it is thrown home: pushed radially outward from
// the field centre and tilted, derived deterministically from its id.
export function displacedFor(
  id: number,
  homeX: number,
  homeY: number,
): Displaced {
  const homePxX = (homeX / 100) * FIELD_WIDTH;
  const homePxY = (homeY / 100) * FIELD_HEIGHT;

  // Unit vector pointing from the field centre to the home position.
  let dx = homePxX - FIELD_WIDTH / 2;
  let dy = homePxY - FIELD_HEIGHT / 2;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;

  const rand = mulberry32(hashId(id));
  const distance = DISPLACE_MIN + rand() * (DISPLACE_MAX - DISPLACE_MIN);
  const rot = (rand() * 2 - 1) * DISPLACE_ROT;

  return {
    x: round(dx * distance),
    y: round(dy * distance),
    rot: round(rot),
  };
}

// Card size in field pixels.
export function cardSize(): { width: number; height: number } {
  const width = (CARD_WIDTH_PCT / 100) * FIELD_WIDTH;
  const height = width / CARD_ASPECT;
  return { width, height };
}

// Axis-aligned bounding box for a card centred on (cx, cy) in field pixels.
export function cardAabb(cx: number, cy: number): Aabb {
  const { width, height } = cardSize();
  return {
    minX: cx - width / 2,
    minY: cy - height / 2,
    maxX: cx + width / 2,
    maxY: cy + height / 2,
  };
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return (
    a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY
  );
}
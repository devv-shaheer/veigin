// Grey grain drawn at 1:1 (never scaled), blended with "overlay" so it
// adds speckle without lifting the base color.
const noise = (size: number, freq: number, octaves: number, gain: number) => {
  const c = (gain / 3).toFixed(3);
  const o = (0.5 * (1 - gain)).toFixed(3);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='n' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='matrix' values='${c} ${c} ${c} 0 ${o}  ${c} ${c} ${c} 0 ${o}  ${c} ${c} ${c} 0 ${o}  0 0 0 0 1'/>` +
    `</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

// Fine speckle and big soft dirty patches.
const FINE = noise(256, 0.85, 2, 1.8);
const DIRT = noise(1024, 0.006, 3, 2.6);

const layer = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 45,
  pointerEvents: "none" as const,
  mixBlendMode: "overlay" as const,
};

export default function GrainOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          ...layer,
          backgroundImage: DIRT,
          backgroundSize: "1024px 1024px",
          opacity: 0.3,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...layer,
          backgroundImage: FINE,
          backgroundSize: "256px 256px",
          opacity: 0.62,
        }}
      />
    </>
  );
}

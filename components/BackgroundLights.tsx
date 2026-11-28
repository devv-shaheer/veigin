
type Light = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  glow: number;
  glint?: boolean;
};

const LIGHTS: Light[] = [
  // Main crimson pinpoints
  { x: 4, y: 12, size: 1.8, opacity: 0.55, glow: 9 },
  { x: 9, y: 38, size: 2, opacity: 0.75, glow: 12, glint: true },
  { x: 13, y: 71, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 16, y: 19, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 21, y: 53, size: 1.8, opacity: 0.5, glow: 10 },
  { x: 26, y: 88, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 31, y: 7, size: 2, opacity: 0.7, glow: 13, glint: true },
  { x: 36, y: 62, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 43, y: 92, size: 1.8, opacity: 0.5, glow: 10 },
  { x: 48, y: 76, size: 2, opacity: 0.7, glow: 13, glint: true },
  { x: 55, y: 58, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 58, y: 5, size: 1.8, opacity: 0.55, glow: 10 },
  { x: 64, y: 26, size: 2, opacity: 0.75, glow: 14, glint: true },
  { x: 70, y: 69, size: 1.8, opacity: 0.45, glow: 9 },
  { x: 75, y: 94, size: 1.8, opacity: 0.5, glow: 10 },
  { x: 81, y: 56, size: 2, opacity: 0.65, glow: 12, glint: true },
  { x: 84, y: 22, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 89, y: 9, size: 2, opacity: 0.65, glow: 13, glint: true },
  { x: 93, y: 66, size: 2, opacity: 0.75, glow: 14, glint: true },
  { x: 97, y: 87, size: 1.8, opacity: 0.4, glow: 9 },

  // Additional faint crimson dust
  { x: 7, y: 24, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 11, y: 56, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 18, y: 42, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 23, y: 15, size: 2, opacity: 0.4, glow: 10 },
  { x: 29, y: 67, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 34, y: 35, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 38, y: 84, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 44, y: 54, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 47, y: 9, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 53, y: 89, size: 1.6, opacity: 0.3, glow: 8 },
  { x: 56, y: 29, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 62, y: 63, size: 1.6, opacity: 0.35, glow: 8 },
  { x: 66, y: 14, size: 2, opacity: 0.35, glow: 10 },
  { x: 71, y: 82, size: 1.6, opacity: 0.3, glow: 8 },
  { x: 77, y: 27, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 79, y: 73, size: 1.6, opacity: 0.35, glow: 8 },
  { x: 83, y: 47, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 87, y: 95, size: 1.6, opacity: 0.3, glow: 8 },
  { x: 92, y: 18, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 95, y: 52, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 5, y: 82, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 15, y: 92, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 27, y: 47, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 32, y: 11, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 40, y: 73, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 51, y: 39, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 59, y: 96, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 69, y: 55, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 76, y: 7, size: 1.8, opacity: 0.35, glow: 9 },
  { x: 85, y: 62, size: 1.8, opacity: 0.3, glow: 9 },
  { x: 90, y: 39, size: 1.8, opacity: 0.4, glow: 9 },
  { x: 98, y: 74, size: 1.6, opacity: 0.3, glow: 8 },
];

export default function BackgroundLights() {
  return (
    <div
      aria-hidden="true"
      style={{
      position: "absolute",
inset: 0,               
zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {LIGHTS.map((light, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${light.x}%`,
            top: `${light.y}%`,
            width: light.glow,
            height: light.glow,
            transform: "translate(-50%, -50%)",
            opacity: light.opacity,
            backgroundImage: [
              `radial-gradient(circle, rgba(223,25,63,0.35) 0%, rgba(223,25,63,0.08) 35%, transparent 70%)`,
              `radial-gradient(circle, rgba(223,25,63,1) 0%, rgba(223,25,63,0.6) 20%, transparent 65%)`,
              ...(light.glint
                ? [
                    `linear-gradient(to right, transparent, rgba(223,25,63,0.5), transparent)`,
                    `linear-gradient(to bottom, transparent, rgba(223,25,63,0.5), transparent)`,
                  ]
                : []),
            ].join(", "),
            backgroundSize: [
              "100% 100%",
              `${light.size}px ${light.size}px`,
              ...(light.glint ? ["9px 1px", "1px 9px"] : []),
            ].join(", "),
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(0.1px)",
          }}
        />
      ))}
    </div>
  );
}

import { Pirata_One, Grenze_Gotisch, New_Rocker, Jacquard_24, UnifrakturCook, Lora, DM_Serif_Display } from "next/font/google";

const pirataOne = Pirata_One({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-pirata-one" });
const grenzeGotisch = Grenze_Gotisch({ weight: ["700", "900"], subsets: ["latin"], display: "swap", variable: "--font-grenze-gotisch" });
const newRocker = New_Rocker({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-new-rocker" });
const jacquard24 = Jacquard_24({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-jacquard-24" });
const unifrakturCook = UnifrakturCook({ weight: "700", subsets: ["latin"], display: "swap", variable: "--font-unifraktur-cook" });
const lora = Lora({ weight: ["400", "500", "600", "700"], subsets: ["latin"], display: "swap", variable: "--font-lora" });
const dmSerifDisplay = DM_Serif_Display({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-dm-serif-display" });

const fonts = [
  {
    name: "Pirata One",
    variable: pirataOne.variable,
    className: pirataOne.className,
    weights: ["400"],
  },
  {
    name: "Grenze Gotisch",
    variable: grenzeGotisch.variable,
    className: grenzeGotisch.className,
    weights: ["700", "900"],
  },
  {
    name: "New Rocker",
    variable: newRocker.variable,
    className: newRocker.className,
    weights: ["400"],
  },
  {
    name: "Jacquard 24",
    variable: jacquard24.variable,
    className: jacquard24.className,
    weights: ["400"],
  },
  {
    name: "UnifrakturCook (current)",
    variable: unifrakturCook.variable,
    className: unifrakturCook.className,
    weights: ["700"],
  },
];

const readableFonts = [
  {
    name: "Lora (serif, readable at small sizes)",
    variable: lora.variable,
    className: lora.className,
    weights: ["400", "500", "600", "700"],
  },
  {
    name: "DM Serif Display (elegant serif for names)",
    variable: dmSerifDisplay.variable,
    className: dmSerifDisplay.className,
    weights: ["400"],
  },
];

const samples = [
  { text: "Wear the dark.", size: "96px", label: "Hero headline" },
  { text: "Bone Signet Ring", size: "28px", label: "Product name (card)" },
  { text: "Bone Signet Ring", size: "18px", label: "Product name (small)" },
  { text: "PKR 1,200", size: "28px", label: "Price" },
];

export default function DevFontsPage() {
  return (
    <html lang="en" className={`${pirataOne.variable} ${grenzeGotisch.variable} ${newRocker.variable} ${jacquard24.variable} ${unifrakturCook.variable} ${lora.variable} ${dmSerifDisplay.variable}`}>
      <body className="min-h-screen bg-page text-bone p-10 font-mono">
        <div className="mx-auto max-w-[1400px]">
          <header className="mb-12">
            <h1 className="font-heading text-5xl tracking-[0.03em] text-bone mb-2 sm:text-6xl">Font Development Test Page<span className="text-accent" aria-hidden="true">.</span></h1>
            <p className="text-silver text-sm">Background: #222220 | Text: #d9d6cf | Temporary route: /dev/fonts</p>
          </header>

          <section className="mb-16">
            <h2 className="font-display text-2xl text-crimson-bright mb-6 uppercase tracking-[0.1em]">Blackletter / Gothic Candidates</h2>
            <div className="space-y-12">
              {fonts.map((font) => (
                <div key={font.name} className="border border-silver/15 bg-panel p-6 rounded-none">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-bright">{font.name}</h3>
                    <span className="text-silver/50 text-xs">Weights: {font.weights.join(", ")}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {samples.map((sample) => (
                      <div key={`${font.name}-${sample.size}`} className="bg-page p-4 border border-silver/10">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-silver/50 mb-2">{sample.label}</p>
                        <p className={font.className} style={{ fontSize: sample.size, lineHeight: 1.1 }}>
                          {sample.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="font-display text-2xl text-crimson-bright mb-6 uppercase tracking-[0.1em]">Readable Serif Candidates (for small product names)</h2>
            <div className="space-y-12">
              {readableFonts.map((font) => (
                <div key={font.name} className="border border-silver/15 bg-panel p-6 rounded-none">
                  <div className="flex items-center gap-4 mb-6">
                    <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-bright">{font.name}</h3>
                    <span className="text-silver/50 text-xs">Weights: {font.weights.join(", ")}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {samples.slice(1).map((sample) => (
                      <div key={`${font.name}-${sample.size}`} className="bg-page p-4 border border-silver/10">
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-silver/50 mb-2">{sample.label}</p>
                        <p className={font.className} style={{ fontSize: sample.size, lineHeight: 1.1 }}>
                          {sample.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-crimson-bright mb-6 uppercase tracking-[0.1em]">Comparison: Current Blackletter vs Readable at Small Sizes</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-panel p-6 border border-silver/15">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-bright mb-4">UnifrakturCook (current blackletter)</h3>
                <div className="space-y-3">
                  <p className="font-display text-4xl text-bone">Wear the dark.</p>
                  <p className="font-display text-xl text-bone">Bone Signet Ring</p>
                  <p className="font-display text-base text-bone">Bone Signet Ring</p>
                  <p className="font-display text-sm text-bone">Bone Signet Ring</p>
                  <p className="font-display text-xl text-crimson-bright">PKR 1,200</p>
                </div>
              </div>
              <div className="bg-panel p-6 border border-silver/15">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-crimson-bright mb-4">Lora (readable serif candidate)</h3>
                <div className="space-y-3">
                  <p className={lora.className} style={{ fontSize: "48px", lineHeight: 1.1 }}>Wear the dark.</p>
                  <p className={lora.className} style={{ fontSize: "28px", lineHeight: 1.2 }}>Bone Signet Ring</p>
                  <p className={lora.className} style={{ fontSize: "18px", lineHeight: 1.3 }}>Bone Signet Ring</p>
                  <p className={lora.className} style={{ fontSize: "14px", lineHeight: 1.4 }}>Bone Signet Ring</p>
                  <p className="font-display text-xl text-crimson-bright">PKR 1,200</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
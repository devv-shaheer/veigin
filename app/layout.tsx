import type { Metadata } from "next";
import { Poppins, Anton, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

const xizor = localFont({
  src: "./fonts/ShadowofXizor.woff2",
  variable: "--font-xizor",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Veigin",
    template: "%s · Veigin",
  },
  description:
    "Veigin is a gothic and alternative jewellery brand in Pakistan. Rings, bracelets and necklaces for the dark at heart.",
  applicationName: "Veigin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${anton.variable} ${plexMono.variable} ${xizor.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased isolate">
        {children}
      </body>
    </html>
  );
}
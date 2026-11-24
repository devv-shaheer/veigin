import type { Metadata } from "next";
import { Suspense } from "react";
import { UnifrakturCook, Anton, IBM_Plex_Mono } from "next/font/google";
import GrainOverlay from "@/components/GrainOverlay";
import PromoBar, { PromoBarFallback } from "@/components/PromoBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const blackletter = UnifrakturCook({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-unifraktur",
});

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anton",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
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
      className={`${blackletter.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-full antialiased">
        <GrainOverlay />
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<PromoBarFallback />}>
            <PromoBar />
          </Suspense>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
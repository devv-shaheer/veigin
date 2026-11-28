import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins, Anton, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import GrainOverlay from "@/components/GrainOverlay";
import BackgroundLights from "@/components/BackgroundLights";
import PromoBar, { PromoBarFallback } from "@/components/PromoBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
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
        <CartProvider>
          <GrainOverlay />
          <BackgroundLights />
          <div className="relative z-10 flex min-h-screen flex-col">
            <Suspense fallback={<PromoBarFallback />}>
              <PromoBar />
            </Suspense>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
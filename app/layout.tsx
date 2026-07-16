import type { Metadata } from "next";
import { Atkinson_Hyperlegible, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "MedTracker | Family medication care",
  description: "A calm, clear medication schedule for your family.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${atkinson.variable} ${newsreader.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-[15px] text-ink antialiased">{children}</body>
    </html>
  );
}

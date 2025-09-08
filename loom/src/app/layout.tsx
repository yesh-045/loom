import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, DM_Sans, Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import StubSessionProvider from "@/components/SessionProvider"
import { AISettingsProvider } from "@/context/AISettingsContext"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "loom",
  description: "Interactive Chat-Based UI Components for Enhanced Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${outfit.variable} antialiased overflow-x-hidden font-sans`}
      >
        <StubSessionProvider>
          <AISettingsProvider>
            {children}
          </AISettingsProvider>
        </StubSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Manrope } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/app/sw-register";
import OfflineIndicator from "@/app/components/offline-indicator";

const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#111111",
};

export const metadata: Metadata = {
  title: "S2G | Curated Thrift",
  description: "S2G curates premium thrifted streetwear and vintage finds.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "S2G",
    statusBarStyle: "black-translucent",
    startupImage: [],
  },
  icons: {
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full bg-[#111111] text-[#F5F2EC] antialiased">
        {children}
        <OfflineIndicator />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

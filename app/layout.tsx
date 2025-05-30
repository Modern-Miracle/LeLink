import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineStatus } from "@/components/offline-status";

export const metadata: Metadata = {
  title: "LeLink Healthcare",
  description: "Privacy-preserving healthcare data management system",
  generator: "v0.dev",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <OfflineStatus />
        <>{children}</>
      </body>
    </html>
  );
}

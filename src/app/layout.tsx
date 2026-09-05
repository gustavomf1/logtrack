import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "LogTrack — Visão geral", template: "%s | LogTrack" }, description: "Rastreamento de lotes via NFC para logística e almoxarifado industrial.", robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

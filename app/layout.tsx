import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "DomaDrip | XP Farming",
  description: "Passive XP farming for your tokens on Doma Network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0a] selection:bg-blue-500/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

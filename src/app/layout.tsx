import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ryoiki Auth | Premium Minecraft Network",
  description: "Global authentication and cosmetic dashboard for the Ryoiki Client. Manage your skins, capes, and account settings seamlessly.",
  openGraph: {
    title: "Ryoiki Auth",
    description: "Manage your Ryoiki Client account, skins, and cosmetics.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col items-center justify-center bg-black text-white selection:bg-white/20`}>
        {children}
      </body>
    </html>
  );
}

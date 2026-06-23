import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ryoiki Auth",
  description: "Global authentication and cosmetic dashboard for Ryoiki Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center">
        {children}
      </body>
    </html>
  );
}

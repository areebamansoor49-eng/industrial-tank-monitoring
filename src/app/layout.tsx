import "./globals.css";
import type { Metadata } from "next";
import ThemeInit from "@/components/layout/ThemeInit";

export const metadata: Metadata = {
  title: "Industrial Tank Monitoring",
  description: "Industrial tank monitoring and inventory control platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

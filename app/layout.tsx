import "./globals.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobBlocker",
  description: "Permit and inspection tracking for small contractors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

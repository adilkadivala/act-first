import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Act First Ride Assistant",
  description: "A proactive commute assistant that learns routines and suggests rides before you ask."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

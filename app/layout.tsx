import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proactive Assistant",
  description: "A unified proactive assistant that learns ride and food routines, watches live conditions, and acts before the user asks."
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

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lines, The Balls!",
  description:
    "The classic Color Lines puzzle: move a ball, form a line of five, watch it pop.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Lines, The Balls!",
    description:
      "The classic Color Lines puzzle: move a ball, form a line of five, watch it pop.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

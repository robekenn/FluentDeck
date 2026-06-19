import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluentDeck",
  description: "A clean flashcard app for French, Spanish, Hebrew, and more.",
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
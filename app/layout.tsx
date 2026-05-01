import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SehatSathi — Smart Health & Diet Companion",
  description: "Your personal health and diet companion. Medicine info, meal plans, and reminders — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ascendancy | Gamified Productivity",
  description: "Level up your real life by completing tasks and fighting pixel monsters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

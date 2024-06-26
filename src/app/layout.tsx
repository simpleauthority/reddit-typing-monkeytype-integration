import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "r/typing MonkeyType integration",
  description: "Sync your Reddit and MonkeyType accounts for user flairs on r/typing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en">
      <body className={inter.className + " h-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"}>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumo — AI Photoshoot",
  description:
    "Стань звездой. Загрузи селфи — получи фото, которым захочешь поделиться со всем миром.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-base font-sans text-ink">
        {/*
          Responsive shell: full-bleed on phones, a centered 1024px column on
          desktop. Horizontal padding scales up at md/lg so the layout breathes
          on wide screens instead of looking like a phone stuck in the middle.
        */}
        <div className="relative mx-auto flex min-h-dvh w-full max-w-content flex-col bg-base">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

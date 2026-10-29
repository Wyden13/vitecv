import type { Metadata } from "next";
import {
  EB_Garamond,
  Geist,
  Geist_Mono,
  Poppins,
  Source_Serif_4,
} from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { THEME_SCRIPT } from "@/libs/theme";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "viteCV",
  description: "Build, match, and edit your resume.",
};

/**
 * `data-theme` ships as "light" and THEME_SCRIPT rewrites it before the first
 * paint — hence `suppressHydrationWarning`. The server cannot render the real
 * preference: reading it from a cookie under `cacheComponents` would defer
 * `<html>` itself to request time, and no Suspense boundary can wrap an
 * attribute on the document element.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="h-full font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

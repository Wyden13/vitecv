import type { Metadata } from "next";
import {
  EB_Garamond,
  Geist,
  Geist_Mono,
  Poppins,
  Source_Serif_4,
} from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

/**
 * App chrome. Poppins is static on Google Fonts, so the weights the UI actually
 * uses have to be listed: 400 body, 500 `font-medium`, 600 `font-semibold`,
 * 700 `font-bold` (buttons).
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Document templates only — the "Sans" option in the Typeface control. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Document templates only — the "Serif"/"Mixed" options. */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

/** Document templates only — the Garamond offered by the Typeface control. */
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "viteCV",
  description: "Build, match, and edit your resume.",
};

/**
 * Deliberately free of request-time data. Reading the session here would hold
 * every route behind the request and, with `cacheComponents`, fail the build.
 * Session reads live in `libs/dal.ts`, behind a Suspense boundary.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

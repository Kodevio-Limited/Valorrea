import type { Metadata } from "next";
import { Urbanist, Playfair_Display, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Faith Admin — Content & User Management",
  description:
    "Unified admin dashboard for the Adult and Kids faith-based mobile apps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${urbanist.variable} ${playfair.variable} ${manrope.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

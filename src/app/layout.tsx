import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "HaulPass — Digital Freight Documentation",
    template: "%s | HaulPass",
  },
  description:
    "The digital freight documentation platform for modern carriers, drivers, and brokers. Load Passport, document capture, reconciliation, and factoring — all in one place.",
  keywords: [
    "freight documentation",
    "trucking software",
    "BOL",
    "proof of delivery",
    "factoring",
    "carrier software",
  ],
  openGraph: {
    title: "HaulPass — Every Load. Every Document. Every Dollar.",
    description:
      "Digital freight documentation for carriers, drivers, and brokers.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased bg-[#F8FAFC] text-gray-900">
        {children}
      </body>
    </html>
  )
}

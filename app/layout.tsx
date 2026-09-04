import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const description =
  "Create, manage and print quotations, invoices, purchase orders and job delivery reports for Bade Automobile Ltd.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Bade Automobile Documents",
  title: {
    default: "Bade Automobile — Documents",
    template: "%s · Bade Automobile",
  },
  description,
  keywords: [
    "Bade Automobile",
    "auto workshop",
    "quotation",
    "invoice",
    "purchase order",
    "job delivery report",
    "Ogun State",
    "Nigeria",
    "document management",
  ],
  authors: [{ name: "Bade Automobile Ltd" }],
  creator: "Bade Automobile Ltd",
  publisher: "Bade Automobile Ltd",
  // The icon, apple-icon, opengraph-image and twitter-image files in /app are
  // picked up automatically; these add the descriptive fields around them.
  openGraph: {
    type: "website",
    siteName: "Bade Automobile Documents",
    title: "Bade Automobile — Document Management System",
    description,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bade Automobile — Document Management System",
    description,
  },
  // Internal staff tool — keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

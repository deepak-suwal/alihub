import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

// Archivo carries the whole system — 800 for headings, 400/600 for text.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alihub — B2B sourcing for Nepal",
    template: "%s · Alihub",
  },
  description: "Browse millions of Alibaba products priced in NPR and pay with eSewa or Khalti.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <CartProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-content flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}

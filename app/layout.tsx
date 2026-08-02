import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { readDB } from "@/lib/db";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frame by DB | Premium Photography & Cinematography",
  description: "Dasari Bharadwaj, award-winning Director of Photography with 16+ years of experience in luxury weddings, commercials, and corporate events based in Hyderabad, India.",
  icons: {
    icon: "https://res.cloudinary.com/do4nuj2kh/image/upload/v1784222954/56fb26d7-1364-4020-ad1d-2cd65e216fe4_dxzyee.png",
  },
  openGraph: {
    title: "Frame by DB | Premium Photography & Cinematography",
    description: "Dasari Bharadwaj, award-winning Director of Photography with 16+ years of experience in luxury weddings, commercials, and corporate events based in Hyderabad, India.",
    url: "https://framebydb.com",
    siteName: "Frame by DB",
    images: [
      {
        url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200",
        width: 1200,
        height: 630,
        alt: "Dasari Bharadwaj Cinematography Portfolio",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await readDB();
  const settings = db.settings || {};

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#111111] text-white selection:bg-[#D4AF37] selection:text-[#111111]">
        <ClientLayout settings={settings}>{children}</ClientLayout>
      </body>
    </html>
  );
}

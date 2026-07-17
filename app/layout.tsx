import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/PageTransition";
import FloatingContact from "@/components/FloatingContact";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#111111] text-white selection:bg-[#D4AF37] selection:text-[#111111]">
        <PageLoader />
        <CustomCursor />
        <FloatingContact />
        <SmoothScroll>
          <div className="flex-1 flex flex-col pt-[72px] lg:pt-[88px]">
            <Navbar />
            <PageTransition>
              {children}
            </PageTransition>
            <Footer />
          </div>
        </SmoothScroll>
      </body>
    </html>
  );
}

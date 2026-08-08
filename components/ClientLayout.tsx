'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/PageTransition";
import FloatingContact from "@/components/FloatingContact";



export default function ClientLayout({ children, settings = {} }: { children: React.ReactNode; settings?: any }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="flex-1 flex flex-col w-full min-h-screen bg-[#111111] text-white">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    );
  }

  return (
    <>
      <PageLoader />
      <CustomCursor />
      <FloatingContact />
      <SmoothScroll>
        <div className="flex-1 flex flex-col pt-[72px] lg:pt-[88px]">
          <Navbar settings={settings} />
          <PageTransition>
            {children}
          </PageTransition>
          <Footer settings={settings} />
        </div>
      </SmoothScroll>
    </>
  );
}

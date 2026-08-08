'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import PageLoader from "@/components/PageLoader";
import PageTransition from "@/components/PageTransition";
import FloatingContact from "@/components/FloatingContact";

if (typeof window !== 'undefined' && !(window as any).__fetch_intercepted__) {
  (window as any).__fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const targetUrl = apiBase + input.substring(4);
      
      if (!init) init = {};
      init.credentials = 'include';
      
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      const token = getCookie('admin_token') || getCookie('client_token');
      if (token) {
        if (!init.headers) init.headers = {};
        if (init.headers instanceof Headers) {
          if (!init.headers.has('Authorization')) {
            init.headers.set('Authorization', `Bearer ${token}`);
          }
        } else if (Array.isArray(init.headers)) {
          if (!init.headers.some(h => h[0].toLowerCase() === 'authorization')) {
            init.headers.push(['Authorization', `Bearer ${token}`]);
          }
        } else {
          if (!init.headers['Authorization']) {
            (init.headers as any)['Authorization'] = `Bearer ${token}`;
          }
        }
      }
      return originalFetch(targetUrl, init);
    }
    return originalFetch(input, init);
  };
}

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

import type { Metadata } from 'next';
import AdminClient from '@/features/AdminClient';

export const metadata: Metadata = {
  title: 'Admin Command Center | Frame by DB',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#111111] text-white">
      <AdminClient />
    </div>
  );
}

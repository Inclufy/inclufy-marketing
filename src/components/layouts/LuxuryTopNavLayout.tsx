// src/components/layouts/LuxuryTopNavLayout.tsx
import { Outlet } from 'react-router-dom';
import LuxuryTopNav from '@/components/navigation/LuxuryTopNav';

export default function LuxuryTopNavLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <LuxuryTopNav />
      
      {/* Main Content */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}
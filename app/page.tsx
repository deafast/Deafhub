'use client';

import HomeV1 from '@/components/shared/HomeV1';

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black">
      <HomeV1 />

      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1400);
    const timer2 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#09090c] transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Animated glow ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-40 h-40 rounded-full bg-gymNeon/20 blur-2xl animate-pulse" />
        <div className="absolute w-28 h-28 rounded-full border-2 border-gymNeon/40 animate-ping" style={{ animationDuration: '1.5s' }} />

        {/* Logo */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gymNeon shadow-[0_0_32px_rgba(255,87,34,0.5)]">
          <img
            src="/logo-192.png"
            alt="Sierra Coaching"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Title */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-gymNeon font-bold uppercase tracking-[0.3em] mb-1">Sierra Coaching</p>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gymNeon animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gymNeon animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gymNeon animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// src/components/animated-background.tsx
'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-white dark:bg-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 sm:w-[32rem] sm:h-[32rem] bg-blue-500/10 dark:bg-blue-500/5 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 sm:w-[32rem] sm:h-[32rem] bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
    </div>
  );
}
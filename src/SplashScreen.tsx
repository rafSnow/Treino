import React from 'react';
import { Dumbbell } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-[200] animate-in fade-in duration-300">
      <div className="relative">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl animate-bounce duration-[2000ms] ease-in-out">
          <Dumbbell size={64} className="text-primary" strokeWidth={3} />
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div className="h-full bg-white/40 animate-progress" />
        </div>
      </div>
      <div className="absolute bottom-12 text-white/60 font-black tracking-[0.3em] uppercase text-xs">
        Treino PWA
      </div>
    </div>
  );
};

export default SplashScreen;

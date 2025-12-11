import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Theme } from '../types';
import { Check, Disc, Circle, BookOpen, XCircle, Star } from 'lucide-react';

interface DroppableZoneProps {
  id: string;
  value: number;
  theme: Theme;
  isSuccess?: boolean;
  isShaking?: boolean;
  isCompleted?: boolean;
}

export const DroppableZone: React.FC<DroppableZoneProps> = ({ id, value, theme, isSuccess, isShaking, isCompleted }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { value },
    disabled: isCompleted // Disable interactions when completed
  });

  const getIcon = () => {
    // Error state: pulsating X
    if (isShaking) return <XCircle size={28} className="text-red-100 animate-pulse drop-shadow-md md:w-8 md:h-8" />;
    
    // Success state: Animated theme icons or reward star
    if (isSuccess) {
      switch (theme.id) {
        case 'hockey': return <Disc size={28} className="text-white animate-spin drop-shadow-md md:w-8 md:h-8" />; 
        case 'football': return <Circle size={28} className="text-white animate-bounce drop-shadow-md md:w-8 md:h-8" />;
        default: return <Star size={28} className="text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-md md:w-8 md:h-8" />;
      }
    }

    // Completed state: Simple check
    if (isCompleted) return <Check size={20} className="text-green-400/50" />;
    
    // Default state: Small theme icons
    switch (theme.id) {
      case 'hockey': return <Disc size={18} className={`md:w-5 md:h-5 text-white/40 ${isOver ? "animate-spin text-white" : ""}`} />; 
      case 'football': return <Circle size={18} className={`md:w-5 md:h-5 text-white/40 ${isOver ? "animate-bounce text-white" : ""}`} />; 
      default: return <BookOpen size={18} className={`md:w-5 md:h-5 text-white/40 ${isOver ? "text-white" : ""}`} />;
    }
  };

  const getLabel = () => {
    if (isSuccess) return 'Rätt!';
    if (isShaking) return 'Fel!';
    if (isCompleted) return 'Klar';
    
    switch (theme.id) {
      case 'hockey': return 'Skjut';
      case 'football': return 'Passa';
      default: return 'Släpp';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-20 sm:h-28 md:h-40
        rounded-xl md:rounded-2xl border-4
        transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isSuccess 
          ? 'border-green-300 bg-green-500 scale-110 shadow-[0_0_40px_rgba(74,222,128,0.6)] z-30 -translate-y-1 sm:-translate-y-2' 
          : isShaking
            ? 'border-red-500 bg-red-600 animate-shake shadow-[0_0_30px_rgba(239,68,68,0.5)] z-20 scale-100'
            : isCompleted
              ? 'border-white/5 bg-black/40 opacity-40 scale-95 grayscale'
              : isOver 
                ? 'border-white bg-white/20 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10' 
                : `border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40`
        }
      `}
    >
      {/* Success Effect: White flash overlay */}
      <div className={`
        absolute inset-0 rounded-xl z-0 pointer-events-none transition-opacity duration-500
        ${isSuccess ? 'opacity-100 bg-gradient-to-br from-white/30 to-transparent' : 'opacity-0'}
      `} />

      {/* Success Particles (Simulated corner sparkles) */}
      {isSuccess && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-300 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 sm:w-3 sm:h-3 bg-yellow-300 rounded-full animate-ping delay-75" />
        </>
      )}

      <div className={`absolute top-1 left-1 md:top-2 md:left-2 transition-colors duration-200 z-10`}>
        {getIcon()}
      </div>

      <span className={`
        text-3xl sm:text-4xl md:text-6xl font-black z-10
        ${isSuccess ? 'text-white scale-110 drop-shadow-md' : isShaking ? 'text-white' : isCompleted ? 'text-white/30' : 'text-white'} 
        transition-all duration-200 leading-none
      `}>
        {value}
      </span>
      
      <span className={`
        text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest mt-0.5 md:mt-2 font-bold z-10
        ${isSuccess ? 'text-green-100' : isShaking ? 'text-red-100' : isCompleted ? 'text-white/20' : 'text-white/50'}
      `}>
        {getLabel()}
      </span>
    </div>
  );
};
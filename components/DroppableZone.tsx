import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Theme } from '../types';
import { Check, Disc, Circle, BookOpen, XCircle } from 'lucide-react';

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
    // Make the X icon slightly larger and animate it for emphasis
    if (isShaking) return <XCircle size={28} className="text-red-200 animate-pulse" />;
    if (isCompleted && !isSuccess) return <Check size={20} />;
    
    switch (theme.id) {
      case 'hockey': return <Disc size={20} className={isSuccess || isOver ? "animate-spin" : ""} />; // Puck - adds spin effect on interaction
      case 'football': return <Circle size={20} className={isSuccess || isOver ? "animate-bounce" : ""} />; // Ball - adds bounce effect on interaction
      default: return <BookOpen size={20} />;
    }
  };

  const getLabel = () => {
    if (isSuccess) return 'Mål!';
    if (isShaking) return 'Försök igen!';
    if (isCompleted) return 'Klar';
    
    switch (theme.id) {
      case 'hockey': return 'Skjut här';
      case 'football': return 'Passa här';
      default: return 'Släpp här';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-32 md:h-40
        rounded-xl border-4 border-dashed
        transition-all duration-300 ease-out
        ${isSuccess 
          ? 'border-green-400 bg-green-500/30 scale-110 shadow-[0_0_50px_rgba(74,222,128,0.5)] z-20' 
          : isShaking
            ? 'border-red-500 bg-red-500/40 animate-shake shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-105 z-20'
            : isCompleted
              ? 'border-white/5 bg-black/20 opacity-30 scale-90 grayscale'
              : isOver 
                ? 'border-white bg-white/20 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                : `border-white/30 bg-white/5 hover:bg-white/10`
        }
      `}
    >
      {/* Ping effect overlay for immediate success feedback */}
      {isSuccess && (
        <div className="absolute inset-0 rounded-xl bg-green-400 opacity-20 animate-ping z-0 pointer-events-none" />
      )}
      
      {/* Red flash overlay for error feedback */}
      {isShaking && (
        <div className="absolute inset-0 rounded-xl bg-red-500 opacity-20 z-0 pointer-events-none" />
      )}

      <div className={`absolute top-2 left-2 transition-colors duration-300 ${
        isSuccess ? 'text-green-200' : isShaking ? 'text-red-100' : isCompleted ? 'text-white/20' : 'text-white/30'
      }`}>
        {getIcon()}
      </div>

      <span className={`
        text-4xl md:text-6xl font-black 
        ${isSuccess ? 'text-green-100 scale-110' : isShaking ? 'text-red-100' : isCompleted ? 'text-white/30' : 'text-white'} 
        transition-all duration-300 drop-shadow-lg
      `}>
        {value}
      </span>
      
      <span className={`
        text-xs uppercase tracking-widest mt-2 font-bold 
        ${isSuccess ? 'text-green-200' : isShaking ? 'text-red-200' : isCompleted ? 'text-white/20' : 'text-white/50'}
      `}>
        {getLabel()}
      </span>
    </div>
  );
};
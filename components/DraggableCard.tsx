import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calculator, Snowflake, Trophy, Rocket } from 'lucide-react';
import { Theme, Operation } from '../types';

interface DraggableCardProps {
  id: string;
  factorA: number;
  factorB: number;
  operator: Operation;
  theme: Theme;
  isShaking?: boolean;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ id, factorA, factorB, operator, theme, isShaking }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { factorA, factorB }
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 1,
  };

  const getWatermark = () => {
    switch (theme.id) {
      case 'hockey': return <Snowflake className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 text-black/10 absolute rotate-12" />;
      case 'football': return <Trophy className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 text-black/10 absolute -rotate-12" />;
      case 'space': return <Rocket className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 text-black/10 absolute -rotate-45" />;
      default: return <Calculator className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 text-black/10 absolute" />;
    }
  };

  const getOperatorSymbol = () => {
    switch (operator) {
      case 'addition': return '+';
      case 'subtraction': return '−';
      case 'division': return '÷';
      case 'percentage': return '%';
      case 'multiplication': return '×';
      case 'algebra': return '=';
      default: return '';
    }
  };

  const renderContent = () => {
    if (operator === 'exponentiation') {
      return (
        <div className="relative flex items-start justify-center ml-2">
          <span className="text-4xl sm:text-5xl md:text-6xl font-bold drop-shadow-md leading-none">{factorA}</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-bold opacity-90 leading-none mt-[-4px] ml-0.5">{factorB}</span>
        </div>
      );
    }
    
    if (operator === 'algebra') {
      return (
        <div className="flex flex-col items-center justify-center">
           <span className="text-xl sm:text-2xl md:text-3xl mb-0.5 md:mb-1 drop-shadow-md leading-none whitespace-nowrap">x + {factorA}</span>
           <span className="text-lg sm:text-xl md:text-2xl opacity-80 leading-none py-0.5">=</span>
           <span className="text-3xl sm:text-4xl md:text-5xl mt-0.5 md:mt-1 drop-shadow-md leading-none">{factorB}</span>
        </div>
      );
    }

    if (operator === 'root') {
      return (
        <div className="flex items-center justify-center relative">
           {/* Radical Symbol SVG roughly drawn or using text */}
           <div className="flex items-start">
             <span className="text-3xl sm:text-4xl md:text-5xl font-light leading-none mr-0.5 select-none">√</span>
             <span className="text-4xl sm:text-5xl md:text-6xl font-bold drop-shadow-md leading-none border-t-2 border-white pt-1 mt-1.5">{factorA}</span>
           </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl md:text-5xl mb-0.5 md:mb-1 drop-shadow-md leading-none">{factorA}</span>
        <span className="text-lg sm:text-xl md:text-2xl opacity-80 leading-none py-0.5">{getOperatorSymbol()}</span>
        <span className="text-3xl sm:text-4xl md:text-5xl mt-0.5 md:mt-1 drop-shadow-md leading-none">{factorB}</span>
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative flex flex-col items-center justify-center 
        w-24 h-32 sm:w-28 sm:h-36 md:w-36 md:h-48 
        rounded-xl md:rounded-2xl shadow-[0_4px_10px_rgba(0,0,0,0.5)] md:shadow-[0_10px_20px_rgba(0,0,0,0.5)] 
        border-b-4 md:border-b-8 overflow-hidden
        ${isShaking ? 'border-red-500 animate-shake' : `${theme.accentColor}`}
        ${theme.cardBg}
        cursor-grab active:cursor-grabbing touch-none
        transition-transform duration-100
        ${isDragging ? 'opacity-0' : 'hover:-translate-y-1'}
      `}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {getWatermark()}
      </div>

      <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-50">
        <GripVertical size={16} className="text-white w-4 h-4 md:w-5 md:h-5" />
      </div>
      
      <div className="relative flex flex-col items-center justify-center text-white font-bold select-none pointer-events-none z-10 w-full px-1">
        {renderContent()}
      </div>
      
      {/* Decorative shine */}
      <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
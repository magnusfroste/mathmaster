import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calculator, Snowflake, Trophy } from 'lucide-react';
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
      case 'hockey': return <Snowflake className="w-20 h-20 text-black/10 absolute rotate-12" />;
      case 'football': return <Trophy className="w-20 h-20 text-black/10 absolute -rotate-12" />;
      default: return <Calculator className="w-20 h-20 text-black/10 absolute" />;
    }
  };

  const getOperatorSymbol = () => {
    switch (operator) {
      case 'addition': return '+';
      case 'subtraction': return '−';
      case 'division': return '÷';
      case 'multiplication': 
      default: return '×';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative flex flex-col items-center justify-center 
        w-28 h-36 md:w-32 md:h-44 
        rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.5)] 
        border-b-8 overflow-hidden
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

      <div className="absolute top-2 right-2 opacity-50">
        <GripVertical size={16} className="text-white" />
      </div>
      
      <div className="relative flex flex-col items-center justify-center text-white font-bold select-none pointer-events-none z-10">
        <span className="text-4xl md:text-5xl mb-1 drop-shadow-md">{factorA}</span>
        <span className="text-2xl opacity-80">{getOperatorSymbol()}</span>
        <span className="text-4xl md:text-5xl mt-1 drop-shadow-md">{factorB}</span>
      </div>
      
      {/* Decorative shine */}
      <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
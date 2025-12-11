import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
import { Gamepad2, Coins, Trophy, RefreshCw, Star, Play, Lock, CheckCircle2, XCircle, Palette, Flame, BookOpen, Disc, Flag, Calculator, Divide, Plus, Minus, Zap, Percent, GraduationCap, Sigma, Binary } from 'lucide-react';
import { THEMES, LEVELS } from './constants';
import { Problem, Theme, GamePhase, GameState, Operation } from './types';
import { DraggableCard } from './components/DraggableCard';
import { DroppableZone } from './components/DroppableZone';
import { triggerConfetti } from './components/Confetti';
import { playSound } from './utils/sound';

// Helper to generate unique random problems based on operation
const generateProblems = (level: number, count: number, operation: Operation): { problems: Problem[], answers: number[] } => {
  const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  const problems: Problem[] = [];
  const usedAnswers = new Set<number>();

  // Scale up numbers for Addition/Subtraction to make them cognitively equivalent to multiplication levels
  const rangeScale = (operation === 'addition' || operation === 'subtraction') ? 1.5 : 1;

  while (problems.length < count) {
    let factorA = 0;
    let factorB = 0;
    let answer = 0;

    const minA = Math.ceil(config.rangeA[0] * rangeScale);
    const maxA = Math.ceil(config.rangeA[1] * rangeScale);
    const minB = Math.ceil(config.rangeB[0] * rangeScale);
    const maxB = Math.ceil(config.rangeB[1] * rangeScale);

    if (operation === 'multiplication') {
      factorA = Math.floor(Math.random() * (config.rangeA[1] - config.rangeA[0] + 1)) + config.rangeA[0];
      factorB = Math.floor(Math.random() * (config.rangeB[1] - config.rangeB[0] + 1)) + config.rangeB[0];
      answer = factorA * factorB;
    } 
    else if (operation === 'addition') {
      factorA = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
      factorB = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
      answer = factorA + factorB;
    }
    else if (operation === 'subtraction') {
      // Ensure A > B and result is positive
      const bVal = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
      const ansVal = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
      answer = ansVal;
      factorB = bVal;
      factorA = answer + factorB; // so A - B = answer
    }
    else if (operation === 'division') {
      // Ensure A is divisible by B
      const divMin = Math.max(2, config.rangeB[0]);
      const divMax = config.rangeB[1];
      const quoMin = config.rangeA[0];
      const quoMax = config.rangeA[1];

      const divisor = Math.floor(Math.random() * (divMax - divMin + 1)) + divMin;
      const quotient = Math.floor(Math.random() * (quoMax - quoMin + 1)) + quoMin;
      
      answer = quotient;
      factorB = divisor;
      factorA = quotient * divisor; // so A / B = answer
    }
    else if (operation === 'percentage') {
      // Logic for percentages: Factor A is %, Factor B is the total. Answer is (A/100)*B.
      // We limit percentages based on level to ensure learnability.
      const availablePercents = level <= 3 ? [50, 100] 
        : level <= 6 ? [10, 20, 25, 50, 100]
        : [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
      
      const percent = availablePercents[Math.floor(Math.random() * availablePercents.length)];
      
      let step = 10;
      if (percent === 50) step = 2;
      if (percent === 25 || percent === 75) step = 4;
      if (percent === 5 || percent === 15) step = 20;
      if (percent === 100) step = 1;
      
      // Determine max base based on level
      const minBase = step;
      const maxBase = Math.max(step * 5, level * 20);
      
      const steps = Math.floor((maxBase - minBase) / step) + 1;
      const base = minBase + Math.floor(Math.random() * steps) * step;

      factorA = percent;
      factorB = base;
      answer = (percent * base) / 100;
    }
    else if (operation === 'exponentiation') {
       // Logic for exponents: Factor A is base, Factor B is exponent.
       // Scale difficulty:
       // Levels 1-3: Base 1-10, Power 2.
       // Levels 4-7: Base 2-10, Power 2-3.
       // Levels 8+: Base 2-12, Power 2-4 (with limits on large bases).
       
       let baseMin = 2, baseMax = 10;
       let powerMin = 2, powerMax = 2;

       if (level > 3) { powerMax = 3; }
       if (level > 7) { powerMax = 4; baseMax = 12; }

       const base = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
       
       // Limit power based on base to prevent massive numbers
       let maxP = powerMax;
       if (base > 10) maxP = 2;
       else if (base > 5) maxP = 3;
       
       const power = Math.floor(Math.random() * (maxP - powerMin + 1)) + powerMin;

       factorA = base;
       factorB = power;
       answer = Math.pow(base, power);
    }
    else if (operation === 'algebra') {
      // Logic for simple algebra: x + A = B. Find x.
      // factorA = added constant (A)
      // factorB = total sum (B)
      // answer = x (B - A)
      
      // Use addition ranges
      const addMin = Math.ceil(config.rangeA[0]);
      const addMax = Math.ceil(config.rangeA[1] * 1.5);
      
      // The 'x' (answer) range
      const ansMin = Math.ceil(config.rangeB[0]);
      const ansMax = Math.ceil(config.rangeB[1] * 1.5);

      const constant = Math.floor(Math.random() * (addMax - addMin + 1)) + addMin;
      const xVal = Math.floor(Math.random() * (ansMax - ansMin + 1)) + ansMin;

      answer = xVal;
      factorA = constant;
      factorB = xVal + constant; // The total
    }

    // Avoid duplicate answers on the same screen to prevent confusion
    if (!usedAnswers.has(answer)) {
      usedAnswers.add(answer);
      problems.push({
        id: `p-${Date.now()}-${problems.length}`,
        factorA,
        factorB,
        answer,
        operator: operation
      });
    }
  }
  
  // Shuffle answers for display
  const answers = Array.from(usedAnswers).sort((a, b) => a - b);
  return { problems, answers };
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(THEMES.classic);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [selectedOperation, setSelectedOperation] = useState<Operation>('multiplication');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [successAnim, setSuccessAnim] = useState<number | null>(null);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [shakeZoneValue, setShakeZoneValue] = useState<number | null>(null);
  const [streakPop, setStreakPop] = useState(false);
  
  // Calculate total content stats for display
  const totalLevels = LEVELS.length;
  const questionsPerOp = LEVELS.reduce((acc, lvl) => acc + lvl.count, 0);
  const totalQuestions = questionsPerOp * 7; // 7 operations

  // Initialize stats, loading coins from localStorage if available
  const [stats, setStats] = useState<GameState>(() => {
    let savedCoins = 0;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mm_coins');
        if (stored) {
          savedCoins = parseInt(stored, 10) || 0;
        }
      } catch (e) {
        console.warn('Could not load coins from localStorage', e);
      }
    }
    return {
      score: 0,
      coins: savedCoins,
      level: 1,
      streak: 0,
      timeLeft: 60
    };
  });
  
  // Persist coins to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('mm_coins', stats.coins.toString());
    } catch (e) {
      console.warn('Could not save coins to localStorage', e);
    }
  }, [stats.coins]);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  // Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'playing' && stats.timeLeft > 0) {
      timer = setInterval(() => {
        setStats(prev => {
          if (prev.timeLeft <= 1) {
            setPhase('gameover');
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, stats.timeLeft]);

  const startGame = () => {
    const { problems: newProblems, answers: newAnswers } = generateProblems(1, LEVELS[0].count, selectedOperation);
    setProblems(newProblems);
    setAnswers(newAnswers);
    setStats({
      score: 0,
      coins: stats.coins, // Keep coins from previous sessions
      level: 1,
      streak: 0,
      timeLeft: LEVELS[0].time
    });
    setPhase('playing');
  };

  const nextLevel = () => {
    const nextLvl = stats.level + 1;
    const config = LEVELS[Math.min(nextLvl - 1, LEVELS.length - 1)];
    const { problems: newProblems, answers: newAnswers } = generateProblems(nextLvl, config.count, selectedOperation);
    
    setProblems(newProblems);
    setAnswers(newAnswers);
    setSuccessAnim(null);
    setShakeCardId(null);
    setShakeZoneValue(null);
    setStats(prev => ({
      ...prev,
      level: nextLvl,
      timeLeft: config.time
    }));
    setPhase('playing');
  };

  const cycleTheme = () => {
    const themesList = Object.values(THEMES);
    const currentIndex = themesList.findIndex(t => t.id === theme.id);
    const nextIndex = (currentIndex + 1) % themesList.length;
    setTheme(themesList[nextIndex]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const problemId = active.id as string;
    const droppedOnAnswer = over.data.current?.value as number;
    const problem = problems.find(p => p.id === problemId);

    if (problem && problem.answer === droppedOnAnswer) {
      // Calculate remaining problems immediately
      const remainingProblems = problems.filter(p => p.id !== problemId);
      
      // Play appropriate sound
      if (remainingProblems.length === 0) {
        playSound('levelup', theme.id);
      } else {
        playSound('match', theme.id);
      }
      
      // Trigger animation
      setSuccessAnim(droppedOnAnswer);
      setTimeout(() => setSuccessAnim(null), 1000);
      
      // Streak Pop
      setStreakPop(true);
      setTimeout(() => setStreakPop(false), 300);

      const config = LEVELS[Math.min(stats.level - 1, LEVELS.length - 1)];
      const points = config.points + (stats.streak * 2);
      
      setStats(prev => ({
        ...prev,
        score: prev.score + points,
        coins: prev.coins + Math.floor(points / 5),
        streak: prev.streak + 1
      }));

      // Remove the solved problem
      setProblems(remainingProblems);

      // Check if level complete
      if (remainingProblems.length === 0) {
        triggerConfetti();
        setPhase('levelup');
      }
    } else {
      // Incorrect
      playSound('incorrect', theme.id);
      
      setShakeCardId(problemId);
      setShakeZoneValue(droppedOnAnswer);
      
      setTimeout(() => {
          setShakeCardId(null);
          setShakeZoneValue(null);
      }, 500);

      setStats(prev => ({
        ...prev,
        streak: 0,
        timeLeft: Math.max(0, prev.timeLeft - 5) // Penalty
      }));
    }
  };

  const getActiveProblem = () => problems.find(p => p.id === activeId);

  const getOperationLabel = (op: Operation) => {
    switch (op) {
      case 'addition': return 'Addition';
      case 'subtraction': return 'Subtraktion';
      case 'division': return 'Division';
      case 'multiplication': return 'Multiplikation';
      case 'percentage': return 'Procent';
      case 'exponentiation': return 'Potenser';
      case 'algebra': return 'Algebra';
    }
  };

  // --- Visual Logic for Streak ---
  const getStreakColor = () => {
    if (stats.streak >= 10) return 'text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]';
    if (stats.streak >= 5) return 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]';
    if (stats.streak >= 2) return 'text-yellow-400';
    return 'text-slate-400';
  };
  
  const getStreakIcon = () => {
    if (stats.streak >= 10) return <Zap size={24} className="fill-purple-400 text-purple-200 animate-[pulse_0.5s_ease-in-out_infinite]" />;
    if (stats.streak >= 5) return <Flame size={24} className="fill-orange-500 text-orange-600 animate-pulse" />;
    return <Flame size={20} />;
  };

  // --- Renders ---

  if (phase === 'menu') {
    return (
      <div className={`min-h-screen w-full bg-gradient-to-br ${theme.bgGradient} flex flex-col items-center justify-center p-4 text-white overflow-y-auto`}>
        <div className="max-w-4xl w-full text-center space-y-4 md:space-y-8 animate-float py-8">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-2xl">
              MatteMästaren
            </h1>
            
            {/* Educational content summary */}
            <div className="flex items-center gap-2 mt-2 md:mt-4 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
              <GraduationCap size={16} className="text-yellow-400" />
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide text-white/90">
                7 SPELSÄTT • {totalLevels} NIVÅER • {totalQuestions}+ UTMANINGAR
              </span>
            </div>
          </div>

          <p className="text-lg sm:text-xl md:text-2xl text-white/80">Välj räknesätt och bli en mästare!</p>
          
          {/* Operation Selector */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-8 px-2 md:px-4">
             {(['multiplication', 'addition', 'subtraction', 'division', 'percentage', 'exponentiation', 'algebra'] as Operation[]).map(op => (
               <button
                 key={op}
                 onClick={() => setSelectedOperation(op)}
                 className={`
                   flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 transition-all duration-200 w-24 sm:w-28 md:w-36
                   ${selectedOperation === op 
                     ? 'bg-white/20 border-yellow-400 scale-105 shadow-xl' 
                     : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/30'
                   }
                 `}
               >
                 <div className="text-2xl sm:text-3xl md:text-4xl mb-1 flex items-center justify-center h-10 md:h-12">
                   {op === 'multiplication' && <span className="text-purple-400">×</span>}
                   {op === 'addition' && <span className="text-green-400">+</span>}
                   {op === 'subtraction' && <span className="text-blue-400">−</span>}
                   {op === 'division' && <span className="text-pink-400">÷</span>}
                   {op === 'percentage' && <span className="text-yellow-400">%</span>}
                   {op === 'exponentiation' && (
                     <div className="relative">
                       <span className="text-red-400">x</span>
                       <span className="text-sm absolute -top-1 -right-2 text-white">2</span>
                     </div>
                   )}
                   {op === 'algebra' && (
                     <span className="text-cyan-400 text-lg md:text-2xl font-mono">x=</span>
                   )}
                 </div>
                 <span className="font-bold text-xs sm:text-sm md:text-base leading-tight">{getOperationLabel(op)}</span>
                 <span className="text-[9px] sm:text-[10px] font-medium text-white/50 mt-1 uppercase tracking-wide">
                   {totalLevels} Nivåer
                 </span>
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8 px-4">
            {Object.values(THEMES).map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 md:border-4 transition-all duration-300 transform hover:scale-105 active:scale-95 text-left group
                  ${theme.id === t.id ? 'border-yellow-400 bg-white/20 shadow-xl' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                `}
              >
                {theme.id === t.id && (
                  <div className="absolute -top-3 -right-3 bg-yellow-400 text-black p-2 rounded-full shadow-lg">
                    <Star size={16} fill="black" className="md:w-5 md:h-5" />
                  </div>
                )}
                <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 md:mb-4 text-2xl md:text-3xl shadow-lg ${t.primaryColor}`}>
                  {t.id === 'classic' && '📚'}
                  {t.id === 'hockey' && '🏒'}
                  {t.id === 'football' && '⚽️'}
                </div>
                <h3 className="text-base md:text-xl font-bold">{t.name}</h3>
              </button>
            ))}
          </div>

          <div className="pt-4 md:pt-8">
            <button
              onClick={startGame}
              className="bg-green-500 hover:bg-green-400 text-white text-xl md:text-2xl font-black py-4 md:py-6 px-10 md:px-16 rounded-full shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_10px_0_rgb(21,128,61)] active:shadow-[0_0px_0_rgb(21,128,61)] active:translate-y-2 transition-all flex items-center gap-2 md:gap-4 mx-auto"
            >
              <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" />
              STARTA
            </button>
          </div>

          <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 md:px-6 md:rounded-full rounded-xl">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs md:text-base">$</div>
            <span className="font-bold text-lg md:text-xl">{stats.coins} mynt</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className={`min-h-screen w-full bg-gradient-to-br ${theme.bgGradient} flex flex-col overflow-hidden transition-colors duration-1000`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-2 sm:p-4 md:p-6 bg-black/20 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold hidden md:block text-white/90">MatteMästaren</h1>
            
            <button 
              onClick={cycleTheme}
              className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Byt tema"
            >
              <Palette size={18} className="md:w-5 md:h-5" />
            </button>

            <div className={`flex items-center gap-2 px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-white/10 ${theme.primaryColor} bg-opacity-80 shadow-lg`}>
              <span className="text-white font-bold tracking-wide text-xs md:text-base whitespace-nowrap">Nivå {stats.level}</span>
            </div>
            
            {/* Show Current Operation */}
            <div className="flex items-center justify-center w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20">
               {selectedOperation === 'multiplication' && <span className="text-purple-300 font-bold text-base md:text-lg">×</span>}
               {selectedOperation === 'addition' && <span className="text-green-300 font-bold text-base md:text-lg">+</span>}
               {selectedOperation === 'subtraction' && <span className="text-blue-300 font-bold text-base md:text-lg">−</span>}
               {selectedOperation === 'division' && <span className="text-pink-300 font-bold text-base md:text-lg">÷</span>}
               {selectedOperation === 'percentage' && <span className="text-yellow-300 font-bold text-base md:text-lg">%</span>}
               {selectedOperation === 'exponentiation' && (
                 <div className="flex relative">
                   <span className="text-red-300 font-bold text-sm md:text-base">x</span>
                   <span className="text-[10px] md:text-xs absolute -top-1 -right-1.5 text-red-200">2</span>
                 </div>
               )}
               {selectedOperation === 'algebra' && <span className="text-cyan-300 font-bold text-xs md:text-sm font-mono">x=</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Enhanced Streak Display */}
            <div className="flex flex-col items-end hidden sm:flex">
              <div className={`
                flex items-center gap-1.5 transition-all duration-300
                ${getStreakColor()}
                ${streakPop ? 'scale-150' : 'scale-100'}
              `}>
                {getStreakIcon()}
                <span className="text-xl md:text-2xl font-black italic">{stats.streak}</span>
              </div>
              {stats.streak >= 5 && (
                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${stats.streak >= 10 ? 'text-purple-300' : 'text-orange-400'}`}>
                  {stats.streak >= 10 ? 'SUPER!' : 'ON FIRE!'}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 md:gap-2">
                <Trophy size={16} className="text-yellow-400 md:w-5 md:h-5" />
                <span className="text-lg md:text-xl font-bold">{stats.score}</span>
              </div>
            </div>

            <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 flex items-center justify-center rounded-full border-2 md:border-4 ${stats.timeLeft < 10 ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-blue-500 bg-blue-500/20'}`}>
              <div className="flex flex-col items-center">
                <span className="text-base sm:text-lg md:text-2xl font-black">{stats.timeLeft}</span>
                <span className="text-[7px] md:text-[10px] uppercase font-bold">Sek</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col relative max-w-7xl mx-auto w-full p-2 md:p-4 overflow-hidden">
          
          {/* Active Cards Area (Top) - Allow it to shrink, but prioritize showing content */}
          <div className="flex-1 flex items-center justify-center py-2 md:py-4 min-h-0">
            {phase === 'playing' ? (
              <div className="flex flex-wrap justify-center content-center gap-2 sm:gap-4 md:gap-8 perspective-1000 w-full h-full overflow-y-auto">
                {problems.map((prob) => (
                  <DraggableCard 
                    key={prob.id} 
                    id={prob.id} 
                    factorA={prob.factorA} 
                    factorB={prob.factorB}
                    operator={prob.operator}
                    theme={theme} 
                    isShaking={shakeCardId === prob.id}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Goal Text */}
          <div className="text-center py-1 md:py-2 shrink-0">
            <p className="text-white/60 font-bold text-xs sm:text-sm md:text-lg animate-pulse">Dra korten till rätt svar!</p>
          </div>

          {/* Drop Zones (Bottom) - Adjust height dynamically */}
          <div className="shrink-0 bg-black/20 rounded-t-2xl md:rounded-t-3xl border-t border-white/10 p-2 sm:p-4 md:p-6 backdrop-blur-sm max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 content-center">
              {answers.map((ans, idx) => (
                <DroppableZone 
                  key={`ans-${ans}-${idx}`} 
                  id={`zone-${ans}`} 
                  value={ans} 
                  theme={theme} 
                  isSuccess={successAnim === ans}
                  isShaking={shakeZoneValue === ans}
                  isCompleted={!problems.some(p => p.answer === ans)}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Level Up Modal */}
        {phase === 'levelup' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 p-4">
            <div className={`bg-gradient-to-br ${theme.bgGradient} p-6 md:p-8 rounded-3xl text-center max-w-lg w-full shadow-2xl border-4 border-yellow-400 relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
              
              <div className="relative z-10">
                <div className="inline-block p-4 rounded-full bg-yellow-400 mb-6 shadow-[0_0_50px_rgba(250,204,21,0.5)] animate-bounce">
                  <Trophy size={48} className="text-yellow-900 md:w-16 md:h-16" />
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">Bra jobbat!</h2>
                <p className="text-lg md:text-xl text-white/80 mb-8">Nivå {stats.level} avklarad!</p>
                
                <div className="flex justify-center gap-4 md:gap-8 mb-8">
                  <div className="text-center">
                    <p className="text-xs md:text-sm uppercase text-white/60 font-bold">Poäng</p>
                    <p className="text-2xl md:text-3xl font-bold text-white">+{LEVELS[Math.min(stats.level - 1, LEVELS.length - 1)].points}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs md:text-sm uppercase text-white/60 font-bold">Mynt</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-bold text-xs">$</div>
                      <p className="text-2xl md:text-3xl font-bold text-white">+{Math.floor(LEVELS[Math.min(stats.level - 1, LEVELS.length - 1)].points / 5)}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={nextLevel}
                  className="w-full bg-green-500 hover:bg-green-400 text-white text-xl md:text-2xl font-bold py-3 md:py-4 rounded-xl shadow-[0_6px_0_rgb(21,128,61)] active:shadow-none active:translate-y-2 transition-all"
                >
                  Nästa Nivå
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {phase === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-6 md:p-8 rounded-3xl text-center max-w-md w-full border-2 border-red-500/50">
              <div className="inline-block p-4 rounded-full bg-slate-700 mb-6">
                <RefreshCw size={40} className="text-white md:w-12 md:h-12" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tiden är ute!</h2>
              <p className="text-base md:text-lg text-slate-300 mb-8">Du nådde nivå {stats.level} och fick {stats.score} poäng.</p>
              
              <div className="space-y-3 md:space-y-4">
                <button 
                  onClick={startGame}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-colors"
                >
                  Försök igen
                </button>
                <button 
                  onClick={() => setPhase('menu')}
                  className="w-full bg-transparent hover:bg-white/10 text-white/50 text-base md:text-lg font-bold py-3 md:py-4 rounded-xl transition-colors"
                >
                  Tillbaka till menyn
                </button>
              </div>
            </div>
          </div>
        )}

        <DragOverlay>
          {activeId ? (
            <div className={`
              flex flex-col items-center justify-center 
              w-24 h-32 md:w-32 md:h-44 rounded-xl md:rounded-2xl shadow-2xl 
              ${theme.cardBg} scale-110 cursor-grabbing
              border-4 border-white overflow-hidden relative
            `}>
              {/* Background Watermark for Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {(() => {
                    switch (theme.id) {
                      case 'hockey': return <div className="text-black/10"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"/><path d="m9 9 3 3-3 3"/><path d="m15 9-3 3 3 3"/></svg></div>;
                      default: return null;
                    }
                 })()}
              </div>

              {(() => {
                 const prob = getActiveProblem();
                 if (!prob) return null;
                 return (
                   <div className="flex flex-col items-center justify-center text-white font-bold z-10 w-full">
                     {/* Reuse the rendering logic from DraggableCard or simple fallback */}
                     {prob.operator === 'exponentiation' ? (
                        <div className="relative flex items-start justify-center ml-2">
                          <span className="text-5xl font-bold drop-shadow-md leading-none">{prob.factorA}</span>
                          <span className="text-3xl font-bold opacity-90 leading-none mt-[-4px] ml-0.5">{prob.factorB}</span>
                        </div>
                     ) : prob.operator === 'algebra' ? (
                        <div className="flex flex-col items-center justify-center">
                           <span className="text-3xl mb-1 drop-shadow-md leading-none whitespace-nowrap">x + {prob.factorA}</span>
                           <span className="text-2xl opacity-80 leading-none py-0.5">=</span>
                           <span className="text-5xl mt-1 drop-shadow-md leading-none">{prob.factorB}</span>
                        </div>
                     ) : (
                       <>
                         <span className="text-5xl mb-1">{prob.factorA}</span>
                         <span className="text-3xl opacity-80">
                            {prob.operator === 'addition' && '+'}
                            {prob.operator === 'subtraction' && '−'}
                            {prob.operator === 'division' && '÷'}
                            {prob.operator === 'multiplication' && '×'}
                            {prob.operator === 'percentage' && '%'}
                         </span>
                         <span className="text-5xl mt-1">{prob.factorB}</span>
                       </>
                     )}
                   </div>
                 );
              })()}
            </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  );
};

export default App;
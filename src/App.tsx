import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { Trophy, RefreshCw, Star, Play, Palette, Flame, Zap, GraduationCap, ArrowLeft, RotateCcw, Rocket, X, Book, Users, Brain, Calculator, BookOpen } from 'lucide-react';
import { THEMES, LEVELS, CURRICULUM } from './constants';
import { Problem, Theme, GamePhase, GameState, Operation, GradeLevel } from './types';
import { DraggableCard } from './components/DraggableCard';
import { DroppableZone } from './components/DroppableZone';
import { triggerConfetti } from './components/Confetti';
import { playSound } from './utils/sound';
import { PROBLEM_COUNTS, generateProblems } from './utils/mathLogic';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(THEMES.classic);
  // Default phase check: if no grade in localstorage, go to grade_selection
  const [phase, setPhase] = useState<GamePhase>('grade_selection');
  const [grade, setGrade] = useState<GradeLevel | null>(null);
  
  const [selectedOperation, setSelectedOperation] = useState<Operation>('multiplication');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [successAnim, setSuccessAnim] = useState<number | null>(null);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [shakeZoneValue, setShakeZoneValue] = useState<number | null>(null);
  const [streakPop, setStreakPop] = useState(false);
  
  const totalLevels = LEVELS.length;

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
  
  // Load grade from storage on mount
  useEffect(() => {
    try {
      const storedGrade = localStorage.getItem('mm_grade') as GradeLevel;
      if (storedGrade && CURRICULUM[storedGrade]) {
        setGrade(storedGrade);
        setPhase('menu');
        
        // Ensure selected operation is valid for this grade
        const validOps = CURRICULUM[storedGrade].allowedOperations;
        if (!validOps.includes(selectedOperation)) {
          setSelectedOperation(validOps[0]);
        }
      } else {
        setPhase('grade_selection');
      }
    } catch (e) {
      console.warn('Error loading grade', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mm_coins', stats.coins.toString());
    } catch (e) {
      console.warn('Could not save coins to localStorage', e);
    }
  }, [stats.coins]);

  const selectGrade = (g: GradeLevel) => {
    setGrade(g);
    try {
      localStorage.setItem('mm_grade', g);
    } catch (e) {}
    
    // Set default operation for this grade
    const validOps = CURRICULUM[g].allowedOperations;
    setSelectedOperation(validOps[0]);
    
    setPhase('menu');
  };

  const changeGrade = () => {
    setPhase('grade_selection');
  };
  
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (phase === 'playing' && stats.timeLeft > 0) {
      timer = setInterval(() => {
        setStats(prev => {
          // Play tick sound for last 5 seconds (5, 4, 3, 2, 1)
          if (prev.timeLeft <= 6 && prev.timeLeft > 1) {
             playSound('tick', theme.id);
          }

          if (prev.timeLeft <= 1) {
            playSound('gameover', theme.id);
            setPhase('gameover');
            return { ...prev, timeLeft: 0 };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, stats.timeLeft, theme.id]);

  const startGame = () => {
    // Start at the selected level
    const levelIndex = Math.min(selectedLevel - 1, LEVELS.length - 1);
    const config = LEVELS[levelIndex];
    const { problems: newProblems, answers: newAnswers } = generateProblems(selectedLevel, config.count, selectedOperation);
    setProblems(newProblems);
    setAnswers(newAnswers);
    setStats({
      score: 0,
      coins: stats.coins,
      level: selectedLevel,
      streak: 0,
      timeLeft: config.time
    });
    setPhase('playing');
  };

  const retryLevel = () => {
    const config = LEVELS[Math.min(stats.level - 1, LEVELS.length - 1)];
    const { problems: newProblems, answers: newAnswers } = generateProblems(stats.level, config.count, selectedOperation);
    setProblems(newProblems);
    setAnswers(newAnswers);
    setStats(prev => ({
      ...prev,
      timeLeft: config.time,
      streak: 0 // Reset streak but keep score
    }));
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
    const themesList = Object.values(THEMES) as Theme[];
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
      const remainingProblems = problems.filter(p => p.id !== problemId);
      
      if (remainingProblems.length === 0) {
        playSound('levelup', theme.id);
      } else {
        playSound('match', theme.id);
      }
      
      setSuccessAnim(droppedOnAnswer);
      setTimeout(() => setSuccessAnim(null), 1000);
      
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

      setProblems(remainingProblems);

      if (remainingProblems.length === 0) {
        triggerConfetti();
        setPhase('levelup');
      }
    } else {
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
        timeLeft: Math.max(0, prev.timeLeft - 5)
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
      case 'root': return 'Kvadratrot';
    }
  };

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

  const getGradeColor = (g: GradeLevel) => {
    switch(g) {
      case 'F': return 'from-green-500/20 to-green-600/20 border-green-400/50 hover:border-green-400';
      case '1': return 'from-emerald-500/20 to-emerald-600/20 border-emerald-400/50 hover:border-emerald-400';
      case '2': return 'from-teal-500/20 to-teal-600/20 border-teal-400/50 hover:border-teal-400';
      case '3': return 'from-cyan-500/20 to-cyan-600/20 border-cyan-400/50 hover:border-cyan-400';
      case '4-6': return 'from-blue-500/20 to-indigo-600/20 border-blue-400/50 hover:border-blue-400';
      case '7-9': return 'from-violet-500/20 to-purple-600/20 border-purple-400/50 hover:border-purple-400';
      default: return 'from-white/10 to-white/5 border-white/20';
    }
  };

  if (phase === 'grade_selection') {
    return (
      <div className={`min-h-screen w-full bg-gradient-to-br ${theme.bgGradient} flex flex-col items-center justify-center p-4 text-white`}>
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col items-center">
             <div className="bg-white/10 p-5 rounded-full mb-4 ring-4 ring-white/10">
                <Users size={56} className="text-yellow-400 drop-shadow-lg" />
             </div>
             <h1 className="text-4xl md:text-6xl font-black text-white mb-2 drop-shadow-lg">Välkommen!</h1>
             <p className="text-xl md:text-2xl text-white/80 font-medium">Vilken klass går du i?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto px-2">
            {(Object.entries(CURRICULUM) as [GradeLevel, typeof CURRICULUM[GradeLevel]][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => selectGrade(key)}
                className={`
                  group relative rounded-2xl p-6 text-left transition-all duration-300
                  bg-gradient-to-br border-2 shadow-lg hover:shadow-2xl hover:-translate-y-1
                  ${getGradeColor(key)}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl md:text-3xl font-black tracking-tight">{config.label}</span>
                  {key === '7-9' ? <Brain className="text-purple-300" /> : <BookOpen className="opacity-50 group-hover:opacity-100 transition-opacity" />}
                </div>
                <p className="text-white/70 text-sm font-medium leading-snug">{config.description}</p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  <ArrowLeft className="rotate-180 w-5 h-5 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'menu') {
    const allowedOps = grade ? CURRICULUM[grade].allowedOperations : ['addition'];
    
    return (
      <div className={`min-h-screen w-full bg-gradient-to-br ${theme.bgGradient} flex flex-col items-center p-4 text-white overflow-y-auto`}>
        {/* Top Bar for Changing Grade - Highly Visible */}
        <div className="w-full max-w-6xl flex items-center justify-between mb-4 md:mb-8 z-10 sticky top-0 bg-black/20 backdrop-blur-md p-4 rounded-b-3xl border-b border-white/5">
            <button 
              onClick={changeGrade}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold transition-all border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase text-white/50 tracking-wider">Klass</span>
                  <span className="text-sm md:text-base leading-none font-bold">{grade && CURRICULUM[grade].label}</span>
              </div>
            </button>
            
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-lg hidden sm:block">
              MatteMästaren
            </h1>
            
            <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/10">
                <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black text-xs">$</div>
                <span className="font-bold text-lg">{stats.coins}</span>
            </div>
        </div>

        <div className="max-w-5xl w-full text-center space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500 pb-10">
          
          <div className="flex flex-col items-center sm:hidden">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-2xl mt-4 tracking-tight">
              MatteMästaren
            </h1>
          </div>

          {/* New Level Selector - Prominently Displayed */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-white/10 shadow-xl max-w-4xl mx-auto">
             <div className="flex items-center justify-center gap-2 mb-4">
                 <Trophy className="text-yellow-400" size={24} />
                 <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">Välj Nivå</h2>
             </div>
             <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                {LEVELS.map((lvl) => (
                    <button
                        key={lvl.level}
                        onClick={() => setSelectedLevel(lvl.level)}
                        className={`
                            w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl transition-all flex items-center justify-center shadow-lg border-b-4
                            ${selectedLevel === lvl.level 
                                ? 'bg-yellow-400 text-black border-yellow-600 scale-110 -translate-y-1 ring-4 ring-yellow-400/30' 
                                : 'bg-white/10 text-white border-white/5 hover:bg-white/20 hover:border-white/10'}
                        `}
                    >
                        {lvl.level}
                    </button>
                ))}
             </div>
             <div className="mt-4 flex items-center justify-center gap-2 text-white/60 bg-black/20 w-fit mx-auto px-4 py-1.5 rounded-full">
               <Star size={14} className="text-yellow-400 fill-yellow-400" />
               <p className="text-xs md:text-sm font-medium">Nivå {selectedLevel}: {LEVELS[selectedLevel-1].points} poäng per rätt svar</p>
             </div>
          </div>
          
          <p className="text-xl md:text-2xl text-white/90 font-medium drop-shadow-md">Välj räknesätt</p>

          {/* Operations Grid */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 px-2 md:px-4">
             {allowedOps.map(op => (
               <button
                 key={op}
                 onClick={() => setSelectedOperation(op)}
                 className={`
                   flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl border-2 sm:border-4 transition-all duration-200 w-28 sm:w-32 md:w-40 min-h-[160px] md:min-h-[200px]
                   ${selectedOperation === op 
                     ? 'bg-white/20 border-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.3)] z-10' 
                     : 'bg-white/5 border-transparent hover:bg-white/15 hover:border-white/30 hover:shadow-lg opacity-80 hover:opacity-100'
                   }
                 `}
               >
                 <div className="flex-1 flex items-center justify-center w-full">
                    <div className="text-3xl sm:text-4xl md:text-5xl mb-1 flex items-center justify-center">
                      {op === 'multiplication' && <span className="text-purple-400 drop-shadow-md">×</span>}
                      {op === 'addition' && <span className="text-green-400 drop-shadow-md">+</span>}
                      {op === 'subtraction' && <span className="text-blue-400 drop-shadow-md">−</span>}
                      {op === 'division' && <span className="text-pink-400 drop-shadow-md">÷</span>}
                      {op === 'percentage' && <span className="text-yellow-400 drop-shadow-md">%</span>}
                      {op === 'exponentiation' && (
                        <div className="relative">
                          <span className="text-red-400 drop-shadow-md">x</span>
                          <span className="text-sm absolute -top-1 -right-2 text-white">2</span>
                        </div>
                      )}
                      {op === 'algebra' && (
                        <span className="text-cyan-400 text-xl md:text-3xl font-mono drop-shadow-md">x=</span>
                      )}
                      {op === 'root' && (
                        <span className="text-orange-400 text-xl md:text-3xl font-bold font-mono drop-shadow-md">√x</span>
                      )}
                    </div>
                 </div>
                 
                 <span className="font-bold text-sm sm:text-base md:text-lg leading-tight mb-2">{getOperationLabel(op)}</span>
                 
                 <div className="w-full space-y-1.5">
                   <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-2 py-1 w-full text-center">
                      <span className="text-[10px] sm:text-xs font-black text-yellow-300 tracking-wide block truncate">
                        {PROBLEM_COUNTS[op]} uppgifter
                      </span>
                   </div>
                 </div>
               </button>
             ))}
          </div>

          {/* Themes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8 px-4">
            {(Object.values(THEMES) as Theme[]).map(t => (
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
                  {t.id === 'space' && '🚀'}
                </div>
                <h3 className="text-base md:text-xl font-bold">{t.name}</h3>
              </button>
            ))}
          </div>

          {/* Start Button */}
          <div className="pt-6 md:pt-8 pb-12">
            <button
              onClick={startGame}
              className="bg-green-500 hover:bg-green-400 text-white text-xl md:text-3xl font-black py-4 md:py-6 px-12 md:px-20 rounded-full shadow-[0_6px_0_rgb(21,128,61)] md:shadow-[0_10px_0_rgb(21,128,61)] active:shadow-[0_0px_0_rgb(21,128,61)] active:translate-y-2 transition-all flex items-center gap-2 md:gap-4 mx-auto group"
            >
              <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                 <Play fill="white" className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              STARTA SPEL (NIVÅ {selectedLevel})
            </button>
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
            
            {phase === 'playing' && (
              <button 
                onClick={() => setPhase('menu')}
                className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 transition-colors mr-1"
                title="Avsluta spel"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            )}

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
               {selectedOperation === 'root' && <span className="text-orange-300 font-bold text-xs md:text-base font-mono">√x</span>}
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
              <button 
                onClick={() => setPhase('menu')}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                title="Stäng och gå till menyn"
              >
                <X size={24} />
              </button>

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
            <div className="bg-slate-800 p-6 md:p-8 rounded-3xl text-center max-w-md w-full border-2 border-red-500/50 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 animate-pulse"></div>
               <div className="relative z-10">
                  <div className="inline-block p-4 rounded-full bg-slate-700 mb-6 border border-white/10">
                    <RefreshCw size={40} className="text-white md:w-12 md:h-12" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Tiden är ute!</h2>
                  <p className="text-base md:text-lg text-slate-300 mb-8">Ingen fara, ge inte upp!</p>
                  
                  <div className="space-y-3 md:space-y-4">
                    <button 
                      onClick={retryLevel}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-lg md:text-xl font-bold py-3 md:py-4 rounded-xl transition-all shadow-[0_4px_0_rgb(37,99,235)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={20} />
                      Försök igen
                    </button>
                    <button 
                      onClick={() => setPhase('menu')}
                      className="w-full bg-white/10 hover:bg-white/20 text-white text-base md:text-lg font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={20} />
                      Huvudmeny
                    </button>
                  </div>
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
                      case 'space': return <div className="text-black/10"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></div>;
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
                     ) : prob.operator === 'root' ? (
                        <div className="flex items-center justify-center relative">
                           <div className="flex items-start">
                             <span className="text-4xl font-light leading-none mr-0.5 select-none">√</span>
                             <span className="text-5xl font-bold drop-shadow-md leading-none border-t-2 border-white pt-1 mt-1.5">{prob.factorA}</span>
                           </div>
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
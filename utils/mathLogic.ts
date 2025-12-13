import { LEVELS } from '../constants';
import { Operation, Problem } from '../types';

// Helper to count unique problems available for each operation
const countUniqueProblems = (op: Operation): number => {
  const uniqueSet = new Set<string>();

  LEVELS.forEach(config => {
    const level = config.level;
    const rangeScale = (op === 'addition' || op === 'subtraction' || op === 'algebra') ? 1.5 : 1;
    
    const minA = Math.ceil(config.rangeA[0] * rangeScale);
    const maxA = Math.ceil(config.rangeA[1] * rangeScale);
    const minB = Math.ceil(config.rangeB[0] * rangeScale);
    const maxB = Math.ceil(config.rangeB[1] * rangeScale);

    if (op === 'multiplication') {
      for (let a = config.rangeA[0]; a <= config.rangeA[1]; a++) {
        for (let b = config.rangeB[0]; b <= config.rangeB[1]; b++) {
          uniqueSet.add(`${a}x${b}`);
        }
      }
    } 
    else if (op === 'addition') {
      for (let a = minA; a <= maxA; a++) {
        for (let b = minB; b <= maxB; b++) {
          uniqueSet.add(`${a}+${b}`);
        }
      }
    }
    else if (op === 'subtraction') {
      for (let b = minB; b <= maxB; b++) {
        for (let ans = minA; ans <= maxA; ans++) {
           const a = ans + b;
           uniqueSet.add(`${a}-${b}`);
        }
      }
    }
    else if (op === 'division') {
      const divMin = Math.max(2, config.rangeB[0]);
      const divMax = config.rangeB[1];
      const quoMin = config.rangeA[0];
      const quoMax = config.rangeA[1];
      for (let d = divMin; d <= divMax; d++) {
        for (let q = quoMin; q <= quoMax; q++) {
          const a = q * d;
          uniqueSet.add(`${a}/${d}`);
        }
      }
    }
    else if (op === 'percentage') {
       let availablePercents: number[] = [];
       if (level <= 3) availablePercents = [50, 100];
       else if (level <= 6) availablePercents = [10, 20, 25, 50, 100];
       else availablePercents = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
       
       availablePercents.forEach(percent => {
          let step = 10;
          if (percent === 50) step = 2;
          if (percent === 25 || percent === 75) step = 4;
          if (percent === 5 || percent === 15) step = 20;
          if (percent === 100) step = 1;
          
          const minBase = step;
          const maxBase = Math.max(step * 5, level * 20);
          const steps = Math.floor((maxBase - minBase) / step) + 1;
          
          for (let i = 0; i < steps; i++) {
             const base = minBase + i * step;
             uniqueSet.add(`${percent}%${base}`);
          }
       });
    }
    else if (op === 'exponentiation') {
       let baseMin = 2, baseMax = 10;
       let powerMin = 2, powerMax = 2;

       if (level > 3) { powerMax = 3; }
       if (level > 7) { powerMax = 4; baseMax = 12; }
       
       for (let base = baseMin; base <= baseMax; base++) {
         let maxP = powerMax;
         if (base > 10) maxP = 2;
         else if (base > 5) maxP = 3;
         
         for (let p = powerMin; p <= maxP; p++) {
           uniqueSet.add(`${base}^${p}`);
         }
       }
    }
    else if (op === 'algebra') {
      const addMin = Math.ceil(config.rangeA[0]);
      const addMax = maxA; 
      const realAnsMin = Math.ceil(config.rangeB[0]);
      const realAnsMax = maxB;
      
      for (let c = addMin; c <= addMax; c++) {
        for (let x = realAnsMin; x <= realAnsMax; x++) {
          uniqueSet.add(`x+${c}=${x+c}`);
        }
      }
    }
    else if (op === 'root') {
      const minAns = 2;
      const maxAns = Math.min(5 + level, 15);
      for (let ans = minAns; ans <= maxAns; ans++) {
        uniqueSet.add(`sqrt(${ans*ans})`);
      }
    }
  });
  return uniqueSet.size;
};

export const PROBLEM_COUNTS: Record<Operation, number> = {
  multiplication: countUniqueProblems('multiplication'),
  addition: countUniqueProblems('addition'),
  subtraction: countUniqueProblems('subtraction'),
  division: countUniqueProblems('division'),
  percentage: countUniqueProblems('percentage'),
  exponentiation: countUniqueProblems('exponentiation'),
  algebra: countUniqueProblems('algebra'),
  root: countUniqueProblems('root'),
};

export const generateProblems = (level: number, count: number, operation: Operation): { problems: Problem[], answers: number[] } => {
  const config = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
  const problems: Problem[] = [];
  const usedAnswers = new Set<number>();

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
      const bVal = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
      const ansVal = Math.floor(Math.random() * (maxA - minA + 1)) + minA;
      answer = ansVal;
      factorB = bVal;
      factorA = answer + factorB; 
    }
    else if (operation === 'division') {
      const divMin = Math.max(2, config.rangeB[0]);
      const divMax = config.rangeB[1];
      const quoMin = config.rangeA[0];
      const quoMax = config.rangeA[1];

      const divisor = Math.floor(Math.random() * (divMax - divMin + 1)) + divMin;
      const quotient = Math.floor(Math.random() * (quoMax - quoMin + 1)) + quoMin;
      
      answer = quotient;
      factorB = divisor;
      factorA = quotient * divisor; 
    }
    else if (operation === 'percentage') {
      const availablePercents = level <= 3 ? [50, 100] 
        : level <= 6 ? [10, 20, 25, 50, 100]
        : [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
      
      const percent = availablePercents[Math.floor(Math.random() * availablePercents.length)];
      
      let step = 10;
      if (percent === 50) step = 2;
      if (percent === 25 || percent === 75) step = 4;
      if (percent === 5 || percent === 15) step = 20;
      if (percent === 100) step = 1;
      
      const minBase = step;
      const maxBase = Math.max(step * 5, level * 20);
      
      const steps = Math.floor((maxBase - minBase) / step) + 1;
      const base = minBase + Math.floor(Math.random() * steps) * step;

      factorA = percent;
      factorB = base;
      answer = (percent * base) / 100;
    }
    else if (operation === 'exponentiation') {
       let baseMin = 2, baseMax = 10;
       let powerMin = 2, powerMax = 2;

       if (level > 3) { powerMax = 3; }
       if (level > 7) { powerMax = 4; baseMax = 12; }

       const base = Math.floor(Math.random() * (baseMax - baseMin + 1)) + baseMin;
       
       let maxP = powerMax;
       if (base > 10) maxP = 2;
       else if (base > 5) maxP = 3;
       
       const power = Math.floor(Math.random() * (maxP - powerMin + 1)) + powerMin;

       factorA = base;
       factorB = power;
       answer = Math.pow(base, power);
    }
    else if (operation === 'algebra') {
      const addMin = Math.ceil(config.rangeA[0]);
      const addMax = Math.ceil(config.rangeA[1] * 1.5);
      const ansMin = Math.ceil(config.rangeB[0]);
      const ansMax = Math.ceil(config.rangeB[1] * 1.5);

      const constant = Math.floor(Math.random() * (addMax - addMin + 1)) + addMin;
      const xVal = Math.floor(Math.random() * (ansMax - ansMin + 1)) + ansMin;

      answer = xVal;
      factorA = constant;
      factorB = xVal + constant; 
    }
    else if (operation === 'root') {
      const minAns = 2;
      const maxAns = Math.min(5 + level, 15);
      
      answer = Math.floor(Math.random() * (maxAns - minAns + 1)) + minAns;
      factorA = answer * answer;
      factorB = 0; 
    }

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
  
  const answers = Array.from(usedAnswers).sort((a, b) => a - b);
  return { problems, answers };
};
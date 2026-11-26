// skolappar.org's usage snippet (kotten.js, loaded in index.html): anonymous counts only.
declare global { interface Window { skolappar?: { event: (name: string, value?: number) => void } } }
export const report = (name: 'round_start' | 'round_done' | 'level' | 'hint' | 'sound_off', value?: number) => window.skolappar?.event(name, value);

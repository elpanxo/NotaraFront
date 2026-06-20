'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/ui/Navbar';
import { getProgress, getRecentSongs } from '../../lib/progressStore';

const ACHIEVEMENT_DEFS = [
  {
    id: 'first-lesson',
    name: 'Primera lección',
    desc: 'Completaste tu primera canción',
    xp: 50,
    check: (p) => (p.songsCompleted || 0) >= 1,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="16" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'perfect-week',
    name: 'Semana perfecta',
    desc: '7 días seguidos estudiando',
    xp: 100,
    check: (p) => (p.streak || 0) >= 7,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'polyglot',
    name: 'Políglota',
    desc: 'Estudiaste 3 géneros distintos',
    xp: 75,
    check: () => false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'explorer',
    name: 'Explorador',
    desc: '10 canciones distintas',
    xp: 100,
    check: () => getRecentSongs().length >= 10,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'vocabulary',
    name: 'Vocabulario',
    desc: '50 palabras aprendidas',
    xp: 150,
    check: (p) => (p.wordsTotal || 0) >= 50,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 9h6M9 13h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'streak-fire',
    name: 'Racha de fuego',
    desc: '30 días seguidos',
    xp: 300,
    check: (p) => (p.streak || 0) >= 30,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M12 2c-4 4.5-5 8-5 10.5C7 17.09 9.24 21 12 21s5-3.91 5-8.5C17 10 16 6.5 12 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2c0 4 2 6 2 9a2 2 0 0 1-4 0c0-3 2-5 2-9z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const p = getProgress();
    setAchievements(
      ACHIEVEMENT_DEFS.map((def) => ({ ...def, unlocked: def.check(p) }))
    );
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = ACHIEVEMENT_DEFS.length;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">Logros</h1>
          <p className="text-brand-text text-sm">{unlocked} de {total} desbloqueados</p>
          <div className="mt-4 h-1 bg-brand-hover rounded-full max-w-xs">
            <div
              className="h-full bg-brand-green rounded-full transition-all duration-500"
              style={{ width: total > 0 ? `${(unlocked / total) * 100}%` : '0%' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`p-5 rounded-xl border transition-colors ${
                a.unlocked
                  ? 'bg-brand-card border-brand-green/20 hover:border-brand-green/40'
                  : 'bg-brand-card border-white/5 opacity-40'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                a.unlocked ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-hover text-brand-text'
              }`}>
                {a.icon}
              </div>
              <h3 className={`font-semibold text-sm mb-1 ${a.unlocked ? 'text-white' : 'text-brand-text'}`}>
                {a.name}
              </h3>
              <p className="text-brand-text text-xs leading-relaxed">{a.desc}</p>
              <div className="mt-3 flex items-center justify-between">
                {a.unlocked ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    <span className="text-brand-green text-[10px] font-semibold uppercase tracking-wide">Desbloqueado</span>
                  </div>
                ) : (
                  <span className="text-brand-text text-[10px]">Bloqueado</span>
                )}
                <span className="text-brand-text text-[10px] font-mono">+{a.xp} XP</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

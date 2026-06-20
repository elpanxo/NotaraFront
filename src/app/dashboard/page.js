'use client';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { progress as progressApi } from '../../lib/api';
import { getProgress } from '../../lib/progressStore';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';

const styles = {
  page:         'min-h-screen bg-brand-dark',
  main:         'max-w-5xl mx-auto px-4 py-8 space-y-8',
  heading:      'text-3xl font-bold text-white',
  subheading:   'text-brand-text mt-1',
  skeletonGrid: 'grid grid-cols-2 md:grid-cols-4 gap-4',
  skeletonCard: 'bg-brand-card rounded-xl p-5 h-28 animate-pulse',
  statsGrid:    'grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn',
  statCard:     'bg-brand-card rounded-xl p-5 border border-white/5 text-center',
  statIcon:     'text-3xl mb-1',
  statValue:    'text-3xl font-bold',
  statLabel:    'text-brand-text text-sm mt-1',
  chartCard:    'bg-brand-card rounded-xl p-6 border border-white/5 animate-fadeIn',
  chartTitle:   'text-white font-semibold mb-1',
  chartSub:     'text-brand-text text-xs mb-4',
  streakCard:   'bg-gradient-to-r from-orange-900/30 to-brand-card rounded-xl p-6 border border-orange-500/20 animate-fadeIn',
  streakInner:  'flex items-center gap-4',
  streakBadge:  'w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-black text-xl',
  streakTitle:  'text-white font-bold text-xl',
  streakSub:    'text-brand-text text-sm mt-1',
  emptyState:   'text-center py-8 animate-fadeIn',
  emptyTitle:   'text-white font-medium',
  emptySub:     'text-brand-text text-sm mt-1',
  ctaBtn:       'inline-block mt-4 bg-brand-green text-black font-semibold px-6 py-2 rounded-full hover:bg-green-400 transition-colors text-sm',
};

const TOOLTIP_STYLE = {
  wrapper: 'bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-sm',
  label:   'text-brand-text mb-1',
};

const levelLabel = (words) => {
  if (!words || words < 20)  return 'Principiante';
  if (words < 50)            return 'Básico';
  if (words < 100)           return 'Intermedio';
  if (words < 200)           return 'Avanzado';
  return                            'Experto';
};

function StatCard({ label: icon, value, label, color = 'text-white' }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statIcon}>{icon}</p>
      <p className={`${styles.statValue} ${color}`}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={TOOLTIP_STYLE.wrapper}>
      <p className={TOOLTIP_STYLE.label}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const DEFAULT_WEEKLY = [
  { day: 'Lun', palabras: 0 }, { day: 'Mar', palabras: 0 },
  { day: 'Mié', palabras: 0 }, { day: 'Jue', palabras: 0 },
  { day: 'Vie', palabras: 0 }, { day: 'Sáb', palabras: 0 },
  { day: 'Dom', palabras: 0 },
];

const DEFAULT_MONTHLY = [
  { semana: 'S1', palabras: 0, canciones: 0 }, { semana: 'S2', palabras: 0, canciones: 0 },
  { semana: 'S3', palabras: 0, canciones: 0 }, { semana: 'S4', palabras: 0, canciones: 0 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = getProgress();
    progressApi.getStats()
      .then((data) => setStats({ ...local, ...data }))
      .catch(() => setStats(local))
      .finally(() => setLoading(false));
  }, []);

  const weeklyData  = stats?.weeklyWords     || DEFAULT_WEEKLY;
  const monthlyData = stats?.monthlyProgress || DEFAULT_MONTHLY;

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>

        <div>
          <h1 className={styles.heading}>Mi Progreso</h1>
          <p className={styles.subheading}>
            Hola {user?.name} — aquí tienes tu historial de aprendizaje
          </p>
        </div>

        {loading ? (
          <div className={styles.skeletonGrid}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <StatCard value={stats?.streak ?? 0}              label="Días de racha"          color="text-orange-400" />
              <StatCard value={stats?.wordsTotal ?? 0}          label="Palabras aprendidas"    color="text-brand-green" />
              <StatCard value={stats?.songsCompleted ?? 0}      label="Canciones completadas"  color="text-blue-400" />
              <StatCard value={levelLabel(stats?.wordsTotal)}   label="Nivel estimado"         color="text-yellow-400" />
            </div>

            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Palabras por día — esta semana</h2>
              <p className={styles.chartSub}>Cada barra representa las palabras aprendidas ese día</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                  <XAxis dataKey="day"  tick={{ fill: '#B3B3B3', fontSize: 12 }} />
                  <YAxis               tick={{ fill: '#B3B3B3', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="palabras" fill="#1DB954" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Progreso del mes</h2>
              <p className={styles.chartSub}>Palabras y canciones por semana</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1DB954" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1DB954" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#282828" />
                  <XAxis dataKey="semana" tick={{ fill: '#B3B3B3', fontSize: 12 }} />
                  <YAxis               tick={{ fill: '#B3B3B3', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="palabras"  stroke="#1DB954" fill="url(#greenGrad)" name="Palabras" />
                  <Area type="monotone" dataKey="canciones" stroke="#60a5fa" fill="url(#blueGrad)"  name="Canciones" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {stats?.streak > 0 && (
              <div className={styles.streakCard}>
                <div className={styles.streakInner}>
                  <div className={styles.streakBadge}>{stats.streak}</div>
                  <div>
                    <p className={styles.streakTitle}>
                      {stats.streak} día{stats.streak !== 1 ? 's' : ''} de racha
                    </p>
                    <p className={styles.streakSub}>
                      Vuelve mañana para mantener tu racha
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!stats?.wordsTotal && (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Empieza tu primera lección</p>
                <p className={styles.emptySub}>
                  Busca una canción y selecciona una frase de la letra para comenzar.
                </p>
                <a href="/search" className={styles.ctaBtn}>Buscar canciones</a>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

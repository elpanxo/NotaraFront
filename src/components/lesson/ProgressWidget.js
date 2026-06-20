'use client';

const styles = {
  card:       'bg-brand-card rounded-xl p-4 border border-white/5',
  heading:    'text-white font-semibold text-sm mb-3',
  grid:       'grid grid-cols-3 gap-3',
  statBox:    'text-center',
  statValue:  'text-2xl font-bold text-brand-green',
  statLabel:  'text-brand-text text-xs mt-1',
  footer:     'mt-3 pt-3 border-t border-white/5 text-center',
  footerText: 'text-brand-text text-xs',
};

const levelLabel = (words) => {
  if (!words || words < 20)  return { label: 'Principiante', color: 'text-blue-400' };
  if (words < 50)            return { label: 'Básico',       color: 'text-green-400' };
  if (words < 100)           return { label: 'Intermedio',   color: 'text-yellow-400' };
  if (words < 200)           return { label: 'Avanzado',     color: 'text-orange-400' };
  return                            { label: 'Experto',      color: 'text-purple-400' };
};

export default function ProgressWidget({ stats }) {
  if (!stats) return null;

  const { label, color } = levelLabel(stats.wordsTotal || 0);

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>Tu progreso</h3>
      <div className={styles.grid}>

        <div className={styles.statBox}>
          <p className={styles.statValue}>{stats.streak || 0}</p>
          <p className={styles.statLabel}>Racha</p>
        </div>

        <div className={styles.statBox}>
          <p className="text-2xl font-bold text-white">{stats.wordsTotal || 0}</p>
          <p className={styles.statLabel}>Palabras</p>
        </div>

        <div className={styles.statBox}>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
          <p className={styles.statLabel}>Nivel</p>
        </div>
      </div>

      {stats.songsCompleted > 0 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {stats.songsCompleted} canción{stats.songsCompleted !== 1 ? 'es' : ''} completada{stats.songsCompleted !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

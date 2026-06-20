'use client';
import { useRouter } from 'next/navigation';

const styles = {
  card:          'group flex items-center gap-4 bg-brand-card hover:bg-brand-hover rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01]',
  albumThumb:    'relative flex-shrink-0 w-16 h-16',
  albumImg:      'w-16 h-16 rounded-lg object-cover',
  albumFallback: 'w-16 h-16 rounded-lg bg-brand-hover flex items-center justify-center text-brand-text text-xs',
  playOverlay:   'absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity',
  playIcon:      'text-white text-xl',
  info:          'flex-1 min-w-0',
  title:         'text-white font-medium truncate',
  artist:        'text-brand-text text-sm truncate',
  album:         'text-brand-text text-xs truncate mt-0.5 opacity-70',
  duration:      'text-brand-text text-sm flex-shrink-0',
};

const formatDuration = (ms) => {
  if (!ms) return '--:--';
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  return `${min}:${sec}`;
};

export default function SongCard({ song }) {
  const router = useRouter();

  return (
    <div onClick={() => router.push(`/lesson/${song.spotifyId}`)} className={styles.card}>

      <div className={styles.albumThumb}>
        {song.imageUrl ? (
          <img src={song.imageUrl} alt={song.album || song.title} className={styles.albumImg} />
        ) : (
          <div className={styles.albumFallback}>sin imagen</div>
        )}
        <div className={styles.playOverlay}>
          <span className={styles.playIcon}>▶</span>
        </div>
      </div>

      <div className={styles.info}>
        <p className={styles.title}>{song.title}</p>
        <p className={styles.artist}>{song.artist}</p>
        {song.album && <p className={styles.album}>{song.album}</p>}
      </div>

      <span className={styles.duration}>{formatDuration(song.duration)}</span>
    </div>
  );
}

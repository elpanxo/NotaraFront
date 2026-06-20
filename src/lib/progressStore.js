const KEY = 'notara_progress';
const RECENT_KEY = 'notara_recent_songs';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function emit() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('notara_progress_update'));
  }
}

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
  emit();
  syncToBackend(p);
}

function refreshStreak(p) {
  const today = new Date().toDateString();
  if (p.lastStudyDate === today) return p;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  p.streak = p.lastStudyDate === yesterday ? (p.streak || 0) + 1 : 1;
  p.lastStudyDate = today;
  p.exercisesToday = 0;
  return p;
}

// Fusiona stats del backend sobre el local, tomando el valor más alto
export function mergeFromBackend(data) {
  if (!data) return;
  try {
    const local = getProgress();
    const merged = {
      ...local,
      xp:            Math.max(local.xp || 0,            data.xp || 0),
      streak:        Math.max(local.streak || 0,        data.streak || 0),
      wordsTotal:    Math.max(local.wordsTotal || 0,    data.wordsTotal || 0),
      songsCompleted:Math.max(local.songsCompleted || 0,data.songsCompleted || 0),
    };
    localStorage.setItem(KEY, JSON.stringify(merged));
    emit();
  } catch {}
}

// Envía el progreso al backend de forma silenciosa (fire-and-forget)
function syncToBackend(p) {
  if (typeof window === 'undefined') return;
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`${API_URL}/progress/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        xp:             p.xp || 0,
        streak:         p.streak || 0,
        wordsTotal:     p.wordsTotal || 0,
        songsCompleted: p.songsCompleted || 0,
        exercisesToday: p.exercisesToday || 0,
        lastStudyDate:  p.lastStudyDate || '',
        completedSongIds: JSON.stringify(p.completedSongIds || []),
      }),
    }).catch(() => {});
  } catch {}
}

export function addXP(amount) {
  const p = refreshStreak(getProgress());
  p.xp = (p.xp || 0) + amount;
  save(p);
  return p;
}

export function recordWordLearned(count = 1) {
  const p = refreshStreak(getProgress());
  p.wordsTotal = (p.wordsTotal || 0) + count;
  p.exercisesToday = (p.exercisesToday || 0) + count;

  if (!p.weeklyWords) p.weeklyWords = DAYS.map(d => ({ day: d, palabras: 0 }));
  const dayIdx = new Date().getDay();
  p.weeklyWords[dayIdx].palabras = (p.weeklyWords[dayIdx].palabras || 0) + count;

  const week = `S${Math.min(Math.ceil(new Date().getDate() / 7), 4)}`;
  if (!p.monthlyProgress)
    p.monthlyProgress = ['S1','S2','S3','S4'].map(s => ({ semana: s, palabras: 0, canciones: 0 }));
  const wi = p.monthlyProgress.findIndex(w => w.semana === week);
  if (wi >= 0) p.monthlyProgress[wi].palabras += count;

  save(p);
  return p;
}

export function recordSongCompleted(song) {
  const p = refreshStreak(getProgress());

  if (!p.completedSongIds) p.completedSongIds = [];
  if (!p.completedSongIds.includes(song.spotifyId)) {
    p.completedSongIds.push(song.spotifyId);
  }
  p.songsCompleted = p.completedSongIds.length;

  const week = `S${Math.min(Math.ceil(new Date().getDate() / 7), 4)}`;
  if (!p.monthlyProgress)
    p.monthlyProgress = ['S1','S2','S3','S4'].map(s => ({ semana: s, palabras: 0, canciones: 0 }));
  const wi = p.monthlyProgress.findIndex(w => w.semana === week);
  if (wi >= 0) p.monthlyProgress[wi].canciones += 1;

  p.xp = (p.xp || 0) + 50;
  save(p);
  addRecentSong(song);
  return getProgress();
}

export function addRecentSong(song) {
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const updated = [
      { spotifyId: song.spotifyId, title: song.title, artist: song.artist, imageUrl: song.imageUrl, album: song.album },
      ...recent.filter(s => s.spotifyId !== song.spotifyId),
    ].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentSongs() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

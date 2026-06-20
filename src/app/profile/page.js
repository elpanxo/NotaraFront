'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { getProgress, getRecentSongs } from '../../lib/progressStore';

const PROFILE_KEY = 'notara_profile';

const AVATAR_COLORS = [
  { label: 'Verde',   value: '#22c55e' },
  { label: 'Morado',  value: '#8b5cf6' },
  { label: 'Azul',    value: '#60a5fa' },
  { label: 'Naranja', value: '#f97316' },
  { label: 'Rosa',    value: '#ec4899' },
  { label: 'Teal',    value: '#14b8a6' },
];

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Reggaeton', 'Electrónica', 'Jazz', 'K-Pop', 'Indie', 'Country', 'Soul', 'Metal'];

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000];
function getLevel(xp) { return LEVEL_THRESHOLDS.filter(t => xp >= t).length; }
function levelLabel(words) {
  if (!words || words < 20) return 'Principiante';
  if (words < 50)  return 'Básico';
  if (words < 100) return 'Intermedio';
  if (words < 200) return 'Avanzado';
  return 'Experto';
}
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') || {}; }
  catch { return {}; }
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile]   = useState({ nickname: '', bio: '', genres: [], avatarColor: '#22c55e' });
  const [progress, setProgress] = useState({});
  const [recentCount, setRecentCount] = useState(0);
  const [saved, setSaved]       = useState(false);
  const [editing, setEditing]   = useState(false);

  useEffect(() => {
    const stored = loadProfile();
    setProfile({
      nickname:    stored.nickname    || '',
      bio:         stored.bio         || '',
      genres:      stored.genres      || [],
      avatarColor: stored.avatarColor || '#22c55e',
    });
    setProgress(getProgress());
    setRecentCount(getRecentSongs().length);
  }, []);

  const save = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('notara_profile_update'));
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleGenre = (genre) => {
    setProfile(p => ({
      ...p,
      genres: p.genres.includes(genre)
        ? p.genres.filter(g => g !== genre)
        : [...p.genres, genre],
    }));
  };

  const displayName = profile.nickname || user?.name || 'Usuario';
  const xp = progress.xp || 0;
  const level = getLevel(xp);

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Header de perfil */}
        <div className="bg-brand-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-start gap-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl select-none"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {getInitials(displayName)}
              </div>
              {editing && (
                <div className="flex gap-2 flex-wrap justify-center max-w-[120px]">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      onClick={() => setProfile(p => ({ ...p, avatarColor: c.value }))}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${profile.avatarColor === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-brand-card' : ''}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <input
                    value={profile.nickname}
                    onChange={(e) => setProfile(p => ({ ...p, nickname: e.target.value }))}
                    placeholder={user?.name || 'Nickname'}
                    maxLength={30}
                    className="w-full bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none focus:border-brand-green transition-colors"
                  />
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Cuéntanos algo sobre ti..."
                    maxLength={200}
                    rows={3}
                    className="w-full bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none focus:border-brand-green transition-colors resize-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-white">{displayName}</h1>
                  {user?.email && <p className="text-brand-text text-sm mt-0.5">{user.email}</p>}
                  <p className="text-brand-text text-sm mt-2 leading-relaxed">
                    {profile.bio || 'Sin descripción — edita tu perfil para agregar una.'}
                  </p>
                </>
              )}
            </div>

            {/* Acciones */}
            <div className="flex-shrink-0">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setProfile(loadProfile() || {}); }}
                    className="px-3 py-1.5 text-sm text-brand-text border border-white/10 rounded-lg hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={save}
                    className="px-3 py-1.5 text-sm bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
                  >
                    {saved ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-sm border border-white/10 text-brand-text hover:text-white hover:border-white/20 rounded-lg transition-colors"
                >
                  Editar perfil
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: `Nv. ${level}`, label: 'Nivel', color: 'text-brand-green' },
            { value: xp,             label: 'XP total',          color: 'text-brand-green' },
            { value: progress.streak || 0, label: 'Días de racha', color: 'text-orange-400' },
            { value: progress.wordsTotal || 0, label: 'Palabras',  color: 'text-blue-400' },
          ].map((s) => (
            <div key={s.label} className="bg-brand-card rounded-xl p-4 border border-white/5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-brand-text text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gustos musicales */}
        <div className="bg-brand-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Gustos musicales</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-brand-text text-xs hover:text-white transition-colors">
                Editar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const active = profile.genres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => editing && toggleGenre(genre)}
                  disabled={!editing}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    active
                      ? 'bg-brand-green/15 text-brand-green border-brand-green/30 font-medium'
                      : 'border-white/10 text-brand-text hover:border-white/20'
                  } ${editing ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
          {!editing && profile.genres.length === 0 && (
            <p className="text-brand-text text-sm mt-2">Sin géneros seleccionados — edita tu perfil para agregar.</p>
          )}
        </div>

        {/* Actividad rápida */}
        <div className="bg-brand-card rounded-2xl p-6 border border-white/5">
          <h2 className="text-white font-semibold mb-4">Actividad</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">{progress.songsCompleted || 0}</p>
              <p className="text-brand-text text-xs mt-1">Canciones completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{recentCount}</p>
              <p className="text-brand-text text-xs mt-1">Canciones exploradas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{levelLabel(progress.wordsTotal)}</p>
              <p className="text-brand-text text-xs mt-1">Nivel estimado</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

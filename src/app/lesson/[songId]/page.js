'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { songs as songsApi, progress as progressApi, ia } from '../../../lib/api';
import { addXP, recordWordLearned, recordSongCompleted, addRecentSong, getProgress, mergeFromBackend } from '../../../lib/progressStore';
import Navbar from '../../../components/ui/Navbar';
import SpotifyEmbedPlayer from '../../../components/ui/SpotifyEmbedPlayer';
import SpotifySDKPlayer   from '../../../components/ui/SpotifySDKPlayer';
import { LYRICS_STRATEGIES, getLyricsStrategy } from '../../../patterns/LyricsDisplayStrategy';

const BADGE_COLORS = {
  green:  'bg-brand-green/20 text-brand-green',
  orange: 'bg-brand-orange/20 text-brand-orange',
  purple: 'bg-brand-purple/20 text-brand-purple',
};

const DOT_COLORS = {
  known:    'bg-brand-green',
  learning: 'bg-brand-orange',
  new:      'bg-brand-text',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLRC(lrc) {
  if (!lrc) return [];
  return lrc
    .split('\n')
    .map((line) => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (!match) return null;
      return {
        time: parseInt(match[1]) * 60 + parseFloat(match[2]),
        text: match[3].trim(),
      };
    })
    .filter(Boolean);
}

function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-brand-text text-[10px] font-semibold uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function ExerciseCard({ badge, color, title, desc, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-3 rounded-xl bg-brand-hover hover:bg-white/5 border border-white/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BADGE_COLORS[color]}`}>
        {badge}
      </span>
      <p className="text-white text-sm font-medium mt-2 group-hover:text-brand-green transition-colors">
        {title}
      </p>
      <p className="text-brand-text text-xs mt-0.5">{desc}</p>
    </button>
  );
}

function QuizChat({ exercises, onXP }) {
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([{ role: 'ai', content: exercises[0].question }]);
  const [input, setInput]       = useState('');
  const [current, setCurrent]   = useState(0);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const exercise = exercises[current];

  const submit = (answer) => {
    if (!answer.trim() || done) return;
    const correct  = answer.toLowerCase().trim() === (exercise.answer || '').toLowerCase().trim();
    const newScore = score + (correct ? 1 : 0);
    if (correct) onXP(10);
    setScore(newScore);
    setInput('');

    const next   = current + 1;
    const isLast = next >= exercises.length;

    setMessages(prev => [
      ...prev,
      { role: 'user', content: answer },
      {
        role:    'ai',
        content: correct
          ? `Correcto!${exercise.explanation ? ` ${exercise.explanation}` : ''}`
          : `No es correcto. La respuesta es "${exercise.answer}".${exercise.explanation ? ` ${exercise.explanation}` : ''}`,
        correct,
      },
      ...(isLast
        ? [{ role: 'ai', content: `Terminaste el quiz! ${newScore}/${exercises.length} correctas · +${newScore * 10} XP`, isDone: true }]
        : [{ role: 'ai', content: exercises[next].question }]
      ),
    ]);

    if (isLast) {
      setDone(true);
    } else {
      setCurrent(next);
    }
  };

  return (
    <div className="bg-brand-card rounded-xl border border-white/10 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-brand-text uppercase tracking-widest">
          {done ? 'Quiz completado' : `Pregunta ${current + 1} de ${exercises.length}`}
        </p>
        {done && <span className="text-brand-green text-[10px] font-semibold">{score}/{exercises.length}</span>}
      </div>

      <div className="h-52 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' ? (
              <p className={`text-xs max-w-[90%] leading-relaxed ${
                msg.isDone          ? 'text-brand-green font-semibold' :
                msg.correct === true  ? 'text-brand-green' :
                msg.correct === false ? 'text-red-400' :
                'text-brand-text'
              }`}>
                {msg.content}
              </p>
            ) : (
              <span className="bg-brand-purple/80 text-white text-xs px-2.5 py-1 rounded-lg max-w-[85%] leading-relaxed">
                {msg.content}
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!done && (
        <div className="p-3 border-t border-white/5">
          {exercise.type === 'multiple-choice' ? (
            <div className="space-y-1.5">
              {(exercise.options || []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => submit(opt)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg border border-white/10 text-brand-text hover:border-brand-green/40 hover:text-white text-xs transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit(input)}
                placeholder="Tu respuesta..."
                className="flex-1 bg-brand-hover border border-white/5 rounded-lg px-2 py-1.5 text-white text-xs placeholder-brand-text focus:outline-none focus:border-brand-purple/50 transition-colors"
              />
              <button
                onClick={() => submit(input)}
                disabled={!input.trim()}
                className="px-2 py-1.5 rounded-lg bg-brand-purple hover:bg-violet-500 disabled:opacity-40 transition-colors text-white text-xs"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, value, max, color = 'bg-brand-green' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-brand-text">{label}</span>
        <span className="text-white font-medium">{value}{max ? `/${max}` : ''}</span>
      </div>
      <div className="h-1.5 bg-brand-hover rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LessonPage() {
  const { songId } = useParams();
  const router     = useRouter();

  // ── Token de Spotify Premium ──────────────────────────────────────────────
  const [spotifyToken, setSpotifyToken] = useState(null);

  useEffect(() => {
    // 1) Leer token desde URL params (vuelta del callback OAuth)
    const urlParams    = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('spotify_token');
    const refresh      = urlParams.get('spotify_refresh');

    if (tokenFromUrl) {
      localStorage.setItem('spotify_token', tokenFromUrl);
      if (refresh) localStorage.setItem('spotify_refresh', refresh);
      window.history.replaceState({}, '', window.location.pathname);
      setSpotifyToken(tokenFromUrl);
      return;
    }

    // 2) Leer token desde localStorage (sesión previa)
    const saved = localStorage.getItem('spotify_token');
    if (saved) setSpotifyToken(saved);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const [song, setSong]             = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [parsedLines, setParsedLines] = useState([]);
  const [lessonInfo, setLessonInfo] = useState(null);
  const [stats, setStats]           = useState(null);
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState(-1);
  const lyricsContainerRef = useRef(null);

  const [lyricsMode, setLyricsMode] = useState('en-only');
  const [translations, setTranslations] = useState({});
  const [keywords, setKeywords]     = useState([]);
  const [lessonDone, setLessonDone] = useState(false);

  const [sideMode, setSideMode]                 = useState('quiz');
  const [exerciseSet, setExerciseSet]           = useState(null);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setTranslations({});
    setKeywords([]);
    setActiveLineIdx(-1);
    setLessonDone(false);
    setSideMode('quiz');
    setExerciseSet(null);
    setExercisesLoading(false);
  }, [songId]);

  useEffect(() => {
    if (!songId) return;

    const load = async () => {
      setLoading(true);
      try {
        const [songRes, lyricsRes, lessonRes, statsRes] = await Promise.allSettled([
          songsApi.getById(songId),
          songsApi.getLyrics(songId),
          songsApi.getLessonType(songId),
          progressApi.getStats(),
        ]);

        const songData = songRes.status === 'fulfilled' ? songRes.value?.song : null;
        if (songData) {
          setSong(songData);
          addRecentSong(songData);
          songsApi.search(songData.artist, 4)
            .then((d) => setRelatedSongs((d.results || []).filter(s => s.spotifyId !== songId).slice(0, 3)))
            .catch(() => {});

          setExercisesLoading(true);
          ia.getExercises(songId, `${songData.title} ${songData.artist}`)
            .then(data => setExerciseSet(data.exercises || []))
            .catch(() => {})
            .finally(() => setExercisesLoading(false));
        }

        if (lyricsRes.status === 'fulfilled') {
          const ld = lyricsRes.value;
          setLyricsData(ld);
          if (ld.synced) setParsedLines(parseLRC(ld.lyrics));
        }

        if (lessonRes.status === 'fulfilled') {
          const lesson = lessonRes.value?.lesson;
          setLessonInfo(lesson);
          if (lesson?.exercises?.length) {
            const kw = lesson.exercises
              .filter(e => e.targetWord)
              .slice(0, 6)
              .map((e, i) => ({
                word:        e.targetWord,
                translation: e.translation || '—',
                level:       i < 2 ? 'known' : i < 4 ? 'learning' : 'new',
              }));
            if (kw.length) setKeywords(kw);
          }
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          mergeFromBackend(statsRes.value);
        }
        const localProgress = getProgress();
        setStats(statsRes.status === 'fulfilled' && statsRes.value
          ? { ...localProgress, ...statsRes.value }
          : localProgress
        );
      } catch {
        setError('Error al cargar la canción');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [songId]);

  useEffect(() => {
    if (!parsedLines.length) return;
    let idx = -1;
    for (let i = 0; i < parsedLines.length; i++) {
      if (parsedLines[i].time <= currentTime) idx = i;
      else break;
    }
    if (idx !== activeLineIdx) {
      setActiveLineIdx(idx);
      const el = lyricsContainerRef.current?.querySelector(`[data-line="${idx}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, parsedLines, activeLineIdx]);

  const handleTimeUpdate = useCallback((seconds) => setCurrentTime(seconds), []);

  const handleLineClick = (line) => {
    if (!line.trim()) return;
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);

    try {
      const data = await ia.chat(songId, message, chatMessages);
      setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      addXP(2);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Error al responder. Intenta de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const displayLines = parsedLines.length > 0
    ? parsedLines
    : (lyricsData?.lyrics && !lyricsData.synced)
      ? lyricsData.lyrics.split('\n').filter(l => l.trim()).map(text => ({ text, time: null }))
      : [];

  if (loading) {
    return (
      <div className="h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-green border-t-transparent animate-spin mx-auto" />
          <p className="text-brand-text mt-4 text-sm">Cargando lección...</p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="h-screen bg-brand-dark flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-white text-lg mb-4">{error || 'Canción no encontrada'}</p>
            <button onClick={() => router.push('/search')} className="text-brand-green hover:underline text-sm">
              ← Volver a buscar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-dark overflow-hidden">
      <Navbar lessonBadge={lessonInfo?.type ? capitalize(lessonInfo.type) : undefined} />

      <div className="flex flex-1 overflow-hidden">

        {/* ═══════════════ COLUMNA IZQUIERDA ═══════════════ */}
        <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/5 overflow-y-auto p-4 space-y-5">

          <div>
            <SectionLabel>Reproduciendo</SectionLabel>
            {song.imageUrl && (
              <img
                src={song.imageUrl}
                alt={song.album || song.title}
                className="w-full aspect-square rounded-xl object-cover mb-3"
              />
            )}
            <p className="text-white font-semibold text-sm truncate">{song.title}</p>
            <p className="text-brand-text text-xs truncate">{song.artist}</p>
            {song.album && (
              <p className="text-brand-text text-xs truncate opacity-60 mt-0.5">{song.album}</p>
            )}

            {/* Player — SDK completo si tiene Premium, embed si no */}
            <div className="mt-3">
              {spotifyToken ? (
                <SpotifySDKPlayer
                  spotifyId={songId}
                  token={spotifyToken}
                  onTimeUpdate={handleTimeUpdate}
                />
              ) : (
                <div className="space-y-2">
                  <SpotifyEmbedPlayer spotifyId={songId} onTimeUpdate={handleTimeUpdate} />
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/spotify?songId=${songId}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-xs transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.302a.748.748 0 0 1-1.03.25c-2.819-1.723-6.365-2.113-10.542-1.157a.748.748 0 0 1-.332-1.459c4.571-1.044 8.492-.595 11.655 1.337a.748.748 0 0 1 .249 1.029zm1.473-3.275a.937.937 0 0 1-1.288.308c-3.226-1.983-8.144-2.558-11.96-1.4a.937.937 0 1 1-.543-1.794c4.358-1.323 9.776-.681 13.483 1.596a.937.937 0 0 1 .308 1.29zm.127-3.409C15.496 8.412 9.439 8.209 5.87 9.309a1.124 1.124 0 1 1-.653-2.151c4.118-1.25 10.963-1.008 15.295 1.6a1.124 1.124 0 0 1-1.396 1.76z" />
                    </svg>
                    Conectar Premium
                  </a>
                </div>
              )}
            </div>
          </div>

          {lessonInfo && (
            <div>
              <SectionLabel>Tipo de lección</SectionLabel>
              <span className="inline-block bg-brand-purple/20 text-brand-purple text-xs font-semibold px-3 py-1 rounded-full">
                {capitalize(lessonInfo.type || 'General')}
              </span>
              {lessonInfo.focus && (
                <p className="text-brand-text text-xs mt-2">{lessonInfo.focus}</p>
              )}
            </div>
          )}

          {keywords.length > 0 && (
            <div className="flex-1">
              <SectionLabel>Palabras clave</SectionLabel>
              <div className="space-y-2">
                {keywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-xs font-medium truncate">{kw.word}</p>
                      <p className="text-brand-text text-[10px] truncate">{kw.translation}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[kw.level]}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

        {/* ═══════════════ COLUMNA CENTRAL ═══════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-white/5">

          <div className="flex-shrink-0 flex items-center gap-1 px-4 py-3 border-b border-white/5">
            {LYRICS_STRATEGIES.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => setLyricsMode(strategy.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  lyricsMode === strategy.id
                    ? 'bg-brand-green/15 text-brand-green font-semibold ring-1 ring-brand-green/30'
                    : 'text-brand-text hover:text-white hover:bg-brand-hover'
                }`}
              >
                {strategy.label}
              </button>
            ))}
            {lyricsData?.synced && (
              <span className="ml-auto text-brand-green text-[10px] font-medium">Sincronizada</span>
            )}
          </div>

          <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto px-4 py-3">
            {displayLines.length > 0 ? (
              getLyricsStrategy(lyricsMode).render({
                lines:       displayLines,
                translations,
                activeIdx:   activeLineIdx,
                onLineClick: handleLineClick,
              })
            ) : (
              <p className="text-brand-text text-sm text-center py-12">
                No encontramos la letra de esta canción.
              </p>
            )}
          </div>


        </main>

        {/* ═══════════════ COLUMNA DERECHA ═══════════════ */}
        <aside className="w-72 flex-shrink-0 flex flex-col min-h-0">

          {/* Completar lección — siempre visible */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-white/5">
            {lessonDone ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand-green/10 border border-brand-green/20">
                <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-brand-green">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-brand-green text-sm font-semibold">Lección completada</p>
                  <p className="text-brand-text text-xs">+50 XP ganados</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  const p = recordSongCompleted(song);
                  setStats(s => ({ ...s, ...p }));
                  setLessonDone(true);
                }}
                className="w-full py-2.5 rounded-xl bg-brand-green text-black font-semibold text-sm hover:bg-brand-green/90 transition-colors shadow-[0_0_16px_rgba(34,197,94,0.25)]"
              >
                Completar lección +50 XP
              </button>
            )}
          </div>

          {/* Tabs de modo — siempre visibles */}
          <div className="flex-shrink-0 flex border-b border-white/5">
            <button
              onClick={() => setSideMode('quiz')}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                sideMode === 'quiz'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-brand-text hover:text-white'
              }`}
            >
              Quiz
            </button>
            <button
              onClick={() => setSideMode('chat')}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                sideMode === 'chat'
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-brand-text hover:text-white'
              }`}
            >
              Chat
            </button>
          </div>

          {/* Contenido scrollable según el modo */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {sideMode === 'quiz' && (
              <div className="p-4 space-y-5">
                {exercisesLoading ? (
                  <div className="flex items-center gap-2 py-3">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin flex-shrink-0" />
                    <p className="text-brand-text text-xs">Generando preguntas...</p>
                  </div>
                ) : exerciseSet ? (
                  <QuizChat
                    exercises={exerciseSet}
                    onXP={(amount) => { addXP(amount); setStats(getProgress()); }}
                  />
                ) : null}

                {stats && (
                  <div>
                    <SectionLabel>Tu progreso</SectionLabel>
                    <div className="bg-brand-card rounded-xl p-4 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-orange/15 flex items-center justify-center">
                          <span className="text-brand-orange font-black text-sm">{stats.streak || 0}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">Racha actual</p>
                          <p className="text-brand-text text-xs">{stats.streak || 0} día{stats.streak !== 1 ? 's' : ''} seguido{stats.streak !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <ProgressBar label="Vocabulario aprendido" value={stats.wordsTotal || 0} max={100} color="bg-brand-green" />
                        <ProgressBar label="Lecciones completadas" value={stats.songsCompleted || 0} max={12} color="bg-brand-green" />
                        <ProgressBar label="Ejercicios hoy" value={stats.exercisesToday || 0} max={5} color="bg-brand-orange" />
                      </div>
                    </div>
                  </div>
                )}

                {relatedSongs.length > 0 && (
                  <div>
                    <SectionLabel>Canciones relacionadas</SectionLabel>
                    <div className="space-y-2">
                      {relatedSongs.map((s) => (
                        <button
                          key={s.spotifyId}
                          onClick={() => router.push(`/lesson/${s.spotifyId}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-brand-hover transition-colors group text-left"
                        >
                          {s.imageUrl ? (
                            <img src={s.imageUrl} alt={s.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-brand-hover flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-white text-xs font-medium truncate group-hover:text-brand-green transition-colors">{s.title}</p>
                            <p className="text-brand-text text-[10px] truncate">{s.artist}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sideMode === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'ai' ? (
                        <p className="text-brand-text text-xs max-w-[85%] leading-relaxed">{msg.content}</p>
                      ) : (
                        <span className="bg-brand-purple text-white text-xs px-2 py-1 rounded-lg max-w-[85%] leading-relaxed">
                          {msg.content}
                        </span>
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-1 px-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1 h-1 bg-brand-text rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex gap-1.5 p-4 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Preguntá sobre la canción..."
                    className="flex-1 bg-brand-hover border border-white/5 rounded-lg px-2 py-1.5 text-white text-xs placeholder-brand-text focus:outline-none focus:border-brand-purple/50 transition-colors"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="px-2 py-1.5 rounded-lg bg-brand-purple hover:bg-violet-500 disabled:opacity-40 transition-colors flex items-center justify-center text-white text-xs"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

          </div>

        </aside>

      </div>
    </div>
  );
}

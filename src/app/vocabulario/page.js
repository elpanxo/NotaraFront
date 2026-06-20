'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { vocabulario as vocApi } from '../../lib/api';

const FASE = { START: 'start', GAME: 'game', RESULTS: 'results' };

const CATEGORIAS_FALLBACK = ['BASICO', 'HOGAR', 'ANIMALES', 'ALIMENTOS', 'VERBOS', 'AVANZADO'];

function TimerBar({ segundos, maxSegundos }) {
  const pct = Math.max(0, (segundos / maxSegundos) * 100);
  const color = pct > 50 ? 'bg-brand-green' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="h-1.5 bg-brand-hover rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function VocabularioPage() {
  const { user } = useAuth();

  const [fase, setFase] = useState(FASE.START);
  const [categorias, setCategorias] = useState([]);
  const [config, setConfig] = useState({ categoria: '', totalPreguntas: 10, tiempoMaximoSegundos: 30 });
  const [pregunta, setPregunta] = useState(null);
  const [idPartida, setIdPartida] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    vocApi.categorias()
      .then((data) => {
        // El endpoint devuelve Map<String, Long> → objeto JS, no array
        const cats = Array.isArray(data)
          ? data.map((c) => c.categoria || c)
          : (data && typeof data === 'object' ? Object.keys(data) : []);
        const result = cats.length > 0 ? cats : CATEGORIAS_FALLBACK;
        setCategorias(result);
        setConfig((c) => ({ ...c, categoria: result[0] }));
      })
      .catch(() => {
        setCategorias(CATEGORIAS_FALLBACK);
        setConfig((c) => ({ ...c, categoria: CATEGORIAS_FALLBACK[0] }));
      });
  }, []);

  const startTimer = (segundos) => {
    clearInterval(intervalRef.current);
    setTimer(segundos);
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          handleResponder('');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const iniciar = async () => {
    if (!config.categoria) { setError('Selecciona una categoría'); return; }
    setLoading(true);
    setError('');
    const userId = Number(user?.id);
    if (!userId || isNaN(userId)) {
      setError('Debes iniciar sesión con una cuenta real para jugar');
      setLoading(false);
      return;
    }
    try {
      const firstQ = await vocApi.iniciarPartida(
        userId,
        user?.name || 'Jugador',
        config.categoria,
        config.totalPreguntas,
        config.tiempoMaximoSegundos,
      );
      setIdPartida(firstQ.idPartida);
      setPregunta(firstQ);
      setFeedback(null);
      setRespuesta('');
      setFase(FASE.GAME);
      startTimer(firstQ.tiempoMaximoSegundos || config.tiempoMaximoSegundos);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      setError(e.message || 'No se pudo iniciar la partida');
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (ans) => {
    if (feedback) return;
    clearInterval(intervalRef.current);
    const respuestaEnviada = ans !== undefined ? ans : respuesta;
    try {
      const res = await vocApi.responder(idPartida, respuestaEnviada);
      setFeedback(res);
      if (res.gameOver) {
        setResumen(res.resumen);
        vocApi.rankingGlobal().then((r) => setRanking(Array.isArray(r) ? r : [])).catch(() => {});
        setTimeout(() => setFase(FASE.RESULTS), 1800);
      } else if (res.siguientePregunta) {
        setTimeout(() => {
          setPregunta(res.siguientePregunta);
          setFeedback(null);
          setRespuesta('');
          startTimer(res.siguientePregunta.tiempoMaximoSegundos || config.tiempoMaximoSegundos);
          inputRef.current?.focus();
        }, 1500);
      }
    } catch (e) {
      setError(e.message || 'Error al enviar respuesta');
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') handleResponder(); };

  const reiniciar = () => {
    setFase(FASE.START);
    setPregunta(null);
    setIdPartida(null);
    setFeedback(null);
    setResumen(null);
    setRespuesta('');
    setError('');
  };

  const inputClass = 'w-full bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none focus:border-brand-green transition-colors';

  if (fase === FASE.START) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Vocabulario</h1>
            <p className="text-brand-text">Pon a prueba tu inglés respondiendo definiciones</p>
          </div>

          <div className="bg-brand-card rounded-2xl border border-white/5 p-6 space-y-5">
            <div>
              <label className="text-brand-text text-xs mb-1.5 block">Categoría</label>
              {categorias.length === 0 ? (
                <p className="text-brand-text text-sm italic">Cargando categorías…</p>
              ) : (
                <select
                  className={inputClass}
                  value={config.categoria}
                  onChange={(e) => setConfig((c) => ({ ...c, categoria: e.target.value }))}
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat} className="bg-brand-dark">{cat}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-brand-text text-xs mb-1.5 block">
                Preguntas: <span className="text-white font-semibold">{config.totalPreguntas}</span>
              </label>
              <input
                type="range" min={5} max={20} step={1}
                value={config.totalPreguntas}
                onChange={(e) => setConfig((c) => ({ ...c, totalPreguntas: Number(e.target.value) }))}
                className="w-full accent-brand-green"
              />
            </div>

            <div>
              <label className="text-brand-text text-xs mb-1.5 block">
                Tiempo por pregunta: <span className="text-white font-semibold">{config.tiempoMaximoSegundos}s</span>
              </label>
              <input
                type="range" min={10} max={120} step={5}
                value={config.tiempoMaximoSegundos}
                onChange={(e) => setConfig((c) => ({ ...c, tiempoMaximoSegundos: Number(e.target.value) }))}
                className="w-full accent-brand-green"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={iniciar}
              disabled={loading || categorias.length === 0}
              className="w-full py-3 bg-brand-green text-black font-bold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-60"
            >
              {loading ? 'Iniciando…' : 'Comenzar partida'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === FASE.GAME && pregunta) {
    const isCorrect = feedback?.esCorrecta;
    const isWrong = feedback && !feedback.esCorrecta && !feedback.tiempoAgotado;
    const isTimeout = feedback?.tiempoAgotado;

    return (
      <div className="min-h-screen bg-brand-dark">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-brand-text text-sm">
              Pregunta <span className="text-white font-semibold">{pregunta.numeroPregunta}</span> / {pregunta.totalPreguntas}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-brand-text text-sm">
                Racha <span className="text-yellow-400 font-semibold">{pregunta.rachaActual ?? 0}</span>
              </span>
              <span className="text-brand-text text-sm">
                Puntos <span className="text-brand-green font-semibold">{pregunta.puntuacionActual ?? 0}</span>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <TimerBar segundos={timer} maxSegundos={pregunta.tiempoMaximoSegundos || config.tiempoMaximoSegundos} />
            <p className="text-right text-brand-text text-xs mt-1">{timer}s</p>
          </div>

          <div className="bg-brand-card rounded-2xl border border-white/5 p-6 space-y-4">
            <div>
              <p className="text-brand-text text-xs mb-1">Categoría: <span className="text-white">{pregunta.categoria}</span></p>
              <p className="text-white text-base leading-relaxed">{pregunta.definicion}</p>
              {pregunta.pista && (
                <p className="text-brand-text text-xs mt-2 italic">Pista: {pregunta.pista}</p>
              )}
            </div>

            <input
              ref={inputRef}
              className={`${inputClass} ${isCorrect ? 'border-brand-green' : isWrong || isTimeout ? 'border-red-400' : ''}`}
              placeholder="Escribe la palabra en inglés…"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onKeyDown={onKey}
              disabled={!!feedback}
            />

            {feedback && (
              <div className={`rounded-lg px-4 py-3 text-sm ${isCorrect ? 'bg-brand-green/15 text-brand-green' : 'bg-red-500/15 text-red-400'}`}>
                {isTimeout && <p className="font-semibold mb-0.5">Tiempo agotado</p>}
                {isWrong && <p className="font-semibold mb-0.5">Incorrecto</p>}
                {isCorrect && <p className="font-semibold mb-0.5">+{feedback.puntosObtenidos} puntos</p>}
                {!isCorrect && <p>Respuesta correcta: <strong>{feedback.respuestaCorrecta}</strong></p>}
              </div>
            )}

            {!feedback && (
              <button
                onClick={() => handleResponder()}
                className="w-full py-2.5 bg-brand-green text-black font-semibold rounded-xl hover:bg-green-400 transition-colors"
              >
                Responder
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            <button onClick={reiniciar} className="text-brand-text text-sm hover:text-white transition-colors">
              Abandonar partida
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === FASE.RESULTS) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-1">Partida terminada</h1>
            <p className="text-brand-text text-sm">Aquí tienes tu resultado</p>
          </div>

          {resumen && (
            <div className="bg-brand-card rounded-2xl border border-white/5 p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-brand-green">{resumen.puntuacionFinal ?? resumen.puntuacion ?? 0}</p>
                  <p className="text-brand-text text-xs mt-1">Puntuación</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{resumen.palabrasCorrectas ?? 0}</p>
                  <p className="text-brand-text text-xs mt-1">Correctas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-400">{resumen.rachaMaxima ?? 0}</p>
                  <p className="text-brand-text text-xs mt-1">Racha máx.</p>
                </div>
              </div>
            </div>
          )}

          {ranking.length > 0 && (
            <div className="bg-brand-card rounded-2xl border border-white/5 p-5">
              <h2 className="text-white font-semibold mb-3">Ranking global</h2>
              <div className="space-y-2">
                {ranking.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-brand-text'}`}>
                      {i + 1}
                    </span>
                    <span className="text-white text-sm flex-1 truncate">{r.nombreUsuario || r.nombre || 'Jugador'}</span>
                    <span className="text-brand-green text-sm font-semibold">{r.puntuacion ?? r.puntuacionTotal ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={reiniciar}
            className="w-full py-3 bg-brand-green text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return null;
}

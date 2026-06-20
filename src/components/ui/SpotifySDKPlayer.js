'use client';
import { useEffect, useRef, useState } from 'react';

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function SpotifySDKPlayer({ spotifyId, token, onTimeUpdate }) {
  const playerRef   = useRef(null);
  const deviceIdRef = useRef(null);
  const pollRef     = useRef(null);

  const [isReady,  setIsReady]  = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [error,    setError]    = useState(null);
  const [track,    setTrack]    = useState(null);

  useEffect(() => {
    if (!token || !spotifyId) return;

    const loadSDK = () =>
      new Promise((resolve) => {
        if (window.Spotify) { resolve(); return; }
        window.onSpotifyWebPlaybackSDKReady = resolve;
        if (!document.getElementById('spotify-sdk-script')) {
          const script = document.createElement('script');
          script.id    = 'spotify-sdk-script';
          script.src   = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          document.body.appendChild(script);
        }
      });

    const init = async () => {
      await loadSDK();

      const player = new window.Spotify.Player({
        name: 'Notara Player',
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      });
      playerRef.current = player;

      player.addListener('ready', async ({ device_id }) => {
        deviceIdRef.current = device_id;
        setIsReady(true);
        setError(null);
        try {
          await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${device_id}`,
            {
              method:  'PUT',
              headers: {
                Authorization:  `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ uris: [`spotify:track:${spotifyId}`] }),
            }
          );
          setIsPaused(false);
        } catch {
          setError('No se pudo iniciar la reproducción. Intentá de nuevo.');
        }
      });

      player.addListener('not_ready', () => setIsReady(false));

      player.addListener('player_state_changed', (state) => {
        if (!state) return;
        setIsPaused(state.paused);
        onTimeUpdate?.(state.position / 1000);
        const current = state.track_window?.current_track;
        if (current) {
          setTrack({
            name:     current.name,
            artist:   current.artists.map((a) => a.name).join(', '),
            duration: state.duration,
            position: state.position,
          });
        }
      });

      player.addListener('authentication_error', () => {
        setError('Token de Spotify expirado. Reconectá tu cuenta.');
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_refresh');
      });

      player.addListener('account_error', () => {
        setError('Se requiere Spotify Premium para reproducción completa.');
      });

      player.connect();

      pollRef.current = setInterval(async () => {
        const state = await player.getCurrentState().catch(() => null);
        if (state && !state.paused) {
          onTimeUpdate?.(state.position / 1000);
          setTrack((prev) => (prev ? { ...prev, position: state.position } : prev));
        }
      }, 1000);
    };

    init();

    return () => {
      clearInterval(pollRef.current);
      playerRef.current?.disconnect();
    };
  }, [token, spotifyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => playerRef.current?.togglePlay();

  const handleDisconnect = () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh');
    window.location.reload();
  };

  if (error) {
    return (
      <div className="w-full rounded-xl bg-red-900/20 border border-red-500/30 p-4 text-center space-y-2">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={handleDisconnect} className="text-xs text-red-300 underline">
          Reconectar cuenta
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="w-full rounded-xl bg-brand-card border border-white/5 p-5 flex items-center justify-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin flex-shrink-0" />
        <p className="text-brand-text text-sm">Conectando con Spotify...</p>
      </div>
    );
  }

  const progress = track && track.duration > 0
    ? Math.min((track.position / track.duration) * 100, 100)
    : 0;

  return (
    <div className="w-full rounded-xl bg-brand-card border border-white/5 p-4 space-y-3">

      {/* Info de la pista */}
      <div className="flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse flex-shrink-0 mt-1.5" />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate leading-snug">
            {track?.name || 'Reproduciendo en Notara'}
          </p>
          {track?.artist && (
            <p className="text-brand-text text-xs truncate mt-0.5">{track.artist}</p>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-1.5">
        <div className="h-1 bg-brand-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-green rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-brand-text">
          <span>{track ? formatTime(track.position) : '0:00'}</span>
          <span>{track ? formatTime(track.duration) : '--:--'}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          aria-label={isPaused ? 'Reproducir' : 'Pausar'}
          className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center hover:scale-105 active:scale-95 transition-transform flex-shrink-0"
        >
          {isPaused ? (
            <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleDisconnect}
          title="Desconectar Spotify"
          className="text-brand-text hover:text-white text-xs transition-colors"
        >
          Desconectar
        </button>
      </div>

    </div>
  );
}

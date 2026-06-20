'use client';
import { useEffect, useRef } from 'react';

/**
 * SpotifyEmbedPlayer — reproduce una canción usando el Web Playback SDK embed.
 *
 * Spotify provee un iframe embebible que:
 * - No requiere Premium del usuario (solo visualización + preview)
 * - Dispara mensajes postMessage con el tiempo actual de reproducción
 * - Se usa ese tiempo para sincronizar el highlight de la letra
 *
 * @param {string} spotifyId — ID de la canción en Spotify
 * @param {function} onTimeUpdate — callback(seconds) cuando avanza el tiempo
 */
export default function SpotifyEmbedPlayer({ spotifyId, onTimeUpdate }) {
  const iframeRef = useRef(null);
  const apiRef    = useRef(null);

  useEffect(() => {
    if (!spotifyId) return;

    // Escuchar mensajes del iframe de Spotify
    const handleMessage = (event) => {
      if (event.origin !== 'https://open.spotify.com') return;

      try {
        const data = JSON.parse(event.data);

        // El embed envía la posición en ms
        if (data.type === 'playback_update' && data.payload?.position !== undefined) {
          const seconds = data.payload.position / 1000;
          onTimeUpdate?.(seconds);
        }

        // Guardar referencia al API del iframe para controles futuros
        if (data.type === 'ready') {
          apiRef.current = event.source;
        }
      } catch {
        // Ignorar mensajes no JSON
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [spotifyId, onTimeUpdate]);

  if (!spotifyId) return null;

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-lg">
      <iframe
        ref={iframeRef}
        src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify Player"
        style={{ borderRadius: '12px' }}
      />
    </div>
  );
}

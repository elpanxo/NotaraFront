'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { songs as songsApi } from '../../lib/api';
import { getRecentSongs } from '../../lib/progressStore';
import Navbar from '../../components/ui/Navbar';
import SearchBar from '../../components/ui/SearchBar';
import SongCard from '../../components/ui/SongCard';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Reggaeton', 'Electrónica', 'Jazz', 'K-Pop', 'Indie', 'Country'];

const styles = {
  page:        'min-h-screen bg-brand-dark',
  main:        'max-w-4xl mx-auto px-4 py-10',
  header:      'text-center mb-10',
  heading:     'text-4xl font-bold text-white mb-2',
  headingName: 'text-brand-green',
  subheading:  'text-brand-text text-lg',
  searchRow:   'flex justify-center mb-8',
  errorBox:    'bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm text-center',
  resultsCount:'text-brand-text text-sm mb-4',
  resultsList: 'space-y-2',
  emptyState:  'text-center py-16 animate-fadeIn',
  emptyTitle:  'text-white font-medium mt-4',
  emptySub:    'text-brand-text text-sm mt-1',
  sectionLabel:'text-brand-text text-xs font-semibold uppercase tracking-widest mb-3',
};

export default function SearchPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [results, setResults]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [error, setError]         = useState('');
  const [recentSongs, setRecentSongs] = useState([]);
  const [externalQuery, setExternalQuery] = useState('');

  useEffect(() => {
    setRecentSongs(getRecentSongs());

    // Capturar token de Spotify si viene del callback OAuth (sin songId)
    const params = new URLSearchParams(window.location.search);
    const spotifyToken   = params.get('spotify_token');
    const spotifyRefresh = params.get('spotify_refresh');
    if (spotifyToken) {
      localStorage.setItem('spotify_token', spotifyToken);
      if (spotifyRefresh) localStorage.setItem('spotify_refresh', spotifyRefresh);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSearch = useCallback(async (query) => {
    if (!query) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await songsApi.search(query);
      setResults(data.results || []);
      setSearched(true);
    } catch {
      setError('Error al buscar canciones. Intenta nuevamente.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenreClick = (genre) => {
    setExternalQuery(genre);
    handleSearch(genre);
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>

        <div className={styles.header}>
          <h1 className={styles.heading}>
            Hola, <span className={styles.headingName}>{user?.name || 'Estudiante'}</span>
          </h1>
          <p className={styles.subheading}>Busca una canción para empezar tu lección</p>
        </div>

        <div className={styles.searchRow}>
          <SearchBar onSearch={handleSearch} loading={loading} externalQuery={externalQuery} />
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {results.length > 0 && (
          <div className="animate-fadeIn">
            <p className={styles.resultsCount}>
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            <div className={styles.resultsList}>
              {results.map((song) => (
                <SongCard key={song.spotifyId} song={song} />
              ))}
            </div>
          </div>
        )}

        {searched && results.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No encontramos canciones</p>
            <p className={styles.emptySub}>Intenta con otro término de búsqueda</p>
          </div>
        )}

        {!searched && !loading && (
          <div className="animate-fadeIn space-y-10">

            {/* Géneros */}
            <div>
              <p className={styles.sectionLabel}>Explorar por género</p>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    className="px-4 py-1.5 rounded-full border border-white/10 text-brand-text text-sm hover:border-brand-green/50 hover:text-brand-green hover:bg-brand-green/5 transition-all"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Canciones recientes */}
            {recentSongs.length > 0 && (
              <div>
                <p className={styles.sectionLabel}>Estudiadas recientemente</p>
                <div className="space-y-2">
                  {recentSongs.slice(0, 5).map((song) => (
                    <SongCard key={song.spotifyId} song={song} />
                  ))}
                </div>
              </div>
            )}

            {recentSongs.length === 0 && (
              <div className="text-center py-6">
                <p className="text-brand-text text-sm">Escribe al menos 2 caracteres o selecciona un género para buscar</p>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

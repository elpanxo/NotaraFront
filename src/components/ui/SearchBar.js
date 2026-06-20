'use client';
import { useState, useEffect, useRef } from 'react';

const styles = {
  wrapper:     'relative w-full max-w-4xl',
  searchIcon:  'absolute left-4 top-1/2 -translate-y-1/2 text-brand-text text-sm pointer-events-none',
  input:       'w-full bg-white/10 border border-white/10 rounded-full px-12 py-4 text-white placeholder-brand-text focus:outline-none focus:border-brand-green focus:bg-white/15 transition-all',
  rightSlot:   'absolute right-4 top-1/2 -translate-y-1/2',
  spinner:     'w-5 h-5 rounded-full border-2 border-brand-green border-t-transparent animate-spin',
  clearBtn:    'text-brand-text hover:text-white transition-colors text-lg',
};

// Espera 500 ms tras el último keystroke para no saturar el backend
export default function SearchBar({ onSearch, loading, externalQuery }) {
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  // Sincronizar con query externo (ej: chips de género)
  useEffect(() => {
    if (externalQuery !== undefined && externalQuery !== query) {
      setQuery(externalQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => onSearch(query.trim()), 500);
    }

    return () => clearTimeout(debounceRef.current);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.searchIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Busca una canción o artista..."
        className={styles.input}
      />

      <div className={styles.rightSlot}>
        {loading ? (
          <div className={styles.spinner} />
        ) : query ? (
          <button onClick={handleClear} className={styles.clearBtn}>✕</button>
        ) : null}
      </div>
    </div>
  );
}

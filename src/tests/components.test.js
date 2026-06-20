/**
 * Tests para componentes React UI:
 * SongCard, SearchBar, SpotifyEmbedPlayer, ProgressWidget
 *
 * Se mockean next/navigation y next/link para aislar del framework.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks de Next.js ──────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter:   () => ({ push: mockPush }),
  usePathname: () => '/search',
}));
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock de AuthContext para Navbar (importado internamente)
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    loading: false,
    logout: jest.fn(),
  }),
}));

jest.mock('../lib/progressStore', () => ({
  getProgress: () => ({ xp: 150 }),
}));

import SongCard from '../components/ui/SongCard';
import SearchBar from '../components/ui/SearchBar';
import SpotifyEmbedPlayer from '../components/ui/SpotifyEmbedPlayer';
import ProgressWidget from '../components/lesson/ProgressWidget';

// ─── SongCard ─────────────────────────────────────────────────────────────────

describe('SongCard', () => {
  const song = {
    spotifyId: 'track-abc',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    imageUrl: 'https://img.test/cover.jpg',
    duration: 355000, // 5:55
  };

  beforeEach(() => mockPush.mockClear());

  test('muestra el título de la canción', () => {
    render(<SongCard song={song} />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  test('muestra el nombre del artista', () => {
    render(<SongCard song={song} />);
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  test('muestra el nombre del álbum', () => {
    render(<SongCard song={song} />);
    expect(screen.getByText('A Night at the Opera')).toBeInTheDocument();
  });

  test('formatea la duración correctamente (ms → m:ss)', () => {
    render(<SongCard song={song} />);
    expect(screen.getByText('5:55')).toBeInTheDocument();
  });

  test('muestra --:-- si no hay duración', () => {
    render(<SongCard song={{ ...song, duration: null }} />);
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  test('navega a /lesson/:spotifyId al hacer click', () => {
    render(<SongCard song={song} />);
    fireEvent.click(screen.getByText('Bohemian Rhapsody').closest('div'));
    expect(mockPush).toHaveBeenCalledWith('/lesson/track-abc');
  });

  test('muestra imagen si existe imageUrl', () => {
    render(<SongCard song={song} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://img.test/cover.jpg');
  });

  test('muestra fallback si no hay imageUrl', () => {
    render(<SongCard song={{ ...song, imageUrl: null }} />);
    expect(screen.getByText('sin imagen')).toBeInTheDocument();
  });

  test('no muestra el álbum si es undefined', () => {
    const { queryByText } = render(<SongCard song={{ ...song, album: undefined }} />);
    expect(queryByText('A Night at the Opera')).not.toBeInTheDocument();
  });
});

// ─── SearchBar ────────────────────────────────────────────────────────────────

describe('SearchBar', () => {
  jest.useFakeTimers();

  const onSearch = jest.fn();

  beforeEach(() => {
    onSearch.mockClear();
  });

  afterAll(() => jest.useRealTimers());

  test('renderiza el input de búsqueda', () => {
    render(<SearchBar onSearch={onSearch} />);
    expect(screen.getByPlaceholderText('Busca una canción o artista...')).toBeInTheDocument();
  });

  test('dispara onSearch tras 500ms debounce con query ≥ 2 caracteres', () => {
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Busca una canción o artista...');
    fireEvent.change(input, { target: { value: 'queen' } });
    expect(onSearch).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(500));
    expect(onSearch).toHaveBeenCalledWith('queen');
  });

  test('no dispara onSearch si el query tiene menos de 2 caracteres', () => {
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Busca una canción o artista...');
    fireEvent.change(input, { target: { value: 'q' } });
    act(() => jest.advanceTimersByTime(600));
    expect(onSearch).not.toHaveBeenCalled();
  });

  test('muestra botón de limpiar cuando hay texto', () => {
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Busca una canción o artista...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  test('limpia el input y llama onSearch("") al presionar limpiar', () => {
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Busca una canción o artista...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('✕'));
    expect(input.value).toBe('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  test('muestra spinner cuando loading=true', () => {
    render(<SearchBar onSearch={onSearch} loading={true} />);
    // El spinner es un div con clase animate-spin (no tiene texto, buscamos por clase)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  test('no muestra spinner cuando loading=false', () => {
    render(<SearchBar onSearch={onSearch} loading={false} />);
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  test('sincroniza con externalQuery', () => {
    const { rerender } = render(<SearchBar onSearch={onSearch} externalQuery="jazz" />);
    const input = screen.getByPlaceholderText('Busca una canción o artista...');
    expect(input.value).toBe('jazz');
  });
});

// ─── SpotifyEmbedPlayer ───────────────────────────────────────────────────────

describe('SpotifyEmbedPlayer', () => {
  const onTimeUpdate = jest.fn();

  beforeEach(() => onTimeUpdate.mockClear());

  test('renderiza el iframe con la URL correcta', () => {
    render(<SpotifyEmbedPlayer spotifyId="track123" onTimeUpdate={onTimeUpdate} />);
    const iframe = screen.getByTitle('Spotify Player');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('track123');
  });

  test('no renderiza nada si spotifyId es null', () => {
    const { container } = render(<SpotifyEmbedPlayer spotifyId={null} onTimeUpdate={onTimeUpdate} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('llama onTimeUpdate cuando recibe mensaje postMessage de Spotify', () => {
    render(<SpotifyEmbedPlayer spotifyId="track123" onTimeUpdate={onTimeUpdate} />);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://open.spotify.com',
        data: JSON.stringify({ type: 'playback_update', payload: { position: 30000 } }),
      }));
    });

    expect(onTimeUpdate).toHaveBeenCalledWith(30);
  });

  test('ignora mensajes de orígenes distintos a open.spotify.com', () => {
    render(<SpotifyEmbedPlayer spotifyId="track123" onTimeUpdate={onTimeUpdate} />);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://evil.com',
        data: JSON.stringify({ type: 'playback_update', payload: { position: 5000 } }),
      }));
    });

    expect(onTimeUpdate).not.toHaveBeenCalled();
  });

  test('ignora mensajes no-JSON sin lanzar error', () => {
    render(<SpotifyEmbedPlayer spotifyId="track123" onTimeUpdate={onTimeUpdate} />);

    expect(() => {
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://open.spotify.com',
          data: 'esto no es JSON',
        }));
      });
    }).not.toThrow();
  });

  test('limpia el event listener al desmontar', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<SpotifyEmbedPlayer spotifyId="track123" onTimeUpdate={onTimeUpdate} />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});

// ─── ProgressWidget ───────────────────────────────────────────────────────────

describe('ProgressWidget', () => {
  test('retorna null si stats es undefined', () => {
    const { container } = render(<ProgressWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  test('retorna null si stats es null', () => {
    const { container } = render(<ProgressWidget stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('muestra la racha correctamente', () => {
    render(<ProgressWidget stats={{ streak: 7, wordsTotal: 30, songsCompleted: 2 }} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Racha')).toBeInTheDocument();
  });

  test('muestra el total de palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 45, songsCompleted: 0 }} />);
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Palabras')).toBeInTheDocument();
  });

  test('nivel "Principiante" para menos de 20 palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 10, songsCompleted: 0 }} />);
    expect(screen.getByText('Principiante')).toBeInTheDocument();
  });

  test('nivel "Básico" entre 20 y 49 palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 35, sondsCompleted: 0 }} />);
    expect(screen.getByText('Básico')).toBeInTheDocument();
  });

  test('nivel "Intermedio" entre 50 y 99 palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 75, songsCompleted: 0 }} />);
    expect(screen.getByText('Intermedio')).toBeInTheDocument();
  });

  test('nivel "Avanzado" entre 100 y 199 palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 150, songsCompleted: 0 }} />);
    expect(screen.getByText('Avanzado')).toBeInTheDocument();
  });

  test('nivel "Experto" con 200+ palabras', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 250, songsCompleted: 0 }} />);
    expect(screen.getByText('Experto')).toBeInTheDocument();
  });

  test('muestra canciones completadas si songsCompleted > 0', () => {
    const { container } = render(<ProgressWidget stats={{ streak: 0, wordsTotal: 0, songsCompleted: 3 }} />);
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('completadas');
  });

  test('usa singular si songsCompleted === 1', () => {
    render(<ProgressWidget stats={{ streak: 0, wordsTotal: 0, songsCompleted: 1 }} />);
    expect(screen.getAllByText((c, el) => el.textContent.includes('1 canción completada'))[0]).toBeInTheDocument();
  });

  test('no muestra sección de canciones si songsCompleted === 0', () => {
    const { queryByText } = render(<ProgressWidget stats={{ streak: 0, wordsTotal: 0, songsCompleted: 0 }} />);
    expect(queryByText(/canción/)).not.toBeInTheDocument();
  });
});

// ─── Tests adicionales de cobertura ───────────────────────────────────────────

describe('SpotifyEmbedPlayer — rama "ready"', () => {
  test('maneja mensaje de tipo "ready" desde Spotify sin lanzar error', () => {
    const onTimeUpdate = jest.fn();
    render(<SpotifyEmbedPlayer spotifyId="track999" onTimeUpdate={onTimeUpdate} />);

    expect(() => {
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          origin: 'https://open.spotify.com',
          data: JSON.stringify({ type: 'ready' }),
          source: window,
        }));
      });
    }).not.toThrow();

    expect(onTimeUpdate).not.toHaveBeenCalled();
  });

  test('maneja playback_update sin payload.position sin lanzar error', () => {
    const onTimeUpdate = jest.fn();
    render(<SpotifyEmbedPlayer spotifyId="track999" onTimeUpdate={onTimeUpdate} />);

    act(() => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://open.spotify.com',
        data: JSON.stringify({ type: 'playback_update', payload: {} }),
      }));
    });

    expect(onTimeUpdate).not.toHaveBeenCalled();
  });
});

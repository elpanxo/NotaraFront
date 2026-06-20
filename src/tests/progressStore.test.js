/**
 * Tests para progressStore.js
 * Se mockean localStorage y fetch para aislar la lógica de negocio.
 */

// Mock de fetch global
global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

// Mock de window.dispatchEvent
const dispatchEventMock = jest.fn();
Object.defineProperty(window, 'dispatchEvent', { value: dispatchEventMock, writable: true });

// --- Helpers de localStorage mock ---
let store = {};
const localStorageMock = {
  getItem:    jest.fn((key) => store[key] ?? null),
  setItem:    jest.fn((key, value) => { store[key] = String(value); }),
  removeItem: jest.fn((key) => { delete store[key]; }),
  clear:      jest.fn(() => { store = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Importamos después de mockear localStorage
import {
  getProgress,
  addXP,
  recordWordLearned,
  recordSongCompleted,
  addRecentSong,
  getRecentSongs,
  mergeFromBackend,
} from '../lib/progressStore';

beforeEach(() => {
  store = {};
  jest.clearAllMocks();
  global.fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
});

// ─── getProgress ──────────────────────────────────────────────────────────────

describe('getProgress', () => {
  test('retorna objeto vacío cuando localStorage está vacío', () => {
    expect(getProgress()).toEqual({});
  });

  test('retorna el objeto guardado en localStorage', () => {
    store['notara_progress'] = JSON.stringify({ xp: 100 });
    expect(getProgress()).toEqual({ xp: 100 });
  });

  test('retorna objeto vacío si el JSON está corrupto', () => {
    store['notara_progress'] = 'JSON_INVALIDO{{{';
    expect(getProgress()).toEqual({});
  });
});

// ─── addXP ────────────────────────────────────────────────────────────────────

describe('addXP', () => {
  test('agrega XP al progreso inicial', () => {
    const result = addXP(50);
    expect(result.xp).toBe(50);
  });

  test('acumula XP sobre el existente', () => {
    store['notara_progress'] = JSON.stringify({ xp: 200 });
    const result = addXP(100);
    expect(result.xp).toBe(300);
  });

  test('guarda el progreso actualizado en localStorage', () => {
    addXP(75);
    const saved = JSON.parse(store['notara_progress']);
    expect(saved.xp).toBe(75);
  });

  test('dispara el evento notara_progress_update', () => {
    addXP(10);
    expect(dispatchEventMock).toHaveBeenCalled();
  });

  test('inicializa XP desde 0 si no existía', () => {
    const result = addXP(0);
    expect(result.xp).toBe(0);
  });
});

// ─── recordWordLearned ────────────────────────────────────────────────────────

describe('recordWordLearned', () => {
  test('incrementa wordsTotal en 1 por defecto', () => {
    const result = recordWordLearned();
    expect(result.wordsTotal).toBe(1);
  });

  test('incrementa wordsTotal en la cantidad especificada', () => {
    const result = recordWordLearned(5);
    expect(result.wordsTotal).toBe(5);
  });

  test('acumula palabras correctamente', () => {
    store['notara_progress'] = JSON.stringify({ wordsTotal: 10 });
    recordWordLearned(3);
    const saved = JSON.parse(store['notara_progress']);
    expect(saved.wordsTotal).toBe(13);
  });

  test('inicializa weeklyWords si no existe', () => {
    const result = recordWordLearned(1);
    expect(result.weeklyWords).toBeDefined();
    expect(result.weeklyWords).toHaveLength(7);
  });

  test('inicializa monthlyProgress si no existe', () => {
    const result = recordWordLearned(1);
    expect(result.monthlyProgress).toBeDefined();
    expect(result.monthlyProgress).toHaveLength(4);
  });

  test('incrementa exercisesToday', () => {
    const result = recordWordLearned(2);
    expect(result.exercisesToday).toBeGreaterThanOrEqual(2);
  });
});

// ─── recordSongCompleted ──────────────────────────────────────────────────────

describe('recordSongCompleted', () => {
  const song = {
    spotifyId: 'song123',
    title: 'Test Song',
    artist: 'Test Artist',
    imageUrl: 'http://img.test',
    album: 'Test Album',
  };

  test('agrega la canción a completedSongIds', () => {
    const result = recordSongCompleted(song);
    expect(result.completedSongIds).toContain('song123');
  });

  test('no duplica canciones ya completadas', () => {
    store['notara_progress'] = JSON.stringify({ completedSongIds: ['song123'] });
    const result = recordSongCompleted(song);
    const occurrences = result.completedSongIds.filter(id => id === 'song123').length;
    expect(occurrences).toBe(1);
  });

  test('actualiza songsCompleted con la longitud del array', () => {
    const result = recordSongCompleted(song);
    expect(result.songsCompleted).toBe(result.completedSongIds.length);
  });

  test('suma 50 XP al completar una canción', () => {
    store['notara_progress'] = JSON.stringify({ xp: 100 });
    const result = recordSongCompleted(song);
    expect(result.xp).toBe(150);
  });

  test('agrega la canción a canciones recientes', () => {
    recordSongCompleted(song);
    const recent = JSON.parse(store['notara_recent_songs'] || '[]');
    expect(recent.some(s => s.spotifyId === 'song123')).toBe(true);
  });
});

// ─── addRecentSong / getRecentSongs ───────────────────────────────────────────

describe('addRecentSong y getRecentSongs', () => {
  const song = { spotifyId: 'abc', title: 'A', artist: 'B', imageUrl: '', album: '' };

  test('agrega una canción reciente', () => {
    addRecentSong(song);
    const recent = getRecentSongs();
    expect(recent[0].spotifyId).toBe('abc');
  });

  test('pone la canción más reciente al inicio', () => {
    const song2 = { ...song, spotifyId: 'xyz' };
    addRecentSong(song);
    addRecentSong(song2);
    expect(getRecentSongs()[0].spotifyId).toBe('xyz');
  });

  test('no duplica canciones en el listado reciente', () => {
    addRecentSong(song);
    addRecentSong(song);
    expect(getRecentSongs().length).toBe(1);
  });

  test('limita a máximo 10 canciones recientes', () => {
    for (let i = 0; i < 15; i++) {
      addRecentSong({ spotifyId: `song-${i}`, title: `T${i}`, artist: 'A', imageUrl: '', album: '' });
    }
    expect(getRecentSongs().length).toBeLessThanOrEqual(10);
  });

  test('getRecentSongs retorna array vacío si no hay historial', () => {
    expect(getRecentSongs()).toEqual([]);
  });
});

// ─── mergeFromBackend ─────────────────────────────────────────────────────────

describe('mergeFromBackend', () => {
  test('no hace nada si data es null', () => {
    expect(() => mergeFromBackend(null)).not.toThrow();
  });

  test('toma el mayor valor de XP entre local y backend', () => {
    store['notara_progress'] = JSON.stringify({ xp: 500 });
    mergeFromBackend({ xp: 300, streak: 0, wordsTotal: 0, songsCompleted: 0 });
    const local = JSON.parse(store['notara_progress']);
    expect(local.xp).toBe(500);
  });

  test('toma el valor del backend si es mayor', () => {
    store['notara_progress'] = JSON.stringify({ xp: 100 });
    mergeFromBackend({ xp: 999, streak: 0, wordsTotal: 0, songsCompleted: 0 });
    const local = JSON.parse(store['notara_progress']);
    expect(local.xp).toBe(999);
  });

  test('fusiona streak, wordsTotal y songsCompleted correctamente', () => {
    store['notara_progress'] = JSON.stringify({ streak: 3, wordsTotal: 50, songsCompleted: 5 });
    mergeFromBackend({ xp: 0, streak: 7, wordsTotal: 40, songsCompleted: 8 });
    const local = JSON.parse(store['notara_progress']);
    expect(local.streak).toBe(7);
    expect(local.wordsTotal).toBe(50); // local mayor
    expect(local.songsCompleted).toBe(8); // backend mayor
  });

  test('no lanza error si localStorage está vacío', () => {
    expect(() => mergeFromBackend({ xp: 10, streak: 1, wordsTotal: 5, songsCompleted: 1 })).not.toThrow();
  });
});

// ─── syncToBackend (indirectamente via addXP con token) ───────────────────────

describe('syncToBackend (vía addXP)', () => {
  test('llama a fetch cuando hay access_token', () => {
    store['access_token'] = 'valid-token';
    addXP(10);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/progress/sync'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('no llama a fetch cuando no hay access_token', () => {
    // sin token en store
    addXP(10);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ─── getRecentSongs — rama catch ──────────────────────────────────────────────

describe('getRecentSongs — rama de error', () => {
  test('retorna array vacío si localStorage contiene JSON inválido', () => {
    store['notara_recent_songs'] = 'NO_ES_JSON{{';
    const result = getRecentSongs();
    expect(result).toEqual([]);
  });
});

// ─── refreshStreak — streak continuo ─────────────────────────────────────────

describe('refreshStreak via addXP', () => {
  test('incrementa streak si el último estudio fue ayer', () => {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    store['notara_progress'] = JSON.stringify({ streak: 3, lastStudyDate: yesterday });
    const result = addXP(0);
    expect(result.streak).toBe(4);
  });

  test('reinicia streak a 1 si el último estudio fue hace más de 1 día', () => {
    const old = new Date(Date.now() - 172800000).toDateString(); // hace 2 días
    store['notara_progress'] = JSON.stringify({ streak: 10, lastStudyDate: old });
    const result = addXP(0);
    expect(result.streak).toBe(1);
  });

  test('no modifica streak si ya estudió hoy', () => {
    const today = new Date().toDateString();
    store['notara_progress'] = JSON.stringify({ streak: 5, lastStudyDate: today });
    const result = addXP(0);
    expect(result.streak).toBe(5);
  });
});

/**
 * Tests para api.js
 * Mockea fetch y localStorage para probar la lógica del cliente HTTP.
 */

// Mock fetch global
global.fetch = jest.fn();

// Mock localStorage
let store = {};
const localStorageMock = {
  getItem:    jest.fn((key) => store[key] ?? null),
  setItem:    jest.fn((key, value) => { store[key] = String(value); }),
  removeItem: jest.fn((key) => { delete store[key]; }),
  clear:      jest.fn(() => { store = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock window.location
delete window.location;
window.location = { href: '' };

import { auth, songs, ia, progress } from '../lib/api';

function mockFetch(status, body) {
  global.fetch.mockResolvedValueOnce({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  store = {};
  jest.clearAllMocks();
});

// ─── auth.login ───────────────────────────────────────────────────────────────

describe('auth.login', () => {
  test('guarda accessToken en localStorage al hacer login exitoso', async () => {
    mockFetch(200, { accessToken: 'token-abc', user: { id: '1', name: 'Ana' } });
    await auth.login('ana@test.com', 'pass123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'token-abc');
  });

  test('guarda refreshToken si lo devuelve el backend', async () => {
    mockFetch(200, { accessToken: 'tok', refreshToken: 'refresh-xyz', user: {} });
    await auth.login('a@b.com', 'p');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-xyz');
  });

  test('acepta token legado (campo "token")', async () => {
    mockFetch(200, { token: 'legacy-token' });
    await auth.login('a@b.com', 'p');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'legacy-token');
  });

  test('guarda user en localStorage si lo devuelve el backend', async () => {
    const user = { id: '1', name: 'Test' };
    mockFetch(200, { accessToken: 'tok', user });
    await auth.login('a@b.com', 'p');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  });

  test('lanza error en credenciales inválidas (400)', async () => {
    mockFetch(400, { error: 'Credenciales inválidas' });
    await expect(auth.login('x@x.com', 'wrong')).rejects.toThrow('Credenciales inválidas');
  });
});

// ─── auth.logout ──────────────────────────────────────────────────────────────

describe('auth.logout', () => {
  test('elimina access_token, refresh_token y user de localStorage', () => {
    store['access_token'] = 'tok';
    store['refresh_token'] = 'rtok';
    store['user'] = '{}';
    auth.logout();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });
});

// ─── auth.register ────────────────────────────────────────────────────────────

describe('auth.register', () => {
  test('realiza POST a /auth/register con nombre, email y password', async () => {
    mockFetch(200, { id: '1' });
    await auth.register('Juan', 'juan@test.com', 'abc123');
    const call = global.fetch.mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body).toMatchObject({ nombre: 'Juan', email: 'juan@test.com', password: 'abc123' });
  });
});

// ─── auth.me ──────────────────────────────────────────────────────────────────

describe('auth.me', () => {
  test('realiza GET a /users/me con token en header', async () => {
    store['access_token'] = 'my-token';
    mockFetch(200, { id: '1', name: 'Me' });
    await auth.me();
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-token');
  });
});

// ─── songs ────────────────────────────────────────────────────────────────────

describe('songs.search', () => {
  test('realiza GET a /songs/search con query codificada', async () => {
    mockFetch(200, []);
    await songs.search('hello world');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/songs/search?q=hello%20world');
  });

  test('usa limit por defecto de 10', async () => {
    mockFetch(200, []);
    await songs.search('test');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=10');
  });

  test('acepta limit personalizado', async () => {
    mockFetch(200, []);
    await songs.search('test', 5);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=5');
  });
});

describe('songs.getById', () => {
  test('realiza GET a /songs/:id', async () => {
    mockFetch(200, { id: '42', title: 'Test' });
    await songs.getById('42');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/songs/42');
  });
});

describe('songs.getLyrics', () => {
  test('realiza GET a /songs/:id/lyrics', async () => {
    mockFetch(200, { lyrics: [] });
    await songs.getLyrics('99');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/songs/99/lyrics');
  });
});

describe('songs.getLessonType', () => {
  test('realiza GET a /songs/:id/lesson-type', async () => {
    mockFetch(200, { type: 'fill-blank' });
    await songs.getLessonType('55');
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/songs/55/lesson-type');
  });
});

// ─── ia ───────────────────────────────────────────────────────────────────────

describe('ia.explain', () => {
  test('realiza POST a /ia/explain con songId, phrase y userLevel', async () => {
    mockFetch(200, { explanation: '...' });
    await ia.explain('song1', 'hello world', 'beginner');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ songId: 'song1', phrase: 'hello world', userLevel: 'beginner' });
  });

  test('usa intermediate como nivel por defecto', async () => {
    mockFetch(200, {});
    await ia.explain('song1', 'phrase');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.userLevel).toBe('intermediate');
  });
});

describe('ia.getExercises', () => {
  test('realiza POST a /ia/exercises con songId y phrase', async () => {
    mockFetch(200, { exercises: [] });
    await ia.getExercises('s1', 'some phrase');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ songId: 's1', phrase: 'some phrase' });
  });
});

describe('ia.chat', () => {
  test('realiza POST a /ia/chat con historial vacío por defecto', async () => {
    mockFetch(200, { reply: 'Hi' });
    await ia.chat('s1', 'hello');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.history).toEqual([]);
  });

  test('incluye historial si se proporciona', async () => {
    mockFetch(200, { reply: 'Hi' });
    const history = [{ role: 'user', content: 'prev' }];
    await ia.chat('s1', 'hello', history);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.history).toEqual(history);
  });
});

// ─── progress ─────────────────────────────────────────────────────────────────

describe('progress.getStats', () => {
  test('realiza GET a /progress/stats', async () => {
    mockFetch(200, { xp: 100 });
    await progress.getStats();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/progress/stats');
  });
});

describe('progress.saveWord', () => {
  test('realiza POST a /progress/word con word, songId y context', async () => {
    mockFetch(200, {});
    await progress.saveWord('hello', 'song1', 'Hello world');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ word: 'hello', songId: 'song1', context: 'Hello world' });
  });
});

describe('progress.completeLesson', () => {
  test('realiza POST a /progress/lesson-complete con los datos correctos', async () => {
    mockFetch(200, {});
    await progress.completeLesson('song1', 'fill-blank', 5);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ songId: 'song1', lessonType: 'fill-blank', wordsLearned: 5 });
  });
});

// ─── Manejo de errores ────────────────────────────────────────────────────────

describe('Manejo de errores HTTP', () => {
  test('lanza error con mensaje del backend en respuestas no-ok', async () => {
    mockFetch(500, { error: 'Error interno del servidor' });
    await expect(songs.getById('1')).rejects.toThrow('Error interno del servidor');
  });

  test('incluye el token de autorización en los headers si existe', async () => {
    store['access_token'] = 'test-jwt';
    mockFetch(200, []);
    await songs.search('x');
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer test-jwt');
  });

  test('no incluye Authorization si no hay token', async () => {
    mockFetch(200, []);
    await songs.search('x');
    const headers = global.fetch.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });
});

// ─── Flujo de refresh token (401 con token existente) ─────────────────────────

describe('Flujo de refresh token', () => {
  test('intenta renovar el token cuando recibe 401 y había token', async () => {
    store['access_token'] = 'expired-token';
    store['refresh_token'] = 'refresh-xyz';

    // Primera llamada: 401 (token expirado)
    global.fetch
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      // Segunda llamada: refresh exitoso
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ accessToken: 'new-token' }) })
      // Tercera llamada: reintento con nuevo token
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve({ id: '1' }) });

    const result = await songs.getById('1');
    expect(result).toEqual({ id: '1' });
  });

  test('limpia localStorage si el refresh falla (flujo de logout forzado)', async () => {
    store['access_token'] = 'expired-token';
    store['refresh_token'] = 'bad-refresh';
    store['user'] = JSON.stringify({ id: '1' });

    global.fetch
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({}) });

    await songs.getById('1').catch(() => {});
    // Tras refresh fallido, el cliente limpia los tokens antes de redirigir
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  test('lanza error "No autorizado" en modo silent con 401', async () => {
    global.fetch.mockResolvedValueOnce({
      status: 401, ok: false, json: () => Promise.resolve({})
    });
    await expect(progress.getStats()).rejects.toThrow('No autorizado');
  });
});

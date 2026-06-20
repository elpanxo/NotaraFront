/**
 * api.js — Cliente centralizado para el API Gateway
 *
 * Todas las llamadas al backend pasan por aquí.
 * Maneja automáticamente el token JWT en los headers.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Función base de fetch con manejo de errores y token automático.
 */
async function request(path, { silent = false, ...options } = {}) {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('access_token')
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // En modo silencioso nunca redirigir: solo lanzar el error para que
    // quien llama decida qué hacer (evita loops de login en rutas opcionales)
    if (silent) throw new Error('No autorizado');

    const hadToken = !!localStorage.getItem('access_token');
    if (hadToken) {
      const renewed = await refreshToken();
      if (renewed) {
        const newToken = localStorage.getItem('access_token');
        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
        });
        return retryRes.json();
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    throw new Error('Se requiere autenticación');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre: name, email, password }),
    }),

  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // El backend puede devolver accessToken (nuevo) o token (legado)
    const token = data?.accessToken || data?.token;
    if (token) {
      localStorage.setItem('access_token', token);
      if (data?.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  me: () => request('/users/me'),
};

async function refreshToken() {
  try {
    const rt = localStorage.getItem('refresh_token');
    if (!rt) return false;
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.accessToken);
    return true;
  } catch {
    return false;
  }
}

// ─── Canciones ────────────────────────────────────────────────────────────────

export const songs = {
  search: (query, limit = 10) =>
    request(`/songs/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  getById: (id) =>
    request(`/songs/${id}`),

  getLyrics: (id) =>
    request(`/songs/${id}/lyrics`),

  getLessonType: (id) =>
    request(`/songs/${id}/lesson-type`),
};

// ─── IA Tutor ─────────────────────────────────────────────────────────────────

export const ia = {
  explain: (songId, phrase, userLevel = 'intermediate') =>
    request('/ia/explain', {
      method: 'POST',
      body: JSON.stringify({ songId, phrase, userLevel }),
    }),

  getExercises: (songId, phrase) =>
    request('/ia/exercises', {
      method: 'POST',
      body: JSON.stringify({ songId, phrase }),
    }),

  chat: (songId, message, history = []) =>
    request('/ia/chat', {
      method: 'POST',
      body: JSON.stringify({ songId, message, history }),
    }),
};

// ─── Progreso ─────────────────────────────────────────────────────────────────

export const progress = {
  getStats: () =>
    request('/progress/stats', { silent: true }),

  saveWord: (word, songId, context) =>
    request('/progress/word', {
      method: 'POST',
      body: JSON.stringify({ word, songId, context }),
    }),

  completeLesson: (songId, lessonType, wordsLearned) =>
    request('/progress/lesson-complete', {
      method: 'POST',
      body: JSON.stringify({ songId, lessonType, wordsLearned }),
    }),
};

// ─── Notas ────────────────────────────────────────────────────────────────────

export const notas = {
  porUsuario: (idUsuario) =>
    request(`/notas/usuario/${idUsuario}`),

  crear: (titulo, contenido, idUsuario) =>
    request('/notas', {
      method: 'POST',
      body: JSON.stringify({ titulo, contenido, idUsuario }),
    }),

  actualizar: (id, titulo, contenido, idUsuario) =>
    request(`/notas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ titulo, contenido, idUsuario }),
    }),

  eliminar: (id) =>
    request(`/notas/${id}`, { method: 'DELETE' }),
};

// ─── Metas ────────────────────────────────────────────────────────────────────

export const metas = {
  porUsuario: (idUsuario) =>
    request(`/metas/usuario/${idUsuario}`),

  crear: (datos) =>
    request('/metas', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  actualizar: (id, datos) =>
    request(`/metas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    }),

  eliminar: (id) =>
    request(`/metas/${id}`, { method: 'DELETE' }),
};

// ─── Suscripciones ────────────────────────────────────────────────────────────

export const suscripciones = {
  porUsuario: (idUsuario) =>
    request(`/suscripciones/usuario/${idUsuario}`),

  crear: (datos) =>
    request('/suscripciones', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  cancelar: (id) =>
    request(`/suscripciones/${id}/cancelar`, { method: 'PUT' }),

  renovar: (id, fechaFin) =>
    request(`/suscripciones/${id}/renovar`, {
      method: 'PUT',
      body: JSON.stringify({ fechaFin }),
    }),
};

// ─── Vocabulario ──────────────────────────────────────────────────────────────

export const vocabulario = {
  categorias: () =>
    request('/vocabulario/palabras/categorias'),

  iniciarPartida: (idUsuario, nombreUsuario, categoria, totalPreguntas = 10, tiempoMaximoSegundos = 30) =>
    request('/vocabulario/partidas', {
      method: 'POST',
      body: JSON.stringify({ idUsuario, nombreUsuario, categoria, totalPreguntas, tiempoMaximoSegundos }),
    }),

  preguntaActual: (idPartida) =>
    request(`/vocabulario/partidas/${idPartida}/pregunta`),

  responder: (idPartida, respuesta) =>
    request(`/vocabulario/partidas/${idPartida}/responder`, {
      method: 'POST',
      body: JSON.stringify({ respuesta }),
    }),

  abandonar: (idPartida) =>
    request(`/vocabulario/partidas/${idPartida}/abandonar`, { method: 'PUT' }),

  rankingGlobal: () =>
    request('/vocabulario/ranking'),

  estadisticasUsuario: (idUsuario) =>
    request(`/vocabulario/ranking/usuario/${idUsuario}`),
};

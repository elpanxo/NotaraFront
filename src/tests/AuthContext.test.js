/**
 * Tests para AuthContext.js
 * Mockea el módulo api.js para aislar el contexto de autenticación.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock del módulo api.js
jest.mock('../lib/api', () => ({
  auth: {
    login:    jest.fn(),
    logout:   jest.fn(),
    register: jest.fn(),
    me:       jest.fn(),
  },
}));

import { auth } from '../lib/api';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock localStorage
let store = {};
const localStorageMock = {
  getItem:    jest.fn((k) => store[k] ?? null),
  setItem:    jest.fn((k, v) => { store[k] = String(v); }),
  removeItem: jest.fn((k) => { delete store[k]; }),
  clear:      jest.fn(() => { store = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  store = {};
  jest.clearAllMocks();
});

// Componente de prueba que consume el contexto
function TestConsumer({ action, payload } = {}) {
  const { user, loading, login, logout, register } = useAuth();

  return (
    <div>
      <span data-testid="loading">{loading ? 'cargando' : 'listo'}</span>
      <span data-testid="user">{user ? user.name : 'sin-usuario'}</span>
      <button onClick={() => login(payload?.email, payload?.password)}>login</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => register(payload?.name, payload?.email, payload?.password)}>register</button>
    </div>
  );
}

// ─── Renderizado inicial ───────────────────────────────────────────────────────

describe('AuthProvider — inicialización', () => {
  test('muestra loading=false después de montar', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('listo'));
  });

  test('carga el usuario desde localStorage si hay token', async () => {
    store['user'] = JSON.stringify({ id: '1', name: 'Ana' });
    store['access_token'] = 'tok';
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Ana'));
  });

  test('no carga usuario si no hay token aunque exista user en storage', async () => {
    store['user'] = JSON.stringify({ id: '1', name: 'Ana' });
    // Sin access_token
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('sin-usuario'));
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('AuthProvider — login', () => {
  test('login con usuario demo funciona sin llamar a la API', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'demo@notara.com', password: 'demo1234' }} />
      </AuthProvider>
    );
    await waitFor(() => screen.getByTestId('loading'));
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Usuario Demo'));
    expect(auth.login).not.toHaveBeenCalled();
  });

  test('login demo guarda demo_token en localStorage', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'demo@notara.com', password: 'demo1234' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('login'));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'demo_token');
  });

  test('login real llama a auth.login', async () => {
    auth.login.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '2', name: 'Real' } });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'real@test.com', password: 'pass' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('login'));
    expect(auth.login).toHaveBeenCalledWith('real@test.com', 'pass');
  });

  test('login real actualiza el usuario en el contexto', async () => {
    auth.login.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '2', name: 'Real User' } });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'real@test.com', password: 'pass' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Real User'));
  });

  test('si el backend no devuelve user, llama a auth.me', async () => {
    auth.login.mockResolvedValueOnce({ accessToken: 'tok' });
    auth.me.mockResolvedValueOnce({ id: '3', name: 'From Me' });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'x@x.com', password: 'p' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(auth.me).toHaveBeenCalled());
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('AuthProvider — logout', () => {
  test('logout limpia el usuario del contexto', async () => {
    auth.login.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '1', name: 'Test' } });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ email: 'x@x.com', password: 'p' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Test'));
    await user.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('sin-usuario'));
  });

  test('logout llama a auth.logout', async () => {
    const user = userEvent.setup();
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    await user.click(screen.getByText('logout'));
    expect(auth.logout).toHaveBeenCalled();
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('AuthProvider — register', () => {
  test('register llama a auth.register con los datos correctos', async () => {
    auth.register.mockResolvedValueOnce({});
    auth.login.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '1', name: 'Nuevo' } });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ name: 'Nuevo', email: 'nuevo@test.com', password: 'abc' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('register'));
    expect(auth.register).toHaveBeenCalledWith('Nuevo', 'nuevo@test.com', 'abc');
  });

  test('register hace login automáticamente tras el registro', async () => {
    auth.register.mockResolvedValueOnce({});
    auth.login.mockResolvedValueOnce({ accessToken: 'tok', user: { id: '1', name: 'Auto' } });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer payload={{ name: 'Auto', email: 'auto@test.com', password: 'abc' }} />
      </AuthProvider>
    );
    await user.click(screen.getByText('register'));
    await waitFor(() => expect(auth.login).toHaveBeenCalled());
  });
});

// ─── useAuth fuera del provider ───────────────────────────────────────────────

describe('useAuth', () => {
  test('lanza error si se usa fuera de AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth debe usarse dentro de <AuthProvider>');
    spy.mockRestore();
  });
});

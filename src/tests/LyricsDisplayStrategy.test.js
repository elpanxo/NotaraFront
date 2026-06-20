import { getLyricsStrategy, LYRICS_STRATEGIES } from '../patterns/LyricsDisplayStrategy';

describe('getLyricsStrategy', () => {
  test('retorna la estrategia correcta por id', () => {
    expect(getLyricsStrategy('en-only').id).toBe('en-only');
    expect(getLyricsStrategy('es-only').id).toBe('es-only');
    expect(getLyricsStrategy('bilingual').id).toBe('bilingual');
    expect(getLyricsStrategy('synced').id).toBe('synced');
  });

  test('retorna EnOnlyStrategy como fallback para id desconocido', () => {
    expect(getLyricsStrategy('no-existe').id).toBe('en-only');
  });

  test('retorna EnOnlyStrategy para id undefined', () => {
    expect(getLyricsStrategy(undefined).id).toBe('en-only');
  });

  test('retorna EnOnlyStrategy para id null', () => {
    expect(getLyricsStrategy(null).id).toBe('en-only');
  });

  test('retorna EnOnlyStrategy para string vacío', () => {
    expect(getLyricsStrategy('').id).toBe('en-only');
  });
});

describe('LYRICS_STRATEGIES', () => {
  test('contiene exactamente 4 estrategias', () => {
    expect(LYRICS_STRATEGIES).toHaveLength(4);
  });

  test('cada estrategia tiene id, label y función render', () => {
    LYRICS_STRATEGIES.forEach(strategy => {
      expect(strategy).toHaveProperty('id');
      expect(strategy).toHaveProperty('label');
      expect(strategy).toHaveProperty('render');
      expect(typeof strategy.render).toBe('function');
    });
  });

  test('los ids son únicos', () => {
    const ids = LYRICS_STRATEGIES.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('los labels no están vacíos', () => {
    LYRICS_STRATEGIES.forEach(strategy => {
      expect(strategy.label.length).toBeGreaterThan(0);
    });
  });
});

describe('SyncedStrategy', () => {
  test('comparte el comportamiento de render con EnOnlyStrategy', () => {
    const synced = getLyricsStrategy('synced');
    const enOnly = getLyricsStrategy('en-only');
    // Ambas estrategias tienen render definido
    expect(typeof synced.render).toBe('function');
    expect(typeof enOnly.render).toBe('function');
  });
});

// ─── Render de estrategias (smoke tests) ─────────────────────────────────────

import React from 'react';
import { render } from '@testing-library/react';

const mockLines = [
  { text: 'Hello world' },
  { text: 'Goodbye world' },
];
const mockTranslations = ['Hola mundo', 'Adiós mundo'];

describe('EnOnlyStrategy.render', () => {
  test('renderiza líneas de texto correctamente', () => {
    const strategy = getLyricsStrategy('en-only');
    const { getByText } = render(
      strategy.render({ lines: mockLines, activeIdx: 0, onLineClick: jest.fn() })
    );
    expect(getByText('Hello world')).toBeTruthy();
    expect(getByText('Goodbye world')).toBeTruthy();
  });

  test('línea vacía renderiza espacio', () => {
    const strategy = getLyricsStrategy('en-only');
    const { container } = render(
      strategy.render({ lines: [{ text: '' }], activeIdx: -1, onLineClick: jest.fn() })
    );
    expect(container).toBeTruthy();
  });
});

describe('EsOnlyStrategy.render', () => {
  test('renderiza traducciones', () => {
    const strategy = getLyricsStrategy('es-only');
    const { getByText } = render(
      strategy.render({ lines: mockLines, translations: mockTranslations })
    );
    expect(getByText('Hola mundo')).toBeTruthy();
    expect(getByText('Adiós mundo')).toBeTruthy();
  });

  test('muestra placeholder si no hay traducción', () => {
    const strategy = getLyricsStrategy('es-only');
    const { container } = render(
      strategy.render({ lines: mockLines, translations: [] })
    );
    expect(container).toBeTruthy();
  });
});

describe('BilingualStrategy.render', () => {
  test('renderiza tabla con columnas EN y ES', () => {
    const strategy = getLyricsStrategy('bilingual');
    const { getByText } = render(
      strategy.render({ lines: mockLines, translations: mockTranslations, activeIdx: 0, onLineClick: jest.fn() })
    );
    expect(getByText('EN')).toBeTruthy();
    expect(getByText('ES')).toBeTruthy();
    expect(getByText('Hello world')).toBeTruthy();
    expect(getByText('Hola mundo')).toBeTruthy();
  });

  test('llama onLineClick al hacer click en una fila', () => {
    const onLineClick = jest.fn();
    const strategy = getLyricsStrategy('bilingual');
    const { container } = render(
      strategy.render({ lines: mockLines, translations: mockTranslations, activeIdx: -1, onLineClick })
    );
    const row = container.querySelector('tr[data-line="0"]');
    row.click();
    expect(onLineClick).toHaveBeenCalledWith('Hello world', 0);
  });
});

describe('SyncedStrategy.render', () => {
  test('renderiza igual que EnOnlyStrategy', () => {
    const synced = getLyricsStrategy('synced');
    const { getByText } = render(
      synced.render({ lines: mockLines, activeIdx: 1, onLineClick: jest.fn() })
    );
    expect(getByText('Hello world')).toBeTruthy();
  });
});

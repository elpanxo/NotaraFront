import { cn } from '../lib/utils';

describe('cn (className utility)', () => {
  test('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  test('ignora valores falsy (null, undefined, false)', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar');
  });

  test('resuelve conflictos de Tailwind (último prevalece)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  test('acepta objetos condicionales', () => {
    expect(cn({ 'text-bold': true, hidden: false })).toBe('text-bold');
  });

  test('acepta arrays de clases', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  test('retorna cadena vacía si no hay argumentos', () => {
    expect(cn()).toBe('');
  });

  test('maneja múltiples conflictos Tailwind', () => {
    expect(cn('mx-2', 'mx-4', 'my-1')).toBe('mx-4 my-1');
  });

  test('preserva clases no conflictivas', () => {
    const result = cn('flex', 'items-center', 'justify-between');
    expect(result).toBe('flex items-center justify-between');
  });
});

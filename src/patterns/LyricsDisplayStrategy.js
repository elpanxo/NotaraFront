// Patrón Strategy — cada modo de visualización de letra es intercambiable sin tocar LessonPage.

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const lineBase    = 'px-3 py-2 rounded-lg cursor-pointer text-sm leading-relaxed transition-all duration-200';
const lineActive  = `${lineBase} bg-brand-green/15 text-brand-green font-semibold`;
const lineInactive = `${lineBase} text-white/75 hover:text-white hover:bg-brand-hover/60`;

// ─── Estrategias ──────────────────────────────────────────────────────────────

const EnOnlyStrategy = {
  id: 'en-only',
  label: 'Solo EN',
  render({ lines, activeIdx, onLineClick }) {
    return (
      <div className="space-y-0.5">
        {lines.map((line, i) => (
          <p
            key={i}
            data-line={i}
            onClick={() => onLineClick(line.text, i)}
            className={i === activeIdx ? lineActive : lineInactive}
          >
            {line.text || ' '}
          </p>
        ))}
      </div>
    );
  },
};

const EsOnlyStrategy = {
  id: 'es-only',
  label: 'Solo ES',
  render({ lines, translations }) {
    return (
      <div className="space-y-1">
        {lines.map((line, i) => (
          <p key={i} data-line={i} className="py-1.5 px-2 text-sm text-brand-text leading-relaxed">
            {translations[i] || <span className="opacity-30">—</span>}
          </p>
        ))}
      </div>
    );
  },
};

const BilingualStrategy = {
  id: 'bilingual',
  label: 'EN / ES',
  render({ lines, translations, activeIdx, onLineClick }) {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-brand-text text-[10px] font-semibold uppercase pb-2 pr-4 w-1/2">EN</th>
            <th className="text-left text-brand-text text-[10px] font-semibold uppercase pb-2 w-1/2">ES</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr
              key={i}
              data-line={i}
              onClick={() => onLineClick(line.text, i)}
              className={`cursor-pointer transition-colors ${i === activeIdx ? 'bg-brand-green/10' : 'hover:bg-brand-hover/50'}`}
            >
              <td className={`py-2 pr-4 text-sm leading-relaxed rounded-l-lg ${i === activeIdx ? 'text-brand-green font-medium' : 'text-white/80'}`}>
                {line.text || ' '}
              </td>
              <td className="py-2 text-sm leading-relaxed text-brand-text rounded-r-lg">
                {translations[i] || <span className="opacity-30">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
};

const SyncedStrategy = {
  id: 'synced',
  label: 'Letra sincronizada',
  render({ lines, activeIdx, onLineClick }) {
    return EnOnlyStrategy.render({ lines, activeIdx, onLineClick });
  },
};

// ─── Registro de estrategias ──────────────────────────────────────────────────

export const LYRICS_STRATEGIES = [
  EnOnlyStrategy,
  BilingualStrategy,
  EsOnlyStrategy,
  SyncedStrategy,
];

export function getLyricsStrategy(id) {
  return LYRICS_STRATEGIES.find(s => s.id === id) ?? EnOnlyStrategy;
}

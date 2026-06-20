'use client';
import { useState, useEffect } from 'react';
import { ia, progress as progressApi } from '../../lib/api';
import ExerciseCard from './ExerciseCard';

const styles = {
  panel:          'flex flex-col h-full bg-brand-card border-l border-white/10',
  header:         'flex items-start justify-between p-4 border-b border-white/10',
  phraseLabel:    'text-brand-text text-xs mb-1',
  phraseText:     'text-brand-green font-medium text-sm italic truncate',
  closeBtn:       'text-brand-text hover:text-white ml-3 text-xl flex-shrink-0',
  tabs:           'flex border-b border-white/10',
  tabActive:      'flex-1 py-3 text-xs font-medium transition-colors text-brand-green border-b-2 border-brand-green',
  tabInactive:    'flex-1 py-3 text-xs font-medium transition-colors text-brand-text hover:text-white',
  body:           'flex-1 overflow-y-auto p-4 space-y-4',
  errorBox:       'bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2 text-red-300 text-sm',
  skeleton:       'space-y-3 animate-pulse',
  skeletonLine:   'h-4 bg-brand-hover rounded',
  sectionLabel:   'text-brand-text text-xs font-medium uppercase mb-1',
  sectionText:    'text-white text-sm leading-relaxed',
  keywordBtn:     'bg-brand-green/20 text-brand-green text-xs rounded-full px-3 py-1 hover:bg-brand-green/30 transition-colors',
  loadingCenter:  'text-center py-8',
  spinner:        'w-8 h-8 rounded-full border-2 border-brand-green border-t-transparent animate-spin mx-auto',
  emptyText:      'text-brand-text text-sm text-center py-8',
  chatBubbleUser: 'max-w-[85%] rounded-xl px-3 py-2 text-sm bg-brand-green text-black',
  chatBubbleBot:  'max-w-[85%] rounded-xl px-3 py-2 text-sm bg-brand-hover text-white',
  typingDot:      'w-2 h-2 bg-brand-text rounded-full animate-bounce',
  chatInput:      'flex-1 bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none focus:border-brand-green',
  sendBtn:        'bg-brand-green text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-green-400 disabled:opacity-40 transition-colors',
};

const TABS = [
  { id: 'explain',   label: 'Explicar' },
  { id: 'exercises', label: 'Ejercicios' },
  { id: 'chat',      label: 'Chat' },
];

export default function IAPanel({ songId, phrase, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [exercises, setExercises]     = useState([]);
  const [loadingExp, setLoadingExp]   = useState(true);
  const [loadingEx, setLoadingEx]     = useState(false);
  const [error, setError]             = useState('');
  const [tab, setTab]                 = useState('explain');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!phrase) return;
    setExplanation(null);
    setExercises([]);
    setError('');
    setLoadingExp(true);
    setTab('explain');

    ia.explain(songId, phrase)
      .then((data) => setExplanation(data))
      .catch(() => setError('No se pudo obtener la explicación. Intenta más tarde.'))
      .finally(() => setLoadingExp(false));
  }, [songId, phrase]);

  const handleExercisesTab = async () => {
    setTab('exercises');
    if (exercises.length > 0) return;

    setLoadingEx(true);
    try {
      const data = await ia.getExercises(songId, phrase);
      setExercises(data.exercises || []);
    } catch {
      setError('No se pudieron cargar los ejercicios.');
    } finally {
      setLoadingEx(false);
    }
  };

  const handleTabChange = (t) => {
    if (t.id === 'exercises') handleExercisesTab();
    else setTab(t.id);
  };

  const handleWordLearned = async (word) => {
    try {
      await progressApi.saveWord(word, songId, phrase);
    } catch { /* silencioso */ }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);

    try {
      const data = await ia.chat(songId, message, chatMessages);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Error al responder. Intenta de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={styles.panel}>

      <div className={styles.header}>
        <div className="flex-1 min-w-0">
          <p className={styles.phraseLabel}>Frase seleccionada</p>
          <p className={styles.phraseText}>"{phrase}"</p>
        </div>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t)}
            className={tab === t.id ? styles.tabActive : styles.tabInactive}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.body}>
        {error && <div className={styles.errorBox}>{error}</div>}

        {tab === 'explain' && (
          <>
            {loadingExp ? (
              <div className={styles.skeleton}>
                {['w-3/4', 'w-full', 'w-5/6', 'w-2/3'].map((w, i) => (
                  <div key={i} className={`${styles.skeletonLine} ${w}`} />
                ))}
              </div>
            ) : explanation ? (
              <div className="animate-fadeIn space-y-4">
                {explanation.translation && (
                  <div>
                    <p className={styles.sectionLabel}>Traducción</p>
                    <p className={styles.sectionText}>{explanation.translation}</p>
                  </div>
                )}
                {explanation.explanation && (
                  <div>
                    <p className={styles.sectionLabel}>Explicación</p>
                    <p className={styles.sectionText}>{explanation.explanation}</p>
                  </div>
                )}
                {explanation.grammar && (
                  <div>
                    <p className={styles.sectionLabel}>Nota gramatical</p>
                    <p className={styles.sectionText}>{explanation.grammar}</p>
                  </div>
                )}
                {explanation.keywords?.length > 0 && (
                  <div>
                    <p className={styles.sectionLabel}>Vocabulario clave</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {explanation.keywords.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => handleWordLearned(kw.word)}
                          className={styles.keywordBtn}
                          title={kw.meaning}
                        >
                          {kw.word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {tab === 'exercises' && (
          <>
            {loadingEx ? (
              <div className={styles.loadingCenter}>
                <div className={styles.spinner} />
                <p className="text-brand-text text-sm mt-3">Generando ejercicios...</p>
              </div>
            ) : exercises.length > 0 ? (
              <div className="space-y-4 animate-fadeIn">
                {exercises.map((ex, i) => (
                  <div key={i}>
                    <p className="text-brand-text text-xs mb-2">Ejercicio {i + 1}</p>
                    <ExerciseCard exercise={ex} onCorrect={() => handleWordLearned(ex.targetWord)} />
                  </div>
                ))}
              </div>
            ) : (
              !error && <p className={styles.emptyText}>No hay ejercicios disponibles.</p>
            )}
          </>
        )}

        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            {chatMessages.length === 0 && (
              <p className={styles.emptyText}>
                Hazme preguntas sobre esta frase o sobre la canción.
              </p>
            )}
            <div className="space-y-3 flex-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleBot}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-brand-hover rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={styles.typingDot} style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {tab === 'chat' && (
        <div className="p-4 border-t border-white/10 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
            placeholder="Pregunta algo..."
            className={styles.chatInput}
          />
          <button
            onClick={handleChatSend}
            disabled={!chatInput.trim() || chatLoading}
            className={styles.sendBtn}
          >
            &#10148;
          </button>
        </div>
      )}
    </div>
  );
}

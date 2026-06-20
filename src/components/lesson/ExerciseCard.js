'use client';
import { useState } from 'react';

const styles = {
  correctCard:  'bg-green-900/30 border border-green-500/40 rounded-xl p-4 text-center animate-fadeIn',
  correctTitle: 'text-green-400 font-semibold text-lg',
  correctSub:   'text-green-300/80 text-sm mt-1',
  card:         'bg-brand-hover rounded-xl p-4 space-y-3',
  question:     'text-white text-sm leading-relaxed',
  inputRow:     'flex gap-2',
  inputIdle:    'flex-1 bg-brand-dark rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none border border-white/10 focus:border-brand-green transition-colors',
  inputWrong:   'flex-1 bg-brand-dark rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none border border-red-500/60 transition-colors',
  submitBtn:    'bg-brand-green text-black font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-400 transition-colors disabled:opacity-40',
  errorMsg:     'text-red-400 text-xs animate-fadeIn',
  hintToggle:   'text-brand-text text-xs hover:text-white transition-colors',
  hintBox:      'text-yellow-400/80 text-xs bg-yellow-900/20 rounded-lg px-3 py-2 animate-fadeIn',
};

export default function ExerciseCard({ exercise, onCorrect }) {
  const [input, setInput]       = useState('');
  const [status, setStatus]     = useState('idle'); // idle | correct | wrong
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleCheck = () => {
    const given   = input.trim().toLowerCase();
    const correct = exercise.answer.trim().toLowerCase();

    if (given === correct) {
      setStatus('correct');
      onCorrect?.();
    } else {
      setStatus('wrong');
      setAttempts((a) => a + 1);
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  if (status === 'correct') {
    return (
      <div className={styles.correctCard}>
        <p className={styles.correctTitle}>Correcto ✓</p>
        <p className={styles.correctSub}>La respuesta era: <strong>{exercise.answer}</strong></p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <p className={styles.question}>{exercise.question}</p>

      <div className={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && handleCheck()}
          placeholder="Tu respuesta..."
          className={status === 'wrong' ? styles.inputWrong : styles.inputIdle}
        />
        <button
          onClick={handleCheck}
          disabled={!input.trim()}
          className={styles.submitBtn}
        >
          ✓
        </button>
      </div>

      {status === 'wrong' && (
        <p className={styles.errorMsg}>Inténtalo de nuevo</p>
      )}

      {attempts >= 2 && exercise.hint && (
        <button onClick={() => setShowHint(!showHint)} className={styles.hintToggle}>
          {showHint ? 'Ocultar pista' : 'Ver pista'}
        </button>
      )}
      {showHint && exercise.hint && (
        <p className={styles.hintBox}>Pista: {exercise.hint}</p>
      )}
    </div>
  );
}

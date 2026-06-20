'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const styles = {
  page:      'min-h-screen bg-brand-dark flex items-center justify-center px-4',
  wrapper:   'w-full max-w-md animate-fadeIn',
  logoArea:  'text-center mb-8',
  logoMark:  'inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green mb-4',
  logoLetter:'text-black font-black text-2xl',
  appName:   'text-3xl font-bold text-white',
  tagline:   'text-brand-text mt-1',
  card:      'bg-brand-card rounded-2xl p-8 shadow-xl',
  cardTitle: 'text-xl font-semibold text-white mb-6',
  errorBox:  'bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg px-4 py-3 mb-4 text-sm',
  fieldLabel:'block text-sm text-brand-text mb-1',
  input:     'w-full bg-brand-hover border border-white/10 rounded-lg px-4 py-3 text-white placeholder-brand-text focus:outline-none focus:border-brand-green transition-colors',
  submitBtn: 'w-full bg-brand-green text-black font-semibold py-3 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2',
  footer:    'text-center text-brand-text text-sm mt-6',
  footerLink:'text-brand-green hover:underline',
};

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      window.location.href = `${apiUrl}/auth/spotify`;
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>

        <div className={styles.logoArea}>
          <div className={styles.logoMark}>
            <span className={styles.logoLetter}>N</span>
          </div>
          <h1 className={styles.appName}>Notara</h1>
          <p className={styles.tagline}>Crea tu cuenta gratuita</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Crear cuenta</h2>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={styles.fieldLabel}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className={styles.input}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>Confirmar contraseña</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className={styles.footer}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className={styles.footerLink}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

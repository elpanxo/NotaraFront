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

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/search');
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas');
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
          <p className={styles.tagline}>Aprende inglés con tu música favorita</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Iniciar sesión</h2>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
                className={styles.input}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className={styles.footer}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" className={styles.footerLink}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

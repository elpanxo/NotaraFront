'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Tutor con IA',
    desc: 'Seleccioná cualquier frase de la letra y recibí explicaciones instantáneas adaptadas a tu nivel.',
  },
  {
    title: 'Canciones reales',
    desc: 'Aprendé con las canciones que ya escuchás. Notara las encuentra en Spotify y extrae la letra automáticamente.',
  },
  {
    title: 'Tu progreso',
    desc: 'Rastrea cada canción estudiada, acumulá XP y visualizá tu avance día a día.',
  },
];

const steps = [
  { n: '01', title: 'Buscá una canción', desc: 'Cualquier artista, cualquier género. Notara la encuentra en Spotify.' },
  { n: '02', title: 'Aprendé con la letra', desc: 'Seleccioná frases, pedí explicaciones a la IA y resolvé ejercicios.' },
  { n: '03', title: 'Avanzá tu nivel', desc: 'Acumulá XP, desbloqueá logros y seguí tu racha de estudio.' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/search');
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green" />
            <span className="font-semibold text-sm">Notara</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm text-brand-text hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="px-4 py-1.5 text-sm bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green/90 transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Gradiente radial sutil brand-green sobre brand-dark */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(34,197,94,0.13) 0%, transparent 70%)' }}
          />
          <div className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center relative">
            <p
              className="text-brand-green text-xs font-semibold uppercase tracking-widest mb-6 animate-slide-up"
              style={{ animationDelay: '0ms' }}
            >
              Plataforma de inglés con música
            </p>
            <h1
              className="text-5xl font-bold leading-tight tracking-tight mb-6 animate-slide-up"
              style={{ animationDelay: '80ms' }}
            >
              Aprendé inglés con<br />
              <span className="text-brand-green">la música que amás</span>
            </h1>
            <p
              className="text-brand-text text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up"
              style={{ animationDelay: '160ms' }}
            >
              Buscá cualquier canción, seleccioná frases de la letra y dejá que la IA te explique el idioma en tiempo real.
            </p>
            <div
              className="flex items-center justify-center gap-3 animate-slide-up"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href="/register"
                className="px-6 py-3 bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green/90 transition-all shadow-[0_0_24px_rgba(34,197,94,0.30)] hover:shadow-[0_0_32px_rgba(34,197,94,0.45)]"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 border border-white/10 text-white rounded-lg hover:border-white/20 hover:bg-brand-card transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-white/5 bg-brand-card hover:border-brand-green/25 hover:scale-[1.02] transition-all duration-200 cursor-default"
              >
                <div className="w-8 h-0.5 bg-brand-green rounded mb-5" />
                <h3 className="font-semibold text-white mb-3">{f.title}</h3>
                <p className="text-brand-text text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <p className="text-brand-text text-xs font-semibold uppercase tracking-widest mb-14 text-center">
              Cómo funciona
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-col gap-3">
                  <span className="text-brand-green font-mono text-sm font-semibold">{s.n}</span>
                  <h3 className="font-semibold text-white">{s.title}</h3>
                  <p className="text-brand-text text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <h2 className="text-3xl font-bold mb-4">Empezá hoy</h2>
            <p className="text-brand-text mb-8 text-sm">Sin tarjeta de crédito. Sin compromisos.</p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green/90 transition-all shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_28px_rgba(34,197,94,0.40)]"
            >
              Crear cuenta gratuita
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            <span className="text-sm text-brand-text">Notara</span>
          </div>
          <p className="text-brand-text text-xs">Aprender inglés, un verso a la vez.</p>
        </div>
      </footer>

    </div>
  );
}

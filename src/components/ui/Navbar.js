'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getProgress } from '../../lib/progressStore';

const styles = {
  nav:          'sticky top-0 z-50 bg-brand-dark/90 backdrop-blur-md border-b border-white/5',
  inner:        'max-w-none px-6 h-16 flex items-center gap-5',
  logo:         'flex items-center gap-2.5 mr-4 shrink-0',
  logoBadge:    'w-7 h-7 rounded-lg bg-brand-green flex items-center justify-center flex-shrink-0',
  logoLetter:   'text-black font-black text-sm leading-none',
  logoText:     'text-white font-bold text-base tracking-tight',
  navLinks:     'flex items-center gap-1',
  linkActive:   'px-3 py-1.5 text-sm font-medium text-white bg-brand-card rounded-lg',
  linkInactive: 'px-3 py-1.5 text-sm font-medium text-brand-text hover:text-white hover:bg-brand-card/50 rounded-lg transition-colors',
  spacer:       'flex-1',
  rightArea:    'flex items-center gap-3 shrink-0',
  xpPill:       'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-card border border-white/5',
  xpDot:        'w-1.5 h-1.5 rounded-full bg-brand-green',
  xpText:       'text-xs font-semibold text-white',
  xpSub:        'text-xs text-brand-text',
  badge:        'bg-brand-green text-black text-xs font-semibold px-3 py-1 rounded-full',
  avatar:       'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-brand-green/50 transition-all',
  logoutBtn:    'text-brand-text hover:text-white text-sm transition-colors ml-1',
};

const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000];
function getLevel(xp) { return LEVEL_THRESHOLDS.filter(t => xp >= t).length; }

const navLinks = [
  { href: '/search',       label: 'Buscar',       match: '/search' },
  { href: '/dashboard',    label: 'Mi progreso',  match: '/dashboard' },
  { href: '/vocabulario',  label: 'Vocabulario',  match: '/vocabulario' },
  { href: '/notas',        label: 'Notas',        match: '/notas' },
  { href: '/suscripcion',  label: 'Suscripción',  match: '/suscripcion' },
  { href: '/achievements', label: 'Logros',       match: '/achievements' },
];

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
}

export default function Navbar({ lessonBadge }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [xp, setXp]           = useState(0);
  const [avatarColor, setAvatarColor] = useState('#8b5cf6');
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    const update = () => {
      const p = getProgress();
      setXp(p.xp || 0);
    };
    update();
    window.addEventListener('notara_progress_update', update);
    return () => window.removeEventListener('notara_progress_update', update);
  }, []);

  useEffect(() => {
    const updateProfile = () => {
      try {
        const p = JSON.parse(localStorage.getItem('notara_profile') || 'null');
        if (p) {
          setAvatarColor(p.avatarColor || '#8b5cf6');
          setNickname(p.nickname || '');
        }
      } catch {}
    };
    updateProfile();
    window.addEventListener('notara_profile_update', updateProfile);
    return () => window.removeEventListener('notara_profile_update', updateProfile);
  }, []);

  const level = getLevel(xp);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isOnLesson = pathname?.startsWith('/lesson');

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        <Link href="/search" className={styles.logo}>
          <div className={styles.logoBadge}>
            <span className={styles.logoLetter}>N</span>
          </div>
          <span className={styles.logoText}>Notara</span>
        </Link>

        <div className={styles.navLinks}>
          {isOnLesson && (
            <span className={styles.linkActive}>Lección</span>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname?.startsWith(link.match) ? styles.linkActive : styles.linkInactive}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.spacer} />

        <div className={styles.rightArea}>
          {lessonBadge && (
            <span className={styles.badge}>{lessonBadge}</span>
          )}
          {!loading && user && (
            <>
              <div className={styles.xpPill}>
                <span className={styles.xpDot} />
                <span className={styles.xpText}>Nv. {level}</span>
                <span className={styles.xpSub}>{xp} XP</span>
              </div>
              <Link
                href="/profile"
                className={styles.avatar}
                style={{ backgroundColor: avatarColor }}
                title="Mi perfil"
              >
                {getInitials(nickname || user.name)}
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Salir
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

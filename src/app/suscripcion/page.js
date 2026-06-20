'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { suscripciones as suscApi } from '../../lib/api';

const PLANES = [
  { id: 'BASICO',      label: 'Básico',       precio: 9.99,  desc: 'Acceso a canciones y vocabulario básico' },
  { id: 'PREMIUM',     label: 'Premium',      precio: 19.99, desc: 'Todo lo anterior + IA Tutor sin límites' },
  { id: 'EMPRESARIAL', label: 'Empresarial',  precio: 49.99, desc: 'Todo Premium + acceso para equipos' },
];

const ESTADO_BADGE = {
  ACTIVA:    'bg-brand-green/15 text-brand-green',
  PENDIENTE: 'bg-yellow-500/15 text-yellow-400',
  CANCELADA: 'bg-red-500/15 text-red-400',
  VENCIDA:   'bg-brand-text/15 text-brand-text',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL');
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

export default function SuscripcionPage() {
  const { user } = useAuth();
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('lista');
  const [planSeleccionado, setPlanSeleccionado] = useState('PREMIUM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    suscApi.porUsuario(userId)
      .then((data) => setSuscripciones(Array.isArray(data) ? data : []))
      .catch(() => setSuscripciones([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const activa = suscripciones.find((s) => s.estado === 'ACTIVA' || s.estado === 'PENDIENTE');

  const contratar = async () => {
    setSaving(true);
    setError('');
    const plan = PLANES.find((p) => p.id === planSeleccionado);
    const hoy = new Date().toISOString().split('T')[0];
    try {
      const nueva = await suscApi.crear({
        idUsuario:     userId,
        emailUsuario:  user?.email || '',
        nombreUsuario: user?.name  || 'Usuario',
        plan:          plan.id,
        fechaInicio:   hoy,
        fechaFin:      addMonths(hoy, 1),
        monto:         plan.precio,
      });
      setSuscripciones((prev) => [nueva, ...prev]);
      setVista('lista');
    } catch (e) {
      setError(e.message || 'No se pudo crear la suscripción');
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async (id) => {
    try {
      const updated = await suscApi.cancelar(id);
      setSuscripciones((prev) => prev.map((s) => s.id === id ? { ...s, estado: 'CANCELADA', ...(updated || {}) } : s));
      setConfirmando(null);
    } catch (e) {
      alert(e.message || 'No se pudo cancelar');
    }
  };

  const renovar = async (id, fechaFinActual) => {
    try {
      const nuevaFin = addMonths(fechaFinActual || new Date(), 1);
      const updated = await suscApi.renovar(id, nuevaFin);
      setSuscripciones((prev) => prev.map((s) => s.id === id ? { ...s, estado: 'ACTIVA', fechaFin: nuevaFin, ...(updated || {}) } : s));
    } catch (e) {
      alert(e.message || 'No se pudo renovar');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Suscripción</h1>
            <p className="text-brand-text text-sm mt-0.5">Gestiona tu plan Notara</p>
          </div>
          {vista === 'lista' && !activa && (
            <button
              onClick={() => setVista('contratar')}
              className="bg-brand-green text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-400 transition-colors"
            >
              Contratar plan
            </button>
          )}
          {vista === 'contratar' && (
            <button
              onClick={() => setVista('lista')}
              className="text-brand-text text-sm hover:text-white transition-colors"
            >
              ← Volver
            </button>
          )}
        </div>

        {vista === 'lista' && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-brand-card rounded-xl h-24 animate-pulse border border-white/5" />
                ))}
              </div>
            ) : suscripciones.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white font-medium">Sin suscripciones</p>
                <p className="text-brand-text text-sm mt-1">Contrata un plan para desbloquear todo Notara</p>
                <button
                  onClick={() => setVista('contratar')}
                  className="mt-5 bg-brand-green text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-green-400 transition-colors"
                >
                  Ver planes
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {suscripciones.map((s) => {
                  const isActiva = s.estado === 'ACTIVA';
                  const isPendiente = s.estado === 'PENDIENTE';
                  const isCancelada = s.estado === 'CANCELADA';
                  const badgeClass = ESTADO_BADGE[s.estado] || 'bg-brand-text/15 text-brand-text';
                  return (
                    <div key={s.id} className={`bg-brand-card rounded-2xl p-5 border ${isActiva ? 'border-brand-green/20' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{s.plan}</h3>
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${badgeClass}`}>
                              {s.estado}
                            </span>
                          </div>
                          <p className="text-brand-text text-xs">
                            {formatDate(s.fechaInicio)} → {formatDate(s.fechaFin)}
                          </p>
                          <p className="text-brand-text text-xs mt-0.5">
                            ${s.monto?.toFixed(2)} / mes
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {isCancelada && (
                            <button
                              onClick={() => renovar(s.id, s.fechaFin)}
                              className="text-xs bg-brand-green text-black font-semibold px-3 py-1.5 rounded-full hover:bg-green-400 transition-colors"
                            >
                              Renovar
                            </button>
                          )}
                          {(isActiva || isPendiente) && confirmando !== s.id && (
                            <button
                              onClick={() => setConfirmando(s.id)}
                              className="text-xs text-brand-text hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-full"
                            >
                              Cancelar
                            </button>
                          )}
                          {confirmando === s.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmando(null)}
                                className="text-xs text-brand-text border border-white/10 px-3 py-1.5 rounded-full hover:text-white transition-colors"
                              >
                                No
                              </button>
                              <button
                                onClick={() => cancelar(s.id)}
                                className="text-xs bg-red-500/20 text-red-400 border border-red-400/20 px-3 py-1.5 rounded-full hover:bg-red-500/30 transition-colors"
                              >
                                Confirmar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {vista === 'contratar' && (
          <div className="space-y-4">
            <p className="text-brand-text text-sm">Elige el plan que mejor se adapte a ti</p>

            <div className="grid gap-3">
              {PLANES.map((plan) => {
                const sel = planSeleccionado === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setPlanSeleccionado(plan.id)}
                    className={`text-left bg-brand-card rounded-xl p-4 border transition-all ${sel ? 'border-brand-green' : 'border-white/5 hover:border-white/15'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${sel ? 'text-white' : 'text-brand-text'}`}>{plan.label}</span>
                          {plan.id === 'PREMIUM' && (
                            <span className="text-[10px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded-full font-semibold">Popular</span>
                          )}
                        </div>
                        <p className="text-brand-text text-xs mt-1">{plan.desc}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`font-bold ${sel ? 'text-brand-green' : 'text-white'}`}>${plan.precio}</p>
                        <p className="text-brand-text text-[10px]">/mes</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={contratar}
              disabled={saving}
              className="w-full py-3 bg-brand-green text-black font-bold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-60"
            >
              {saving ? 'Procesando…' : `Contratar ${PLANES.find((p) => p.id === planSeleccionado)?.label}`}
            </button>

            <p className="text-brand-text text-xs text-center">
              Se enviará un correo de confirmación a {user?.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

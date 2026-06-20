'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../components/ui/Navbar';
import { useAuth } from '../../context/AuthContext';
import { notas as notasApi, metas as metasApi } from '../../lib/api';

const EMPTY_NOTA = { titulo: '', contenido: '' };
const EMPTY_META = { nombre: '', descripcion: '', fechaLimite: '', completada: false };

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL');
}

function NotaCard({ nota, onEdit, onDelete }) {
  return (
    <div className="bg-brand-card rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold text-sm truncate flex-1">{nota.titulo}</h3>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(nota)} className="text-brand-text hover:text-white text-xs transition-colors">Editar</button>
          <button onClick={() => onDelete(nota.id)} className="text-brand-text hover:text-red-400 text-xs transition-colors">Eliminar</button>
        </div>
      </div>
      {nota.contenido && (
        <p className="text-brand-text text-xs mt-2 leading-relaxed line-clamp-3">{nota.contenido}</p>
      )}
    </div>
  );
}

function MetaCard({ meta, onEdit, onDelete }) {
  return (
    <div className={`bg-brand-card rounded-xl p-4 border transition-colors ${meta.completada ? 'border-brand-green/20' : 'border-white/5 hover:border-white/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${meta.completada ? 'bg-brand-green' : 'bg-brand-text/40'}`} />
          <h3 className={`font-semibold text-sm truncate ${meta.completada ? 'line-through text-brand-text' : 'text-white'}`}>{meta.nombre}</h3>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(meta)} className="text-brand-text hover:text-white text-xs transition-colors">Editar</button>
          <button onClick={() => onDelete(meta.id)} className="text-brand-text hover:text-red-400 text-xs transition-colors">Eliminar</button>
        </div>
      </div>
      {meta.descripcion && (
        <p className="text-brand-text text-xs mt-2 leading-relaxed line-clamp-2">{meta.descripcion}</p>
      )}
      {meta.fechaLimite && (
        <p className="text-brand-text text-[10px] mt-2">Límite: {formatDate(meta.fechaLimite)}</p>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-brand-card rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-brand-text hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function NotasPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('notas');
  const [notasList, setNotasList] = useState([]);
  const [metasList, setMetasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      notasApi.porUsuario(userId).catch(() => []),
      metasApi.porUsuario(userId).catch(() => []),
    ]).then(([n, m]) => {
      setNotasList(Array.isArray(n) ? n : []);
      setMetasList(Array.isArray(m) ? m : []);
    }).finally(() => setLoading(false));
  }, [userId]);

  const openNota = (nota = null) => {
    setForm(nota ? { titulo: nota.titulo, contenido: nota.contenido, id: nota.id } : EMPTY_NOTA);
    setModal('nota');
    setError('');
  };

  const openMeta = (meta = null) => {
    setForm(meta
      ? { nombre: meta.nombre, descripcion: meta.descripcion || '', fechaLimite: meta.fechaLimite || '', completada: meta.completada, id: meta.id }
      : EMPTY_META);
    setModal('meta');
    setError('');
  };

  const closeModal = () => { setModal(null); setError(''); };

  const saveNota = async () => {
    if (!form.titulo?.trim()) { setError('El título es obligatorio'); return; }
    setSaving(true);
    try {
      if (form.id) {
        const updated = await notasApi.actualizar(form.id, form.titulo, form.contenido, userId);
        setNotasList((prev) => prev.map((n) => n.id === form.id ? updated : n));
      } else {
        const created = await notasApi.crear(form.titulo, form.contenido, userId);
        setNotasList((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteNota = async (id) => {
    try {
      await notasApi.eliminar(id);
      setNotasList((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('No se pudo eliminar la nota');
    }
  };

  const saveMeta = async () => {
    if (!form.nombre?.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const datos = { nombre: form.nombre, descripcion: form.descripcion, fechaLimite: form.fechaLimite || null, completada: form.completada, idUsuario: userId };
      if (form.id) {
        const updated = await metasApi.actualizar(form.id, datos);
        setMetasList((prev) => prev.map((m) => m.id === form.id ? updated : m));
      } else {
        const created = await metasApi.crear(datos);
        setMetasList((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteMeta = async (id) => {
    try {
      await metasApi.eliminar(id);
      setMetasList((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('No se pudo eliminar la meta');
    }
  };

  const inputClass = 'w-full bg-brand-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-brand-text focus:outline-none focus:border-brand-green transition-colors';

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notas y Metas</h1>
            <p className="text-brand-text text-sm mt-0.5">Organiza tu aprendizaje</p>
          </div>
          <button
            onClick={() => tab === 'notas' ? openNota() : openMeta()}
            className="bg-brand-green text-black text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-400 transition-colors"
          >
            + Nueva {tab === 'notas' ? 'nota' : 'meta'}
          </button>
        </div>

        <div className="flex gap-1 bg-brand-card rounded-xl p-1 w-fit border border-white/5">
          {['notas', 'metas'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-brand-hover text-white' : 'text-brand-text hover:text-white'}`}
            >
              {t} {t === 'notas' ? `(${notasList.length})` : `(${metasList.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-brand-card rounded-xl h-20 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : tab === 'notas' ? (
          notasList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white font-medium">Sin notas todavía</p>
              <p className="text-brand-text text-sm mt-1">Crea una nota para guardar ideas de tu aprendizaje</p>
              <button onClick={() => openNota()} className="mt-4 bg-brand-green text-black text-sm font-semibold px-5 py-2 rounded-full hover:bg-green-400 transition-colors">
                Crear nota
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {notasList.map((n) => (
                <NotaCard key={n.id} nota={n} onEdit={openNota} onDelete={deleteNota} />
              ))}
            </div>
          )
        ) : (
          metasList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white font-medium">Sin metas todavía</p>
              <p className="text-brand-text text-sm mt-1">Define metas para mantener el foco en tu aprendizaje</p>
              <button onClick={() => openMeta()} className="mt-4 bg-brand-green text-black text-sm font-semibold px-5 py-2 rounded-full hover:bg-green-400 transition-colors">
                Crear meta
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {metasList.map((m) => (
                <MetaCard key={m.id} meta={m} onEdit={openMeta} onDelete={deleteMeta} />
              ))}
            </div>
          )
        )}
      </div>

      {modal === 'nota' && (
        <Modal title={form.id ? 'Editar nota' : 'Nueva nota'} onClose={closeModal}>
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="Título *"
              value={form.titulo || ''}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              maxLength={100}
            />
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="Contenido (opcional)"
              value={form.contenido || ''}
              onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
              rows={5}
              maxLength={500}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={closeModal} className="flex-1 py-2 text-sm text-brand-text border border-white/10 rounded-lg hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={saveNota} disabled={saving} className="flex-1 py-2 text-sm bg-brand-green text-black font-semibold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-60">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'meta' && (
        <Modal title={form.id ? 'Editar meta' : 'Nueva meta'} onClose={closeModal}>
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="Nombre de la meta *"
              value={form.nombre || ''}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              maxLength={100}
            />
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="Descripción (opcional)"
              value={form.descripcion || ''}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={3}
            />
            <div>
              <label className="text-brand-text text-xs mb-1 block">Fecha límite</label>
              <input
                type="date"
                className={inputClass}
                value={form.fechaLimite || ''}
                onChange={(e) => setForm((f) => ({ ...f, fechaLimite: e.target.value }))}
              />
            </div>
            {form.id && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.completada || false}
                  onChange={(e) => setForm((f) => ({ ...f, completada: e.target.checked }))}
                  className="accent-brand-green"
                />
                <span className="text-brand-text text-sm">Marcar como completada</span>
              </label>
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={closeModal} className="flex-1 py-2 text-sm text-brand-text border border-white/10 rounded-lg hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={saveMeta} disabled={saving} className="flex-1 py-2 text-sm bg-brand-green text-black font-semibold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-60">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

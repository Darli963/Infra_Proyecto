import { useState, useCallback, FormEvent } from "react";
import { useFetch } from "../hooks/useFetch";
import { api, type RiskQuestionAdmin, type RiskQuestionInput } from "../services/api";
import { Spinner, ErrorMessage } from "../components/Feedback";
import { Modal, ConfirmModal } from "../components/Modal";

const INPUT_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT", "NUMBER", "BOOLEAN"];

interface OptionRow { label: string; riskFactor: string }

function QuestionForm({
  initial, onSubmit, onCancel,
}: {
  initial?: RiskQuestionAdmin;
  onSubmit: (d: RiskQuestionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [text,      setText]      = useState(initial?.text      ?? "");
  const [inputType, setInputType] = useState(initial?.inputType ?? "SINGLE_CHOICE");
  const [required,  setRequired]  = useState(initial?.required  ?? true);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [active,    setActive]    = useState(initial?.active    ?? true);
  const [options,   setOptions]   = useState<OptionRow[]>(
    initial?.options.length
      ? initial.options.map((o) => ({ label: o.label, riskFactor: o.riskFactor }))
      : [{ label: "", riskFactor: "1.0" }]
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const needsOptions = inputType === "SINGLE_CHOICE" || inputType === "MULTIPLE_CHOICE";
  const f = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  function setOpt(i: number, key: keyof OptionRow, val: string) {
    setOptions((p) => p.map((r, j) => j === i ? { ...r, [key]: val } : r));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await onSubmit({
        text, inputType, required, sortOrder: Number(sortOrder), active,
        options: needsOptions
          ? options.filter((o) => o.label.trim()).map((o, i) => ({ label: o.label, riskFactor: Number(o.riskFactor), sortOrder: i }))
          : undefined,
      });
    } catch (err) { setError((err as Error).message); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <label className="label">Pregunta</label>
        <textarea className={f} required rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo de input</label>
          <select className={f} value={inputType} onChange={(e) => setInputType(e.target.value)}>
            {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Orden</label>
          <input className={f} type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-blue-600" /> Requerida
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-blue-600" /> Activa
        </label>
      </div>

      {needsOptions && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Opciones</span>
            <button type="button" onClick={() => setOptions((p) => [...p, { label: "", riskFactor: "1.0" }])} className="text-xs text-blue-600 hover:underline">+ Añadir</button>
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className={`${f} flex-1`} placeholder="Etiqueta" required={i === 0} value={opt.label} onChange={(e) => setOpt(i, "label", e.target.value)} />
                <input className={`${f} w-24`} type="number" step="0.0001" min="0" placeholder="Factor" value={opt.riskFactor} onChange={(e) => setOpt(i, "riskFactor", e.target.value)} />
                {options.length > 1 && (
                  <button type="button" onClick={() => setOptions((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear pregunta"}
        </button>
      </div>
    </form>
  );
}

export default function RiskQuestionsPage() {
  const [refresh, setRefresh] = useState(0);
  const bump = useCallback(() => setRefresh((n) => n + 1), []);

  const { data, loading, error } = useFetch(() => api.dealer.riskQuestions.list(), [refresh]);

  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<RiskQuestionAdmin | null>(null);
  const [deleting, setDeleting] = useState<RiskQuestionAdmin | null>(null);
  const [delLoad,  setDelLoad]  = useState(false);
  const [delErr,   setDelErr]   = useState<string | null>(null);

  async function handleCreate(d: RiskQuestionInput) { await api.dealer.riskQuestions.create(d); setCreating(false); bump(); }
  async function handleUpdate(d: RiskQuestionInput) { await api.dealer.riskQuestions.update(editing!.id, d); setEditing(null); bump(); }
  async function handleDelete() {
    setDelLoad(true); setDelErr(null);
    try { await api.dealer.riskQuestions.remove(deleting!.id); setDeleting(null); bump(); }
    catch (e) { setDelErr((e as Error).message); }
    finally { setDelLoad(false); }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Preguntas de riesgo</h1>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Nueva pregunta
        </button>
      </div>

      {delErr  && <div className="mb-3"><ErrorMessage message={delErr} /></div>}
      {loading && <Spinner />}
      {error   && <ErrorMessage message={error} />}

      {data && (
        <div className="space-y-3">
          {data.length === 0 && <p className="py-8 text-center text-gray-400">Sin preguntas registradas.</p>}
          {data.map((q) => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{q.text}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{q.inputType} · orden {q.sortOrder}</p>
                  {q.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.options.map((o) => (
                        <span key={o.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {o.label} <span className="text-gray-400">(×{Number(o.riskFactor).toFixed(2)})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${q.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {q.active ? "Activa" : "Inactiva"}
                  </span>
                  <button onClick={() => setEditing(q)} className="text-xs text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => { setDelErr(null); setDeleting(q); }} className="text-xs text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <Modal title="Nueva pregunta" onClose={() => setCreating(false)}><QuestionForm onSubmit={handleCreate} onCancel={() => setCreating(false)} /></Modal>}
      {editing  && <Modal title="Editar pregunta" onClose={() => setEditing(null)}><QuestionForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} /></Modal>}
      {deleting && <ConfirmModal message={`¿Eliminar la pregunta "${deleting.text.slice(0, 60)}..."?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={delLoad} />}
    </div>
  );
}

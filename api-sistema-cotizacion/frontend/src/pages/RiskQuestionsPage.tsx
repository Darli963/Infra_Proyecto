import { useState, useCallback, FormEvent } from "react";
import { useFetch } from "../hooks/useFetch";
import { api } from "../services/api";
import type { RiskQuestionGroup } from "../services/types";
import { Spinner, ErrorMessage } from "../components/Feedback";
import { Modal, ConfirmModal } from "../components/Modal";

const INPUT_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT", "NUMBER", "BOOLEAN"];

interface NestedOptionRow {
  id?: string;
  label: string;
  riskFactor: string;
}

interface NestedQuestionRow {
  id?: string;
  text: string;
  inputType: string;
  required: boolean;
  sortOrder: number;
  active: boolean;
  options: NestedOptionRow[];
}

function GroupForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: RiskQuestionGroup;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [questions, setQuestions] = useState<NestedQuestionRow[]>(
    initial?.questions?.length
      ? initial.questions.map((q) => ({
          id: q.id,
          text: q.text,
          inputType: q.inputType,
          required: q.required,
          sortOrder: q.sortOrder,
          active: q.active,
          options: q.options?.length
            ? q.options.map((o) => ({ id: o.id, label: o.label, riskFactor: String(o.riskFactor) }))
            : [{ label: "", riskFactor: "1.0" }],
        }))
      : []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        inputType: "SINGLE_CHOICE",
        required: true,
        sortOrder: prev.length,
        active: true,
        options: [{ label: "", riskFactor: "1.0" }],
      },
    ]);
  }

  function removeQuestion(qIdx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
  }

  function updateQuestion(qIdx: number, key: keyof NestedQuestionRow, val: any) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, [key]: val } : q))
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: [...q.options, { label: "", riskFactor: "1.0" }] }
          : q
      )
    );
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.filter((_, j) => j !== optIdx) }
          : q
      )
    );
  }

  function updateOption(qIdx: number, optIdx: number, key: keyof NestedOptionRow, val: string) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) => (j === optIdx ? { ...o, [key]: val } : o)),
            }
          : q
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        active,
        questions: questions.map((q) => {
          const needsOptions = q.inputType === "SINGLE_CHOICE" || q.inputType === "MULTIPLE_CHOICE";
          return {
            id: q.id,
            text: q.text,
            inputType: q.inputType,
            required: q.required,
            sortOrder: q.sortOrder,
            active: q.active,
            options: needsOptions
              ? q.options
                  .filter((o) => o.label.trim())
                  .map((o, optIdx) => ({
                    id: o.id,
                    label: o.label,
                    riskFactor: Number(o.riskFactor),
                    sortOrder: optIdx,
                  }))
              : undefined,
          };
        }),
      };
      await onSubmit(payload);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
      {/* Aviso solicitado por el usuario */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <div className="flex gap-2">
          <svg className="h-5 w-5 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Información del Grupo de Preguntas</p>
            <p className="mt-1 leading-relaxed text-xs">
              En el grupo de preguntas se agregará cada pregunta, se configurará con un tipo de respuesta, y se le asignará un valor para la ecuación en la cual haremos la sumatoria de todas las respuestas de ese grupo de preguntas.
            </p>
            <p className="mt-2 font-semibold text-blue-900 border-t border-blue-200 pt-2 text-xs">
              Al final, agrega un peso entre 0.1 y 1 a cada respuesta de esa pregunta.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Nombre del grupo</label>
          <input className={f} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cuestionario de Riesgo General" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Descripción</label>
          <input className={f} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Preguntas para medir riesgo de robo y uso" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="group-active" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-blue-600 h-4 w-4" />
        <label htmlFor="group-active" className="text-sm text-gray-700 cursor-pointer select-none">Grupo Activo</label>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Preguntas</h3>
          <button type="button" onClick={addQuestion} className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition">
            + Añadir pregunta
          </button>
        </div>

        {questions.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400 border border-dashed rounded-lg">No hay preguntas agregadas a este grupo aún.</p>
        )}

        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const needsOptions = q.inputType === "SINGLE_CHOICE" || q.inputType === "MULTIPLE_CHOICE";
            return (
              <div key={qIdx} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3 relative shadow-xs">
                <button type="button" onClick={() => removeQuestion(qIdx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg leading-none" title="Quitar pregunta">×</button>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Pregunta #{qIdx + 1}</label>
                  <textarea className={f} required rows={2} value={q.text} onChange={(e) => updateQuestion(qIdx, "text", e.target.value)} placeholder="Escribe el enunciado de la pregunta..." />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tipo de entrada</label>
                    <select className={f} value={q.inputType} onChange={(e) => updateQuestion(qIdx, "inputType", e.target.value)}>
                      {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Orden de visualización</label>
                    <input className={f} type="number" min={0} value={q.sortOrder} onChange={(e) => updateQuestion(qIdx, "sortOrder", Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qIdx, "required", e.target.checked)} className="accent-blue-600" /> Requerida
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={q.active} onChange={(e) => updateQuestion(qIdx, "active", e.target.checked)} className="accent-blue-600" /> Activa
                  </label>
                </div>

                {needsOptions && (
                  <div className="border-t border-gray-200/60 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600">Respuestas y Pesos de Riesgo</span>
                      <button type="button" onClick={() => addOption(qIdx)} className="text-xs text-blue-600 font-semibold hover:underline">+ Añadir opción</button>
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex gap-2 items-center">
                          <input className={`${f} flex-1`} placeholder="Texto de la respuesta (ej: Sí, cochera privada)" required value={opt.label} onChange={(e) => updateOption(qIdx, oIdx, "label", e.target.value)} />
                          <input className={`${f} w-32`} type="number" step="0.0001" placeholder="Peso/Riesgo (ej: -0.2 o 0.5)" value={opt.riskFactor} onChange={(e) => updateOption(qIdx, oIdx, "riskFactor", e.target.value)} />
                          {q.options.length > 1 && (
                            <button type="button" onClick={() => removeOption(qIdx, oIdx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-3">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}

export default function RiskQuestionsPage() {
  const [refresh, setRefresh] = useState(0);
  const bump = useCallback(() => setRefresh((n) => n + 1), []);

  const { data, loading, error } = useFetch(() => api.dealer.riskQuestionGroups.list(), [refresh]);

  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<RiskQuestionGroup | null>(null);
  const [deleting, setDeleting] = useState<RiskQuestionGroup | null>(null);
  const [delLoad,  setDelLoad]  = useState(false);
  const [delErr,   setDelErr]   = useState<string | null>(null);

  async function handleCreate(payload: any) {
    await api.dealer.riskQuestionGroups.create(payload);
    setCreating(false);
    bump();
  }

  async function handleUpdate(payload: any) {
    await api.dealer.riskQuestionGroups.update(editing!.id, payload);
    setEditing(null);
    bump();
  }

  async function handleDelete() {
    setDelLoad(true);
    setDelErr(null);
    try {
      await api.dealer.riskQuestionGroups.remove(deleting!.id);
      setDeleting(null);
      bump();
    } catch (e) {
      setDelErr((e as Error).message);
    } finally {
      setDelLoad(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preguntas de riesgo</h1>
          <p className="text-sm text-gray-500">Administra los grupos de preguntas que se asocian a las motocicletas para calcular el riesgo en las cotizaciones.</p>
        </div>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          + Nuevo grupo de preguntas
        </button>
      </div>

      {delErr  && <div className="mb-3"><ErrorMessage message={delErr} /></div>}
      {loading && <Spinner />}
      {error   && <ErrorMessage message={error} />}

      {data && (
        <div className="space-y-4">
          {data.length === 0 && <p className="py-8 text-center text-gray-400">Sin grupos de preguntas registrados.</p>}
          {data.map((group) => (
            <div key={group.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{group.name}</h2>
                  {group.description && <p className="text-sm text-gray-500 mt-0.5">{group.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${group.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {group.active ? "Activa" : "Inactiva"}
                  </span>
                  <button onClick={() => setEditing(group)} className="text-xs font-semibold text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => { setDelErr(null); setDeleting(group); }} className="text-xs font-semibold text-red-500 hover:underline">Eliminar</button>
                </div>
              </div>

              {/* Preguntas dentro del grupo */}
              <div className="space-y-3 pl-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preguntas del Grupo ({group.questions?.length ?? 0})</h3>
                {(!group.questions || group.questions.length === 0) && (
                  <p className="text-sm text-gray-400 italic">No hay preguntas en este grupo.</p>
                )}
                {group.questions && group.questions.map((q, qIdx) => (
                  <div key={q.id} className="text-sm border-l-2 border-blue-500 pl-3 py-1 space-y-1">
                    <p className="font-semibold text-gray-800">
                      {qIdx + 1}. {q.text}
                      {!q.active && <span className="ml-2 text-xs font-normal text-red-400">(Inactiva)</span>}
                    </p>
                    <p className="text-xs text-gray-400">{q.inputType} {q.required ? "· Requerida" : ""}</p>
                    {q.options.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {q.options.map((o) => (
                          <span key={o.id} className="rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            {o.label} <span className="font-medium text-gray-400">({Number(o.riskFactor) >= 0 ? "+" : ""}{Number(o.riskFactor)})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <Modal title="Nuevo grupo de preguntas" onClose={() => setCreating(false)}><GroupForm onSubmit={handleCreate} onCancel={() => setCreating(false)} /></Modal>}
      {editing  && <Modal title="Editar grupo de preguntas" onClose={() => setEditing(null)}><GroupForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} /></Modal>}
      {deleting && <ConfirmModal message={`¿Eliminar el grupo de preguntas "${deleting.name}"? Se borrarán sus preguntas asociadas.`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={delLoad} />}
    </div>
  );
}

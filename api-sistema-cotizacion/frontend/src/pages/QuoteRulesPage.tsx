import { useState, useCallback, FormEvent } from "react";
import { useFetch } from "../hooks/useFetch";
import { api, type QuoteRule, type QuoteRuleInput } from "../services/api";
import { Spinner, ErrorMessage } from "../components/Feedback";
import { Modal, ConfirmModal } from "../components/Modal";

function RuleForm({
  initial, onSubmit, onCancel,
}: {
  initial?: QuoteRule;
  onSubmit: (d: QuoteRuleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,         setName]         = useState(initial?.name         ?? "");
  const [factor,       setFactor]       = useState(initial?.factor       ?? "1.0000");
  const [fixedCharge,  setFixedCharge]  = useState(initial?.fixedCharge  ?? "0");
  const [currency,     setCurrency]     = useState(initial?.currency     ?? "USD");
  const [motorcycleId, setMotorcycleId] = useState(initial?.motorcycleId ?? "");
  const [description,  setDescription]  = useState(initial?.description  ?? "");
  const [active,       setActive]       = useState(initial?.active       ?? true);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const f = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await onSubmit({
        name, factor: Number(factor), fixedCharge: Number(fixedCharge),
        currency, motorcycleId: motorcycleId || null,
        description: description || undefined, active,
      });
    } catch (err) { setError((err as Error).message); setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre de la regla</label>
        <input className={f} required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Factor (ej: 1.05 = +5%)</label>
          <input className={f} type="number" required step="0.0001" min="0" value={factor} onChange={(e) => setFactor(e.target.value)} />
        </div>
        <div>
          <label className="label">Cargo fijo</label>
          <input className={f} type="number" step="0.01" min="0" value={fixedCharge} onChange={(e) => setFixedCharge(e.target.value)} />
        </div>
        <div>
          <label className="label">Moneda</label>
          <input className={f} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="label">ID de moto (opcional)</label>
          <input className={f} placeholder="uuid — vacío = global" value={motorcycleId} onChange={(e) => setMotorcycleId(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Descripción</label>
        <input className={f} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-blue-600" />
        Activa
      </label>
      {error && <ErrorMessage message={error} />}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear regla"}
        </button>
      </div>
    </form>
  );
}

export default function QuoteRulesPage() {
  const [refresh, setRefresh] = useState(0);
  const bump = useCallback(() => setRefresh((n) => n + 1), []);

  const { data, loading, error } = useFetch(() => api.dealer.quoteRules.list(), [refresh]);

  const [creating, setCreating] = useState(false);
  const [editing,  setEditing]  = useState<QuoteRule | null>(null);
  const [deleting, setDeleting] = useState<QuoteRule | null>(null);
  const [delLoad,  setDelLoad]  = useState(false);
  const [delErr,   setDelErr]   = useState<string | null>(null);

  async function handleCreate(d: QuoteRuleInput) { await api.dealer.quoteRules.create(d); setCreating(false); bump(); }
  async function handleUpdate(d: QuoteRuleInput) { await api.dealer.quoteRules.update(editing!.id, d); setEditing(null); bump(); }
  async function handleDelete() {
    setDelLoad(true); setDelErr(null);
    try { await api.dealer.quoteRules.remove(deleting!.id); setDeleting(null); bump(); }
    catch (e) { setDelErr((e as Error).message); }
    finally { setDelLoad(false); }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reglas de cotización</h1>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Nueva regla
        </button>
      </div>

      {delErr  && <div className="mb-3"><ErrorMessage message={delErr} /></div>}
      {loading && <Spinner />}
      {error   && <ErrorMessage message={error} />}

      {data && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>{["Nombre", "Factor", "Cargo fijo", "Moto", "Estado", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin reglas</td></tr>
              )}
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">×{Number(r.factor).toFixed(4)}</td>
                  <td className="px-4 py-3 text-gray-600">{r.currency} {Number(r.fixedCharge).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.motorcycle ? `${r.motorcycle.brand} ${r.motorcycle.model}` : <span className="italic">Global</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {r.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(r)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => { setDelErr(null); setDeleting(r); }} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <Modal title="Nueva regla" onClose={() => setCreating(false)}><RuleForm onSubmit={handleCreate} onCancel={() => setCreating(false)} /></Modal>}
      {editing  && <Modal title="Editar regla" onClose={() => setEditing(null)}><RuleForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} /></Modal>}
      {deleting && <ConfirmModal message={`¿Eliminar la regla "${deleting.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} loading={delLoad} />}
    </div>
  );
}

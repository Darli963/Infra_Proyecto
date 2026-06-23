import { useState, useCallback } from "react";
import { useFetch } from "../hooks/useFetch";
import { api, type MotorcycleInput } from "../services/api";
import type { Motorcycle } from "../services/types";
import { Spinner, ErrorMessage } from "../components/Feedback";
import { Modal, ConfirmModal } from "../components/Modal";
import { MotorcycleForm } from "../components/MotorcycleForm";

const CATEGORIES = ["", "sport", "touring", "cruiser", "off-road", "scooter"];

export default function DealerMotorcyclesPage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [active,   setActive]   = useState<"" | "true" | "false">("");
  const [page,     setPage]     = useState(1);
  const [refresh,  setRefresh]  = useState(0);

  const [creating,   setCreating]   = useState(false);
  const [editing,    setEditing]    = useState<Motorcycle | null>(null);
  const [deleting,   setDeleting]   = useState<Motorcycle | null>(null);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [actionErr,  setActionErr]  = useState<string | null>(null);

  const bump = useCallback(() => { setRefresh((n) => n + 1); }, []);

  const params = new URLSearchParams();
  if (search)   params.set("search",   search);
  if (category) params.set("category", category);
  if (active)   params.set("active",   active);
  params.set("page", String(page));
  params.set("limit", "10");

  const { data, loading, error } = useFetch(
    () => api.dealer.motorcycles.list(params),
    [search, category, active, page, refresh]
  );

  async function handleCreate(input: MotorcycleInput) {
    await api.dealer.motorcycles.create(input);
    setCreating(false);
    bump();
  }

  async function handleUpdate(input: MotorcycleInput) {
    if (!editing) return;
    await api.dealer.motorcycles.update(editing.id, input);
    setEditing(null);
    bump();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoad(true);
    setActionErr(null);
    try {
      await api.dealer.motorcycles.remove(deleting.id);
      setDeleting(null);
      bump();
    } catch (e) {
      setActionErr((e as Error).message);
    } finally {
      setDeleteLoad(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Motocicletas</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          + Nueva motocicleta
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search" placeholder="Buscar marca o modelo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={active}
          onChange={(e) => { setActive(e.target.value as "" | "true" | "false"); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {actionErr && <div className="mb-3"><ErrorMessage message={actionErr} /></div>}
      {loading   && <Spinner />}
      {error     && <ErrorMessage message={error} />}

      {data && (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  {["Imagen", "Marca / Modelo", "Año", "CC", "Precio", "Categoría", "Estado", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin motocicletas</td></tr>
                )}
                {data.items.map((m) => {
                  const img = m.images.find((i) => i.isPrimary)?.url ?? m.images[0]?.url;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {img
                          ? <img src={img} alt="" className="h-10 w-14 rounded object-cover" />
                          : <div className="h-10 w-14 rounded bg-gray-100" />}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {m.brand} {m.model}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.year}</td>
                      <td className="px-4 py-3 text-gray-500">{m.engineCC}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.currency} {Number(m.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.category}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {m.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(m)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => { setActionErr(null); setDeleting(m); }}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">← Anterior</button>
              <span className="text-sm text-gray-600">Página {data.page} de {data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Siguiente →</button>
            </div>
          )}
        </>
      )}

      {/* Modal crear */}
      {creating && (
        <Modal title="Nueva motocicleta" onClose={() => setCreating(false)}>
          <MotorcycleForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Modal>
      )}

      {/* Modal editar */}
      {editing && (
        <Modal title="Editar motocicleta" onClose={() => setEditing(null)}>
          <MotorcycleForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {/* Modal eliminar */}
      {deleting && (
        <ConfirmModal
          message={`¿Eliminar "${deleting.brand} ${deleting.model}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoad}
        />
      )}
    </div>
  );
}

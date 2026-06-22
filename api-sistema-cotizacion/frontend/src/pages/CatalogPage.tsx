import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { api } from "../services/api";
import { MotorcycleCard } from "../components/MotorcycleCard";
import { Spinner, ErrorMessage } from "../components/Feedback";

const CATEGORIES = ["sport", "touring", "cruiser", "off-road", "scooter"];

export default function CatalogPage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("");
  const [page,     setPage]     = useState(1);

  const params = new URLSearchParams();
  if (search)   params.set("search",   search);
  if (category) params.set("category", category);
  params.set("page", String(page));

  const { data, loading, error } = useFetch(
    () => api.motorcycles.list(params),
    [search, category, page]
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Catálogo de motocicletas</h1>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar marca o modelo..."
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
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading && <Spinner />}
      {error   && <ErrorMessage message={error} />}

      {data && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((m) => <MotorcycleCard key={m.id} moto={m} />)}
          </div>

          {data.items.length === 0 && (
            <p className="py-12 text-center text-gray-500">No se encontraron motocicletas.</p>
          )}

          {/* Paginación */}
          {data.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >← Anterior</button>
              <span className="text-sm text-gray-600">Página {data.page} de {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >Siguiente →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

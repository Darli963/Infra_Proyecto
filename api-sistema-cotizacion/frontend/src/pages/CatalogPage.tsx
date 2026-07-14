import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api } from "../services/api";
import { MotorcycleCard } from "../components/MotorcycleCard";
import { ErrorMessage } from "../components/Feedback";
import { CATEGORIES } from "../components/MotorcycleForm";

const SkeletonCard = () => (
  <div className="animate-pulse flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="h-48 w-full bg-gray-200" />
    <div className="flex flex-1 flex-col p-4 space-y-3">
      <div className="h-3 w-16 bg-gray-200 rounded" />
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="h-6 w-20 bg-gray-200 rounded mt-auto" />
    </div>
  </div>
);

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dealerships, setDealerships] = useState<{ id: string; name: string; slug: string }[]>([]);

  // Parse URL parameters
  const searchParam = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const priceMinParam = searchParams.get("priceMin") ?? "";
  const priceMaxParam = searchParams.get("priceMax") ?? "";
  const dealershipIdParam = searchParams.get("dealershipId") ?? "";
  const sortParam = searchParams.get("sort") ?? "";
  const pageParam = Number(searchParams.get("page") ?? "1");

  // Local inputs with debounce
  const [searchInput, setSearchInput] = useState(searchParam);
  const [priceMinInput, setPriceMinInput] = useState(priceMinParam);
  const [priceMaxInput, setPriceMaxInput] = useState(priceMaxParam);

  // Trigger states
  const [search, setSearch] = useState(searchParam);
  const [priceMin, setPriceMin] = useState(priceMinParam);
  const [priceMax, setPriceMax] = useState(priceMaxParam);

  // Instant trigger states
  const [category, setCategory] = useState(categoryParam);
  const [dealershipId, setDealershipId] = useState(dealershipIdParam);
  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);

  // Fetch dealerships list on mount
  useEffect(() => {
    api.public.dealerships.list().then(setDealerships).catch(console.error);
  }, []);

  // Debounce search and price inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPriceMin(priceMinInput);
      setPriceMax(priceMaxInput);
      setPage(1); // Reset page on text or number input change
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, priceMinInput, priceMaxInput]);

  // Sync state variables back to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (dealershipId) params.set("dealershipId", dealershipId);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    setSearchParams(params);
  }, [search, category, priceMin, priceMax, dealershipId, sort, page, setSearchParams]);

  // Load paginated list of motorcycles
  const fetchParams = new URLSearchParams();
  if (search) fetchParams.set("search", search);
  if (category) fetchParams.set("category", category);
  if (priceMin) fetchParams.set("priceMin", priceMin);
  if (priceMax) fetchParams.set("priceMax", priceMax);
  if (dealershipId) fetchParams.set("dealershipId", dealershipId);
  if (sort) fetchParams.set("sort", sort);
  fetchParams.set("page", String(page));

  const { data, loading, error } = useFetch(
    () => api.public.motorcycles.list(fetchParams),
    [search, category, priceMin, priceMax, dealershipId, sort, page]
  );

  const handleClearFilters = () => {
    setSearchInput("");
    setPriceMinInput("");
    setPriceMaxInput("");
    setSearch("");
    setPriceMin("");
    setPriceMax("");
    setCategory("");
    setDealershipId("");
    setSort("");
    setPage(1);
  };

  const hasActiveFilters = searchInput || category || priceMinInput || priceMaxInput || dealershipId || sort;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de motocicletas</h1>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtros Bar */}
      <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Buscar</label>
          <input
            type="search"
            placeholder="Marca o modelo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Categoría</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Concesionario</label>
          <select
            value={dealershipId}
            onChange={(e) => { setDealershipId(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {dealerships.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Precio Mínimo</label>
          <input
            type="number"
            placeholder="Min..."
            value={priceMinInput}
            onChange={(e) => setPriceMinInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Precio Máximo</label>
          <input
            type="number"
            placeholder="Max..."
            value={priceMaxInput}
            onChange={(e) => setPriceMaxInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Ordenar por</label>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Resultados counter */}
      {data && !loading && (
        <p className="mb-4 text-sm font-medium text-gray-500">
          {data.total} {data.total === 1 ? "motocicleta encontrada" : "motocicletas encontradas"}
        </p>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => <SkeletonCard key={idx} />)}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.items.map((m) => <MotorcycleCard key={m.id} moto={m} />)}
            </div>

            {data.items.length === 0 && (
              <div className="py-16 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No se encontraron motocicletas</h3>
                <p className="mt-1 text-sm text-gray-500">Prueba cambiando tus filtros de búsqueda.</p>
                {hasActiveFilters && (
                  <div className="mt-6">
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      Limpiar todos los filtros
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Paginación */}
            {data.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50 disabled:opacity-40 transition font-medium"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-gray-600 font-medium">Página {data.page} de {data.pages}</span>
                <button
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border px-3 py-1.5 text-sm bg-white hover:bg-gray-50 disabled:opacity-40 transition font-medium"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

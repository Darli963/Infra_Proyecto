import { useState, FormEvent } from "react";
import type { MotorcycleInput } from "../services/api";
import type { Motorcycle } from "../services/types";
import { ErrorMessage } from "./Feedback";

const CATEGORIES = ["sport", "touring", "cruiser", "off-road", "scooter"];
const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const STORAGE_KEY = "mq_auth";

interface ImageRow { url: string; altText: string; isPrimary: boolean; uploading?: boolean }

function toImageRows(moto?: Motorcycle): ImageRow[] {
  if (!moto?.images.length) return [{ url: "", altText: "", isPrimary: true }];
  return moto.images.map((i) => ({ url: i.url, altText: i.altText ?? "", isPrimary: i.isPrimary }));
}

async function uploadToS3(file: File): Promise<string> {
  const token = (() => {
    try { return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as { token?: string }).token ?? ""; }
    catch { return ""; }
  })();

  const form = new FormData();
  form.append("image", file);

  const res = await fetch(`${BASE}/dealer/motorcycles/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message ?? "Error al subir imagen");
  return (json.data as { url: string }).url;
}

export function MotorcycleForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Motorcycle;
  onSubmit: (data: MotorcycleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [brand,       setBrand]       = useState(initial?.brand       ?? "");
  const [model,       setModel]       = useState(initial?.model       ?? "");
  const [year,        setYear]        = useState(initial?.year        ?? new Date().getFullYear());
  const [engineCC,    setEngineCC]    = useState(initial?.engineCC    ?? 125);
  const [price,       setPrice]       = useState(initial?.price       ?? "0");
  const [currency,    setCurrency]    = useState(initial?.currency    ?? "USD");
  const [category,    setCategory]    = useState(initial?.category    ?? "sport");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active,      setActive]      = useState(initial?.active      ?? true);
  const [images,      setImages]      = useState<ImageRow[]>(toImageRows(initial));
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function setImg(idx: number, patch: Partial<ImageRow>) {
    setImages((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function addImg()    { setImages((p) => [...p, { url: "", altText: "", isPrimary: false }]); }
  function removeImg(i: number) { setImages((p) => p.filter((_, j) => j !== i)); }

  async function handleFileChange(idx: number, file: File | undefined) {
    if (!file) return;
    setImg(idx, { uploading: true });
    try {
      const url = await uploadToS3(file);
      setImg(idx, { url, uploading: false });
    } catch (e) {
      setImg(idx, { uploading: false });
      setError((e as Error).message);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (images.some((r) => r.uploading)) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        brand, model, year: Number(year), engineCC: Number(engineCC),
        price: Number(price), currency, category,
        description: description || undefined,
        active,
        images: images.filter((r) => r.url.trim()).map((r, i) => ({
          url: r.url.trim(), altText: r.altText || undefined,
          isPrimary: r.isPrimary, sortOrder: i,
        })),
      });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Marca</label>
          <input className={field} required value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div>
          <label className="label">Modelo</label>
          <input className={field} required value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div>
          <label className="label">Año</label>
          <input className={field} type="number" required min={1900} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Cilindraje (cc)</label>
          <input className={field} type="number" required min={1} value={engineCC} onChange={(e) => setEngineCC(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Precio</label>
          <input className={field} type="number" required min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Moneda</label>
          <input className={field} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-blue-600" />
            Activa
          </label>
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea className={field} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {/* Imágenes — URL manual o subida a S3 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Imágenes</span>
          <button type="button" onClick={addImg} className="text-xs text-blue-600 hover:underline">+ Añadir</button>
        </div>
        <div className="space-y-2">
          {images.map((row, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-2 space-y-1.5">
              <div className="flex gap-2 items-center">
                <input
                  className={`${field} flex-1`} placeholder="URL de imagen..."
                  value={row.url} onChange={(e) => setImg(i, { url: e.target.value })}
                />
                {/* Subida a S3 — solo disponible cuando S3_BUCKET_NAME está configurado */}
                <label className={`shrink-0 cursor-pointer rounded-lg border px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 ${row.uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {row.uploading ? "Subiendo…" : "📁 Subir"}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleFileChange(i, e.target.files?.[0])}
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                  <input type="radio" name="primary" checked={row.isPrimary}
                    onChange={() => setImages((p) => p.map((r, j) => ({ ...r, isPrimary: j === i })))}
                    className="accent-blue-600"
                  />
                  Principal
                </label>
                {images.length > 1 && (
                  <button type="button" onClick={() => removeImg(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                )}
              </div>
              <input
                className={`${field}`} placeholder="Texto alternativo (alt)"
                value={row.altText} onChange={(e) => setImg(i, { altText: e.target.value })}
              />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">Puedes pegar una URL o subir un archivo directamente a S3.</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={loading || images.some((r) => r.uploading)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear motocicleta"}
        </button>
      </div>
    </form>
  );
}

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api } from "../services/api";
import { Spinner, ErrorMessage } from "../components/Feedback";

export default function MotorcycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: moto, loading, error } = useFetch(() => api.motorcycles.get(id!), [id]);
  const [activeImg, setActiveImg] = useState(0);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMessage message={error} />;
  if (!moto)   return null;

  const imgs = moto.images;

  return (
    <div>
      <Link to="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">← Volver al catálogo</Link>

      <div className="mt-2 grid gap-8 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="overflow-hidden rounded-xl bg-gray-100">
            {imgs.length > 0 ? (
              <img
                src={imgs[activeImg]?.url}
                alt={imgs[activeImg]?.altText ?? `${moto.brand} ${moto.model}`}
                className="h-72 w-full object-cover lg:h-96"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-gray-400">Sin imágenes</div>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {imgs.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImg ? "border-blue-500" : "border-transparent"}`}
                >
                  <img src={img.url} alt={img.altText ?? ""} className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="text-sm font-medium uppercase tracking-wide text-gray-400">{moto.brand}</span>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">{moto.model}</h1>
          <p className="mt-1 text-gray-500">{moto.year} · {moto.engineCC} cc · {moto.category}</p>

          {moto.description && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600">{moto.description}</p>
          )}

          <p className="mt-6 text-3xl font-bold text-blue-600">
            {moto.currency} {Number(moto.price).toLocaleString()}
          </p>

          <button
            onClick={() => navigate(`/simulate/${moto.id}`)}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Cotizar esta moto
          </button>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import type { Motorcycle } from "../services/types";
import { CATEGORY_MAP } from "./MotorcycleForm";

function primaryImage(m: Motorcycle) {
  return m.images.find((i) => i.isPrimary)?.url ?? m.images[0]?.url ?? null;
}

export function MotorcycleCard({ moto }: { moto: Motorcycle }) {
  const img = primaryImage(moto);
  return (
    <Link
      to={`/motorcycles/${moto.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-48 w-full bg-gray-100">
        {img ? (
          <img src={img} alt={`${moto.brand} ${moto.model}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 text-blue-400">
            <svg className="h-14 w-14 opacity-75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5.5" cy="17.5" r="2.5" />
              <circle cx="18.5" cy="17.5" r="2.5" />
              <path d="M3 17.5h2.5" />
              <path d="M8 17.5h8" />
              <path d="M12 15h.01" />
              <path d="M19 12h-2.5l-2-4H9.5L7 12.5H3" />
              <path d="M16.5 12 14 6" />
            </svg>
            <span className="mt-1 text-xs font-medium text-blue-500/70">Sin imagen referencial</span>
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {CATEGORY_MAP[moto.category] || moto.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{moto.brand}</p>
        <h3 className="mt-0.5 text-base font-semibold text-gray-900 group-hover:text-blue-600">
          {moto.model} <span className="font-normal text-gray-500">({moto.year})</span>
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span>{moto.engineCC} cc</span>
          {moto.dealership && (
            <>
              <span className="text-gray-300">•</span>
              <span className="font-medium text-blue-600">📍 {moto.dealership.name}</span>
            </>
          )}
        </div>
        <p className="mt-auto pt-3 text-lg font-bold text-blue-600">
          {moto.currency} {Number(moto.price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

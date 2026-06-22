import { Link } from "react-router-dom";
import type { Motorcycle } from "../services/types";

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
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin imagen</div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
          {moto.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{moto.brand}</p>
        <h3 className="mt-0.5 text-base font-semibold text-gray-900 group-hover:text-blue-600">
          {moto.model} <span className="font-normal text-gray-500">({moto.year})</span>
        </h3>
        <p className="mt-1 text-xs text-gray-500">{moto.engineCC} cc</p>
        <p className="mt-auto pt-3 text-lg font-bold text-blue-600">
          {moto.currency} {Number(moto.price).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}

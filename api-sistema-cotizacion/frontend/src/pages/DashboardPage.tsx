import { useAuth } from "../hooks/useAuth";

const STATS = [
  { label: "Motocicletas",  value: "—" },
  { label: "Cotizaciones",  value: "—" },
  { label: "Este mes",      value: "—" },
  { label: "Pendientes",    value: "—" },
];

export default function DashboardPage() {
  const { auth } = useAuth();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">Bienvenido, {auth?.dealership.name}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-400">
        Las siguientes fases agregarán contenido aquí.
      </div>
    </div>
  );
}

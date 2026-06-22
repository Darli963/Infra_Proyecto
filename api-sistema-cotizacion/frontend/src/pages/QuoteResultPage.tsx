import { useLocation, Link } from "react-router-dom";
import type { QuoteResult } from "../services/types";

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${highlight ? "font-bold text-blue-700" : "text-gray-700"}`}>
      <span className="text-sm">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function QuoteResultPage() {
  const { state } = useLocation() as { state: QuoteResult | null };

  if (!state) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">No hay resultado de cotización. <Link to="/" className="text-blue-600 underline">Volver al catálogo</Link></p>
      </div>
    );
  }

  const { breakdown: b, currency, simulationId, expiresAt } = state;
  const fmt = (v: string) => `${currency} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const expDate = new Date(expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">✓</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cotización generada</h1>
            <p className="text-xs text-gray-400">ID: {simulationId}</p>
          </div>
        </div>

        {/* Desglose */}
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
          <Row label="Precio base"    value={fmt(b.basePrice)} />
          {b.ruleName && <Row label={`Regla: ${b.ruleName}`} value={`×${b.ruleFactor} + ${fmt(b.ruleCharge)}`} />}
          <Row label="Factor de riesgo" value={`×${b.riskFactor}`} />
          <Row label="Recargo total"  value={fmt(b.surcharge)} />
          <Row label="PRECIO FINAL"   value={fmt(b.finalPrice)} highlight />
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Esta cotización es válida hasta el <span className="font-medium text-gray-700">{expDate}</span>
        </p>

        <Link
          to="/"
          className="mt-6 block w-full rounded-xl border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
        >
          Cotizar otra motocicleta
        </Link>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import type { QuoteResult } from "../services/types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

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
  const [downloading, setDownloading] = useState(false);
  const [dlError,     setDlError]     = useState<string | null>(null);

  if (!state) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">
          No hay resultado de cotización.{" "}
          <Link to="/catalog" className="text-blue-600 underline">Volver al catálogo</Link>
        </p>
      </div>
    );
  }

  const { breakdown: b, currency, simulationId, expiresAt } = state;
  const fmt = (v: string) =>
    `${currency} ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const expDate = new Date(expiresAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  async function handleDownload() {
    setDownloading(true);
    setDlError(null);
    try {
      const res = await fetch(`${BASE}/public/quote/${simulationId}/pdf`);
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `cotizacion-${simulationId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

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

        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
          <Row label="Precio base"      value={fmt(b.basePrice)} />
          {b.ruleName && <Row label={`Regla: ${b.ruleName}`} value={`×${b.ruleFactor} + ${fmt(b.ruleCharge)}`} />}
          <Row label="Factor de riesgo" value={`×${b.riskFactor}`} />
          <Row label="Recargo total"    value={fmt(b.surcharge)} />
          <Row label="PRECIO FINAL"     value={fmt(b.finalPrice)} highlight />
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Válida hasta el <span className="font-medium text-gray-700">{expDate}</span>
        </p>

        {dlError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{dlError}</p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
          >
            <span>⬇</span>
            {downloading ? "Generando PDF..." : "Descargar PDF"}
          </button>

          <Link
            to="/catalog"
            className="block w-full rounded-xl border border-blue-600 py-2.5 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Cotizar otra motocicleta
          </Link>
        </div>
      </div>
    </div>
  );
}

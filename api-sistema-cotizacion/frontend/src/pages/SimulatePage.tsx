import { useState, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { api } from "../services/api";
import { Spinner, ErrorMessage } from "../components/Feedback";
import type { RiskQuestion } from "../services/types";

type Answers = Record<string, string>; // questionId → optionId or textValue

function QuestionField({ q, value, onChange }: {
  q: RiskQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  if (q.inputType === "SINGLE_CHOICE") {
    return (
      <div className="space-y-2">
        {q.options.map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input
              type="radio"
              name={q.id}
              value={opt.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
              className="accent-blue-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (q.inputType === "BOOLEAN") {
    return (
      <div className="flex gap-4">
        {["true", "false"].map((v) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
            <input type="radio" name={q.id} value={v} checked={value === v} onChange={() => onChange(v)} className="accent-blue-600" />
            <span className="text-sm">{v === "true" ? "Sí" : "No"}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type={q.inputType === "NUMBER" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={q.required}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

export default function SimulatePage() {
  const { id: motorcycleId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: questions, loading, error } = useFetch(() => api.public.riskQuestions.list(), []);
  const { data: moto, loading: loadingMoto, error: errorMoto } = useFetch(() => api.public.motorcycles.get(motorcycleId!), [motorcycleId]);

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!questions) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const responses = questions.map((q) => {
        const val = answers[q.id] ?? "";
        if (q.inputType === "SINGLE_CHOICE" || q.inputType === "MULTIPLE_CHOICE") {
          return { questionId: q.id, optionId: val || undefined };
        }
        return { questionId: q.id, textValue: val || undefined };
      });

      const result = await api.public.quote.simulate({
        motorcycleId: motorcycleId!,
        applicantName: name,
        applicantEmail: email,
        responses,
      });

      navigate("/quote/result", { state: result });
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || loadingMoto) return <Spinner />;
  if (error || errorMoto)   return <ErrorMessage message={error ?? errorMoto ?? ""} />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/motorcycles/${motorcycleId}`} className="mb-4 inline-block text-sm text-blue-600 hover:underline">← Volver al detalle</Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Simulación de cotización</h1>

      {moto && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{moto.brand}</p>
          <h2 className="text-lg font-bold text-gray-900">{moto.model} <span className="font-normal text-gray-500">({moto.year})</span></h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-600">
            <span>Precio base: {moto.currency} {Number(moto.price).toLocaleString()}</span>
            {moto.dealership && (
              <>
                <span className="text-gray-300">•</span>
                <span className="font-semibold text-blue-600">📍 Concesionario: {moto.dealership.name}</span>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del solicitante */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-800">Tus datos</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Cuestionario */}
        {questions && questions.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-800">Cuestionario de riesgo</h2>
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id}>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    {q.text}{q.required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  <QuestionField q={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswer(q.id, v)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {submitError && <ErrorMessage message={submitError} />}

        <button
          type="submit" disabled={submitting}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {submitting ? "Calculando..." : "Ver cotización"}
        </button>
      </form>
    </div>
  );
}

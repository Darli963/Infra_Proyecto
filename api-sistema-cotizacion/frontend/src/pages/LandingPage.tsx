import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🏍️",
    title: "Catálogo completo",
    desc: "Explora motos filtradas por categoría y precio",
  },
  {
    icon: "⚡",
    title: "Cotización instantánea",
    desc: "Motor de cálculo con factores de riesgo personalizados",
  },
  {
    icon: "📄",
    title: "PDF al instante",
    desc: "Descarga tu cotización lista para presentar",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-blue-400">MotoQuote</span>
        <div className="flex gap-4 text-sm font-medium">
          <Link to="/catalog" className="text-gray-300 hover:text-white transition">Catálogo</Link>
          <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-1.5 hover:bg-blue-700 transition">
            Panel
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 max-w-3xl mx-auto">
        <span className="mb-4 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-xs font-medium tracking-widest text-blue-400 uppercase">
          Sistema de cotización
        </span>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Cotiza tu moto ideal
          <span className="block text-blue-400">en minutos</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-xl">
          Explora el catálogo, responde un breve cuestionario y obtén tu cotización personalizada con descarga en PDF.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/catalog"
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold hover:bg-blue-700 transition"
          >
            Ver catálogo
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-gray-600 px-8 py-3 font-semibold text-gray-300 hover:border-gray-400 hover:text-white transition"
          >
            Acceso concesionarias
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center hover:border-blue-600/50 transition"
            >
              <div className="mb-4 text-4xl">{icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl rounded-2xl bg-blue-600 px-8 py-12 text-center">
          <h2 className="text-3xl font-bold">¿Eres una concesionaria?</h2>
          <p className="mt-3 text-blue-100">
            Administra tu catálogo, define reglas de cotización y gestiona tus clientes desde un solo panel.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-blue-700 hover:bg-blue-50 transition"
          >
            Ingresar al panel
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} MotoQuote
      </footer>

    </div>
  );
}

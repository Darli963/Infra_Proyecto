import { Link } from "react-router-dom";

const STATS = [
  { value: "500+", label: "Motos disponibles" },
  { value: "1 000+", label: "Cotizaciones generadas" },
  { value: "98%", label: "Satisfacción" },
];

const FEATURES = [
  {
    icon: "🏍️",
    title: "Catálogo completo",
    desc: "Explora motos filtradas por categoría, marca y precio en segundos.",
  },
  {
    icon: "⚡",
    title: "Cotización instantánea",
    desc: "Motor de cálculo con factores de riesgo personalizados para cada perfil.",
  },
  {
    icon: "📄",
    title: "PDF al instante",
    desc: "Descarga tu cotización lista para presentar con un solo clic.",
  },
];

const bg = {
  background: "linear-gradient(135deg, #000000 0%, #020818 60%, #050d2a 100%)",
};

const gridOverlay = {
  backgroundImage:
    "linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

const gradientText = {
  background: "linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #a855f7 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const glowPrimary = {
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  boxShadow: "0 0 24px rgba(99,102,241,0.5)",
};

const glass = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const ctaGradient = {
  background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)",
  border: "1px solid rgba(99,102,241,0.3)",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={bg}>
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={gridOverlay} />

      {/* Glow blobs */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)" }}
      />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-extrabold tracking-tight" style={gradientText}>
          MotoQuote
        </span>
        <div
          className="absolute left-0 right-0 bottom-0 h-px mx-6"
          style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }}
        />
        <nav className="flex gap-4 text-sm font-medium items-center">
          <Link to="/catalog" className="text-gray-400 hover:text-white transition-colors duration-200">
            Catálogo
          </Link>
          <Link
            to="/login"
            className="rounded-lg px-4 py-1.5 font-semibold transition-all duration-200 hover:scale-105"
            style={glowPrimary}
          >
            Panel
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-32 max-w-4xl mx-auto"
        style={{ animation: "fadeIn 0.8s ease-out" }}
      >
        {/* Animated badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase"
          style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              background: "#818cf8",
              boxShadow: "0 0 6px #818cf8",
              animation: "pulse 1.8s ease-in-out infinite",
            }}
          />
          ✨ Sistema de cotización profesional
        </div>

        <h1 className="text-5xl sm:text-7xl font-black leading-none tracking-tight">
          Cotiza tu moto ideal
          <span className="block mt-2" style={gradientText}>
            en minutos
          </span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          Explora el catálogo, responde un breve cuestionario y obtén tu cotización
          personalizada con descarga en PDF lista para presentar.
        </p>

        <div className="mt-10">
          <Link
            to="/catalog"
            className="rounded-xl px-10 py-4 font-semibold text-base transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={glowPrimary}
          >
            Ver catálogo →
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-10 px-6">
        <div className="mx-auto max-w-3xl grid grid-cols-3">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="text-center relative">
              {/* Vertical separator except on first */}
              {i > 0 && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-px"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.4), transparent)" }}
                />
              )}
              <div className="text-3xl sm:text-5xl font-black tabular-nums" style={gradientText}>
                {value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div
        className="relative z-10 mx-auto max-w-5xl h-px my-8 px-6"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }}
      />

      {/* Features */}
      <section className="relative z-10 py-16 px-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-200 mb-12">
          Todo lo que necesitas
        </h2>
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-8 text-center transition-all duration-300 hover:-translate-y-2 cursor-default group"
              style={{
                ...glass,
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              {/* Gradient border on hover via outline trick */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(168,85,247,0.2))",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  padding: "1px",
                  borderRadius: "inherit",
                }}
              />
              <div className="mb-5 text-5xl">{icon}</div>
              <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <div
          className="mx-auto max-w-2xl rounded-3xl px-10 py-16 text-center relative overflow-hidden"
          style={ctaGradient}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.2) 0%, transparent 70%)" }}
          />
          <div className="relative z-10">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              ¿Eres una concesionaria?
            </h2>
            <p className="mt-5 text-indigo-200 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Administra tu catálogo, define reglas de cotización y gestiona
              clientes desde un solo panel intuitivo.
            </p>
            <Link
              to="/login"
              className="mt-10 inline-block rounded-xl px-10 py-4 font-bold text-sm transition-all duration-200 hover:scale-105 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #38bdf8, #818cf8)",
                boxShadow: "0 0 30px rgba(129,140,248,0.4)",
                color: "#000",
              }}
            >
              Ingresar al panel →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-lg font-extrabold tracking-tight" style={gradientText}>
            MotoQuote
          </span>
          <nav className="flex gap-6 text-sm text-gray-500">
            <Link to="/catalog" className="hover:text-gray-300 transition-colors duration-200">Catálogo</Link>
            <Link to="/login" className="hover:text-gray-300 transition-colors duration-200">Panel</Link>
          </nav>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} MotoQuote. Todos los derechos reservados.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

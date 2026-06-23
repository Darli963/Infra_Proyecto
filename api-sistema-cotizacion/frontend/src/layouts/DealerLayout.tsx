import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard",      label: "Dashboard",          icon: "▦" },
  { to: "/motorcycles",    label: "Motocicletas",        icon: "◈" },
  { to: "/quote-rules",    label: "Reglas de cotización",icon: "%" },
  { to: "/risk-questions", label: "Preguntas de riesgo", icon: "?" },
];

export default function DealerLayout() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col bg-gray-900 text-gray-300">
        <div className="px-5 py-4 text-lg font-bold text-white">MotoQuote</div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              <span>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-700 px-4 py-3">
          <p className="truncate text-xs text-gray-400">{auth?.dealership.name}</p>
          <button
            onClick={handleLogout}
            className="mt-1 text-xs text-gray-400 hover:text-white transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="text-sm font-medium text-gray-700">{auth?.dealership.email}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

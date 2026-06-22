import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import PublicLayout         from "./layouts/PublicLayout";
import DealerLayout         from "./layouts/DealerLayout";
import ProtectedRoute       from "./routes/ProtectedRoute";
import CatalogPage          from "./pages/CatalogPage";
import MotorcycleDetailPage from "./pages/MotorcycleDetailPage";
import SimulatePage         from "./pages/SimulatePage";
import QuoteResultPage      from "./pages/QuoteResultPage";
import LoginPage            from "./pages/LoginPage";
import DashboardPage        from "./pages/DashboardPage";
import DealerMotorcyclesPage from "./pages/DealerMotorcyclesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route element={<PublicLayout />}>
          <Route index                  element={<CatalogPage />} />
          <Route path="motorcycles/:id" element={<MotorcycleDetailPage />} />
          <Route path="simulate/:id"    element={<SimulatePage />} />
          <Route path="quote/result"    element={<QuoteResultPage />} />
        </Route>

        {/* Auth */}
        <Route path="login" element={<LoginPage />} />

        {/* Privado */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DealerLayout />}>
            <Route path="dashboard"   element={<DashboardPage />} />
            <Route path="motorcycles" element={<DealerMotorcyclesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import PublicLayout          from "./layouts/PublicLayout";
import CatalogPage           from "./pages/CatalogPage";
import MotorcycleDetailPage  from "./pages/MotorcycleDetailPage";
import SimulatePage          from "./pages/SimulatePage";
import QuoteResultPage       from "./pages/QuoteResultPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index                     element={<CatalogPage />} />
          <Route path="motorcycles/:id"    element={<MotorcycleDetailPage />} />
          <Route path="simulate/:id"       element={<SimulatePage />} />
          <Route path="quote/result"       element={<QuoteResultPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

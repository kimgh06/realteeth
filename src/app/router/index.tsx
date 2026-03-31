import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { DetailPage } from "@/pages/detail";
import { FavoritesPage } from "@/pages/favorites";
import { Layout } from "@/shared/ui/Layout";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/detail" element={<DetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Route>
    </Routes>
  );
}

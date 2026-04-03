import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { DetailPage } from "@/pages/detail";
import { FavoritesPage } from "@/pages/favorites";
import { Layout } from "@/shared/ui/Layout";

const ConstellationPage = lazy(
  () => import("@/pages/constellation/ui/ConstellationPage").then((m) => ({ default: m.ConstellationPage }))
);

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/constellation"
        element={
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-[#0d1b2a] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              </div>
            }
          >
            <ConstellationPage />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/detail" element={<DetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

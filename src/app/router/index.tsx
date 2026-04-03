import { Component, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { DetailPage } from "@/pages/detail";
import { FavoritesPage } from "@/pages/favorites";
import { Layout } from "@/shared/ui/Layout";
import { ConstellationPage } from "@/pages/constellation";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 bg-[#0d1b2a] flex flex-col items-center justify-center px-8 text-center">
          <p className="text-lg font-semibold text-white mb-2">오류 발생</p>
          <p className="text-sm text-white/50 mb-4">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-xl bg-sky-500 px-6 py-2 text-white"
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/constellation"
        element={
          <ErrorBoundary>
            <ConstellationPage />
          </ErrorBoundary>
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

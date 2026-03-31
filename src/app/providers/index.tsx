import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { ToastProvider } from "./ToastProvider";
import { SidebarProvider } from "./SidebarProvider";
import { SelectedLocationProvider } from "./SelectedLocationProvider";
import { FavoritesProvider } from "@/features/manage-favorites/model/useFavorites";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <SidebarProvider>
            <SelectedLocationProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </SelectedLocationProvider>
          </SidebarProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { Providers } from "./providers";
import { AppRouter } from "./router";
import { OfflineBanner } from "@/shared/ui/OfflineBanner";

export function App() {
  return (
    <Providers>
      <OfflineBanner />
      <AppRouter />
    </Providers>
  );
}

import { Outlet } from "react-router-dom";
import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";
import { useSidebar } from "@/shared/lib/useSidebar";
import { useEdgeSwipe } from "@/shared/lib/useEdgeSwipe";

export function Layout() {
  const { open } = useSidebar();
  useEdgeSwipe(open);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <Outlet />
    </div>
  );
}

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { queryClientInstance } from "@/lib/query-client";
import PageNotFound from "@/lib/PageNotFound";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import Portfolio from "@/pages/Portfolio";
import CategoryDetail from "@/pages/CategoryDetail";
import Artista from "@/pages/Artista";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import AdminRoute from "@/components/admin/AdminRoute";
import AdminLayout from "@/components/admin/AdminLayout";

const PROTECTED_MEDIA_SELECTOR = "img,[data-protected-image='true']";

function MediaProtection() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      return undefined;
    }

    const shouldBlockAction = (target) => {
      if (!(target instanceof Element)) return false;
      if (target.closest("[data-allow-download='true']")) return false;
      return Boolean(target.closest(PROTECTED_MEDIA_SELECTOR));
    };

    const onContextMenu = (event) => {
      if (shouldBlockAction(event.target)) {
        event.preventDefault();
      }
    };

    const onDragStart = (event) => {
      if (shouldBlockAction(event.target)) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event) => {
      const hasModifier = event.ctrlKey || event.metaKey;
      if (!hasModifier) return;

      const key = String(event.key || "").toLowerCase();
      if (key === "s" || key === "p") {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <MediaProtection />
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/categoria/:id" element={<CategoryDetail />} />
            <Route path="/artista" element={<Artista />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <Admin />
                </AdminLayout>
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

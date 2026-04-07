import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
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

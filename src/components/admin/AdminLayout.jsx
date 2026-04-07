import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { localClient } from "@/api/localClient";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localClient.auth.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-semibold">
              Painel Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-white/30 text-white/70 hover:border-gold hover:text-gold transition-colors"
            >
              Sair
            </button>
            <Link
              to="/"
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-white/30 text-white/70 hover:border-gold hover:text-gold transition-colors"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

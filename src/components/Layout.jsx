import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Instagram, Mail, Phone, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppButton from "@/components/WhatsAppButton";
import SearchOverlay from "@/components/SearchOverlay";
import { localClient } from "@/api/localClient";

const LOGO_URL = `${import.meta.env.BASE_URL}logo-if-branca.png`;
const ADMIN_BASE_PATH = "/admingustavoif";
const DEFAULT_SITE_STATE = {
  paused: false,
  headline: "Catalogo em curadoria",
  message: "Estamos preparando uma selecao especial de quadros. Volte em instantes.",
  cta_label: "Falar no WhatsApp",
  cta_url: "https://wa.me/5547999273809"
};

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStateLoading, setAdminStateLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [siteState, setSiteState] = useState(DEFAULT_SITE_STATE);
  const [siteStateLoading, setSiteStateLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const refreshAdminState = () => {
      setAdminStateLoading(true);
      localClient.auth
        .me()
        .then((user) => {
          if (!mounted) return;
          setIsAdmin(user?.role === "admin");
          setAdminStateLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setIsAdmin(false);
          setAdminStateLoading(false);
        });
    };

    const onStorage = (event) => {
      if (event.key === "ifq_admin_session") {
        refreshAdminState();
      }
    };

    refreshAdminState();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refreshAdminState);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refreshAdminState);
    };
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;

    const refreshSiteState = () => {
      localClient.siteState
        .get()
        .then((state) => {
          if (!mounted) return;
          setSiteState({ ...DEFAULT_SITE_STATE, ...state });
          setSiteStateLoading(false);
        })
        .catch(() => {
          if (!mounted) return;
          setSiteState(DEFAULT_SITE_STATE);
          setSiteStateLoading(false);
        });
    };

    refreshSiteState();
    window.addEventListener("focus", refreshSiteState);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refreshSiteState);
    };
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/artista", label: "Artista" },
    { to: "/contato", label: "Contato" }
  ];

  const isAdminRoute = location.pathname.startsWith(ADMIN_BASE_PATH);
  const canBypassPausedView = isAdminRoute || isAdmin;
  const showPausedView = !siteStateLoading && !adminStateLoading && siteState.paused && !canBypassPausedView;
  const holdWhileLoading = !canBypassPausedView && (siteStateLoading || (!siteStateLoading && siteState.paused && adminStateLoading));

  return (
    <div className="min-h-screen bg-background font-body">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#111]/97 backdrop-blur-md border-b border-gold/20" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Imagem Fit Quadros" className="h-10 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-xs font-medium tracking-[0.25em] uppercase transition-colors duration-300 ${
                  location.pathname === l.to ? "text-gold" : "text-white/70 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={`w-9 h-9 border transition-colors flex items-center justify-center ${
                searchOpen ? "border-gold text-gold" : "border-white/25 text-white/60 hover:border-gold hover:text-gold"
              }`}
              aria-label="Pesquisar"
              title="Pesquisar"
            >
              <Search size={15} />
            </button>
            {isAdmin && (
              <Link
                to={ADMIN_BASE_PATH}
                className={`text-xs font-medium tracking-[0.25em] uppercase px-4 py-1.5 border transition-colors ${
                  location.pathname === ADMIN_BASE_PATH ? "border-gold text-gold" : "border-white/30 text-white/50 hover:border-gold hover:text-gold"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/98 border-b border-gold/20"
            >
              <div className="px-6 py-6 flex flex-col gap-5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center gap-3 text-xs tracking-[0.25em] uppercase font-medium text-white/70"
                >
                  <Search size={15} className="text-gold" /> Pesquisar
                </button>
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`text-xs tracking-[0.25em] uppercase font-medium ${location.pathname === l.to ? "text-gold" : "text-white/70"}`}
                  >
                    {l.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to={ADMIN_BASE_PATH} className="text-xs tracking-[0.25em] uppercase text-gold/60">
                    Admin
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {holdWhileLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : showPausedView ? (
          <section className="min-h-screen pt-32 pb-16 px-6 flex items-center justify-center">
            <div className="max-w-2xl w-full border border-gold/30 bg-black/60 backdrop-blur-sm p-8 md:p-12 text-center">
              <span className="text-gold text-xs tracking-[0.32em] uppercase">Atualizacao de vitrine</span>
              <h1 className="font-heading text-4xl md:text-5xl text-white mt-4">{siteState.headline}</h1>
              <p className="text-white/70 text-base leading-relaxed mt-4">{siteState.message}</p>
              <a
                href={siteState.cta_url || "https://wa.me/5547999273809"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-8 px-7 py-3 border border-gold text-gold text-xs tracking-[0.24em] uppercase hover:bg-gold hover:text-black transition-colors"
              >
                {siteState.cta_label || "Falar no WhatsApp"}
              </a>
            </div>
          </section>
        ) : (
          <Outlet />
        )}
      </main>

      {!showPausedView && <WhatsAppButton />}

      {!showPausedView && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}

      {!showPausedView && (
        <footer className="bg-black border-t border-gold/20 pt-16 pb-8 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-1">
                <img src={LOGO_URL} alt="Imagem Fit Quadros" className="h-14 w-auto object-contain mb-4" />
                <p className="text-white/50 text-xs leading-relaxed">Arte que transforma ambientes. Quadros exclusivos para sua casa e empresa.</p>
              </div>

              <div>
                <h4 className="text-gold text-xs tracking-[0.3em] uppercase font-semibold mb-5">Sobre Nos</h4>
                <div className="space-y-2">
                  {navLinks.map((l) => (
                    <Link key={l.to} to={l.to} className="block text-white/50 hover:text-gold text-xs tracking-wide transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-gold text-xs tracking-[0.3em] uppercase font-semibold mb-5">Contato</h4>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/5547999273809"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-gold text-xs transition-colors"
                  >
                    <Phone size={13} /> (47) 99927-3809
                  </a>
                  <a
                    href="https://instagram.com/imagemfit.quadros"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/50 hover:text-gold text-xs transition-colors"
                  >
                    <Instagram size={13} /> @imagemfit.quadros
                  </a>
                  <a href="mailto:atendimento.imagemfit@gmail.com" className="flex items-center gap-2 text-white/50 hover:text-gold text-xs transition-colors">
                    <Mail size={13} /> atendimento.imagemfit@gmail.com
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-gold text-xs tracking-[0.3em] uppercase font-semibold mb-5">Informacoes</h4>
                <div className="space-y-2 text-white/50 text-xs">
                  <p>CNPJ: 12.780.327/0001-02</p>
                  <p className="leading-relaxed">
                    Rua Sao Paulo, 649
                    <br />
                    Timbo - SC
                    <br />
                    CEP 89095-220
                  </p>
                </div>
              </div>
            </div>
            <div className="gold-line mb-6" />
            <p className="text-center text-white/30 text-xs tracking-widest">© {new Date().getFullYear()} Imagem Fit Quadros. Todos os direitos reservados.</p>
          </div>
        </footer>
      )}
    </div>
  );
}

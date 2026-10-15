import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Instagram, Mail, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppButton from "@/components/WhatsAppButton";
import SearchOverlay from "@/components/SearchOverlay";
import { localClient } from "@/api/localClient";

const LOGO_URL = `${import.meta.env.BASE_URL}logo-imagem-fit-quadros-escura.png`;
const FOOTER_LOGO_URL = `${import.meta.env.BASE_URL}logo-if-branca.png`;
const ADMIN_BASE_PATH = "/admingustavoif";
const DEFAULT_SITE_STATE = {
  paused: false,
  headline: "Portfólio em atualização",
  message: "Estamos atualizando algumas categorias do portfólio. Volte em instantes ou entre em contato por e-mail.",
  cta_label: "Enviar e-mail",
  cta_url: "mailto:atendimento.imagemfit@gmail.com"
};

const isWhatsAppUrl = (value) => /(?:wa\.me|whatsapp\.com)/i.test(String(value || ""));

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
    { to: "/", label: "Início" },
    { to: "/portfolio", label: "Portfólio" },
    { to: "/parceiros", label: "Para lojistas" },
    { to: "/artista", label: "Artista" },
    { to: "/contato", label: "Contato" }
  ];

  const isAdminRoute = location.pathname.startsWith(ADMIN_BASE_PATH);
  const canBypassPausedView = isAdminRoute || isAdmin;
  const showPausedView = !siteStateLoading && !adminStateLoading && siteState.paused && !canBypassPausedView;
  const holdWhileLoading = !canBypassPausedView && (siteStateLoading || (!siteStateLoading && siteState.paused && adminStateLoading));
  const pausedCtaUsesWhatsApp = isWhatsAppUrl(siteState.cta_url);
  const pausedCtaUrl = pausedCtaUsesWhatsApp ? DEFAULT_SITE_STATE.cta_url : siteState.cta_url || DEFAULT_SITE_STATE.cta_url;
  const pausedCtaLabel = pausedCtaUsesWhatsApp ? DEFAULT_SITE_STATE.cta_label : siteState.cta_label || DEFAULT_SITE_STATE.cta_label;

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b font-sans text-ink transition-colors duration-300 ${
          scrolled || mobileOpen ? "border-line bg-paper/95 backdrop-blur-md" : "border-transparent bg-paper"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center" aria-label="Imagem Fit Quadros - início">
            <img src={LOGO_URL} alt="Imagem Fit Quadros" className="h-9 w-auto object-contain sm:h-10" />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                aria-current={location.pathname === l.to ? "page" : undefined}
                className={`text-[0.95rem] transition-colors ${
                  location.pathname === l.to ? "font-semibold text-ink" : "text-stone hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-stone transition-colors hover:text-ink"
              aria-label="Pesquisar"
              title="Pesquisar"
            >
              <Search size={19} />
            </button>
            {isAdmin && (
              <Link to={ADMIN_BASE_PATH} className="border border-ink px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper">
                Admin
              </Link>
            )}
          </nav>

          <button className="md:hidden text-ink" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-line bg-paper md:hidden"
            >
              <div className="flex flex-col px-5 py-3">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`border-b border-line py-4 text-lg ${location.pathname === l.to ? "font-semibold text-ink" : "text-stone"}`}
                  >
                    {l.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center gap-3 py-4 text-lg text-stone"
                >
                  <Search size={18} /> Pesquisar
                </button>
                {isAdmin && (
                  <Link to={ADMIN_BASE_PATH} className="py-3 text-sm font-semibold text-ink">
                    Admin
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pb-16 sm:pb-0">
        {holdWhileLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brass" />
          </div>
        ) : showPausedView ? (
          <section className="flex min-h-screen items-center px-5 pb-16 pt-32 sm:px-8">
            <div className="mx-auto w-full max-w-2xl">
              <p className="text-sm text-stone">Atualização do catálogo</p>
              <h1 className="font-display mt-3 text-5xl font-semibold leading-none">{siteState.headline}</h1>
              <p className="mt-5 text-lg leading-relaxed text-stone">{siteState.message}</p>
              <a
                href={pausedCtaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass"
              >
                {pausedCtaLabel}
              </a>
            </div>
          </section>
        ) : (
          <Outlet />
        )}
      </main>

      {!showPausedView && <WhatsAppButton onSearch={() => setSearchOpen(true)} />}

      {!showPausedView && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}

      {!showPausedView && (
        <footer className="bg-ink pb-24 pt-16 font-sans text-paper sm:pb-10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div className="col-span-2 md:col-span-1">
                <img src={FOOTER_LOGO_URL} alt="Imagem Fit Quadros" className="mb-5 h-12 w-auto object-contain" />
                <p className="max-w-xs text-sm leading-relaxed text-paper/60">Quadros, espelhos e obras autorais para lojistas. Humaniza, personaliza, decora.</p>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold">Site</h4>
                <div className="space-y-2.5">
                  {navLinks.map((l) => (
                    <Link key={l.to} to={l.to} className="block text-sm text-paper/60 transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-sm font-semibold">Contato</h4>
                <div className="space-y-2.5 text-sm">
                  <a href="https://instagram.com/imagemfit.quadros" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-paper/60 transition-colors hover:text-paper">
                    <Instagram size={15} /> @imagemfit.quadros
                  </a>
                  <a href="mailto:atendimento.imagemfit@gmail.com" className="flex items-center gap-2 break-all text-paper/60 transition-colors hover:text-paper">
                    <Mail size={15} className="shrink-0" /> atendimento.imagemfit@gmail.com
                  </a>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="mb-4 text-sm font-semibold">Endereço</h4>
                <p className="text-sm leading-relaxed text-paper/60">
                  Rua São Paulo, 649
                  <br />
                  Timbó, SC · 89095-220
                  <br />
                  CNPJ 12.780.327/0001-02
                </p>
              </div>
            </div>
            <p className="mt-14 border-t border-paper/15 pt-6 text-xs text-paper/45">© {new Date().getFullYear()} Imagem Fit Quadros</p>
          </div>
        </footer>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { localClient } from "@/api/localClient";

const ADMIN_BASE_PATH = "/admingustavoif";

const getErrorMessage = (error) => {
  if (error?.message === "ADMIN_DISABLED_PUBLIC") {
    return "Painel admin desativado no site público por segurança.";
  }
  if (error?.message === "ADMIN_CREDENTIALS_NOT_CONFIGURED") {
    return "Credenciais de admin não configuradas.";
  }
  if (error?.message === "INVALID_ADMIN_CREDENTIALS") {
    return "Email ou senha inválidos.";
  }
  return "Não foi possível entrar agora. Tente novamente.";
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const adminEnabled = localClient.auth.isAdminEnabled();

  const finishLogin = useCallback(() => {
    const target = location.state?.from?.pathname || ADMIN_BASE_PATH;
    navigate(target, { replace: true });
  }, [location.state, navigate]);

  useEffect(() => {
    localClient.auth
      .me()
      .then((user) => {
        if (user?.role === "admin") {
          finishLogin();
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        setCheckingSession(false);
      });
  }, [finishLogin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!adminEnabled || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      await localClient.auth.login({ email: form.email, password: form.password });
      finishLogin();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-gold/20 bg-black/50 p-8">
        <div className="text-center mb-8">
          <Lock className="w-6 h-6 text-gold mx-auto mb-3" />
          <h1 className="font-heading text-3xl text-white mb-2">Acesso Admin</h1>
          <p className="text-white/60 text-sm">{adminEnabled ? "Entre com email e senha para acessar o painel." : "O acesso admin está desativado neste ambiente público."}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs tracking-[0.2em] uppercase">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              autoComplete="username"
              className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3.5 text-sm outline-none focus:border-gold transition-colors"
              placeholder="seu@email.com"
              disabled={!adminEnabled || submitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-white/50 text-xs tracking-[0.2em] uppercase">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              autoComplete="current-password"
              className="w-full bg-card border border-border text-white placeholder-white/30 px-4 py-3.5 text-sm outline-none focus:border-gold transition-colors"
              placeholder="Sua senha"
              disabled={!adminEnabled || submitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!adminEnabled || submitting}
            className="w-full bg-gold text-black py-4 text-xs tracking-[0.3em] uppercase font-semibold hover:bg-gold/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {error ? (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 p-3 mb-6">
            <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive/90">{error}</p>
          </div>
        ) : null}

        <div className="text-center">
          <Link to="/" className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-gold transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

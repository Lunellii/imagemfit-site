import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { localClient } from "@/api/localClient";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const getErrorMessage = (error) => {
  if (error?.message === "ADMIN_DISABLED_PUBLIC") {
    return "Painel admin desativado no site público por segurança.";
  }
  if (error?.message === "LOCAL_PASSWORD_DISABLED") {
    return "Login por senha foi desativado por segurança. Use login Google.";
  }
  if (error?.message === "LOGIN_RATE_LIMITED") {
    const retrySeconds = Math.max(1, Number(error?.retry_after_seconds || 0));
    const retryMinutes = Math.ceil(retrySeconds / 60);
    return `Muitas tentativas de login. Tente novamente em ${retryMinutes} minuto(s).`;
  }
  if (error?.message === "GOOGLE_NOT_CONFIGURED") {
    return "Login Google não configurado. Defina VITE_GOOGLE_CLIENT_ID no arquivo .env.";
  }
  if (error?.message === "INVALID_GOOGLE_CREDENTIAL") {
    return "Não foi possível validar sua conta Google.";
  }
  if (error?.message === "GOOGLE_CLIENT_ID_MISMATCH") {
    return "Configuração do Google inválida para este site.";
  }
  return "Não foi possível entrar agora. Tente novamente.";
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState(Boolean(GOOGLE_CLIENT_ID) && localClient.auth.isAdminEnabled());
  const adminEnabled = localClient.auth.isAdminEnabled();

  const finishLogin = useCallback(() => {
    const target = location.state?.from?.pathname || "/admin";
    navigate(target, { replace: true });
  }, [location.state, navigate]);

  const handleGoogleCredential = useCallback(
    async (credential) => {
      if (!credential) {
        setError("Não foi possível validar sua conta Google.");
        return;
      }

      setGoogleLoading(true);
      setError("");
      try {
        await localClient.auth.loginWithGoogleCredential({ credential });
        finishLogin();
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setGoogleLoading(false);
      }
    },
    [finishLogin]
  );

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

  useEffect(() => {
    if (!adminEnabled || !GOOGLE_CLIENT_ID || checkingSession) return;

    let disposed = false;

    const setupGoogle = () => {
      if (disposed) return;
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        setGoogleAvailable(false);
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleGoogleCredential(response?.credential)
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 320,
          logo_alignment: "left"
        });

        setGoogleAvailable(true);
      } catch (_err) {
        setGoogleAvailable(false);
      }
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
      return () => {
        disposed = true;
      };
    }

    let script = document.querySelector('script[data-google-gsi="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = "true";
      document.head.appendChild(script);
    }

    const onLoad = () => setupGoogle();
    const onError = () => setGoogleAvailable(false);

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    return () => {
      disposed = true;
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [adminEnabled, checkingSession, handleGoogleCredential]);

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
          <p className="text-white/60 text-sm">
            {adminEnabled ? "Entre com Google para acessar o painel." : "O acesso admin está desativado neste ambiente público."}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {googleAvailable && adminEnabled ? (
            <>
              <div className="min-h-[44px] flex items-center justify-center" ref={googleButtonRef} />
              {googleLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Validando conta Google...
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-white/50 text-center">
              {adminEnabled ? "Configure `VITE_GOOGLE_CLIENT_ID` para ativar o login com Google." : "Admin desativado no site público."}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 p-3">
              <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive/90">{error}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs tracking-[0.2em] uppercase text-white/50 hover:text-gold transition-colors">
            Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}

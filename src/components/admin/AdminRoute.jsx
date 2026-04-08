import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { localClient } from "@/api/localClient";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!localClient.auth.isAdminEnabled()) {
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }

    let mounted = true;

    localClient.auth
      .me()
      .then((user) => {
        if (!mounted) return;
        setIsAdmin(user?.role === "admin");
        setCheckingAuth(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsAdmin(false);
        setCheckingAuth(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    if (!localClient.auth.isAdminEnabled()) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}

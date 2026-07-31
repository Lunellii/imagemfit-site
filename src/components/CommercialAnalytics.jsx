import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { commercialClient } from "@/api/commercialClient";

const pageMeta = (pathname) => {
  if (pathname.startsWith("/portfolio/categoria/")) return { title: "Categoria de quadros | Imagem Fit", description: "Escolha quadros por categoria, monte sua seleção e compartilhe com sua loja." };
  if (pathname === "/portfolio") return { title: "Catálogo de quadros | Imagem Fit", description: "Explore quadros, espelhos e obras autorais, escolha tamanhos e monte sua seleção." };
  if (pathname === "/parceiros") return { title: "Para lojistas | Imagem Fit", description: "Conheça o catálogo e o atendimento comercial da Imagem Fit para lojistas e parceiros." };
  if (pathname === "/artista") return { title: "Almir Gonçalves | Imagem Fit", description: "Pinturas manuais e obras tridimensionais assinadas por Almir Gonçalves." };
  if (pathname === "/contato") return { title: "Atendimento comercial | Imagem Fit", description: "Atendimento exclusivo para lojistas e parceiros da Imagem Fit." };
  return { title: "Imagem Fit Quadros | Catálogo para lojistas", description: "Catálogo de quadros para lojistas e seus clientes montarem e compartilharem uma seleção." };
};

export default function CommercialAnalytics() {
  const location = useLocation();

  useEffect(() => {
    commercialClient.analytics.track("page_view", { path: location.pathname });
    const meta = pageMeta(location.pathname);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://imagemfitquadros.com.br${location.pathname}`);
  }, [location.pathname]);

  return null;
}

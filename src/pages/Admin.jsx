import { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { Loader2, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUploader from "@/components/admin/ImageUploader";
import ImageManager from "@/components/admin/ImageManager";
import CategoryManager from "@/components/admin/CategoryManager";
import SiteModeManager from "@/components/admin/SiteModeManager";

async function loadAllPortfolioImages() {
  const pageSize = 200;
  const allImages = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (allImages.length < total) {
    const pageData = await localClient.entities.PortfolioImage.filterPage({}, "-created_date", page, pageSize);
    const items = Array.isArray(pageData?.items) ? pageData.items : [];
    total = Number(pageData?.total || items.length || allImages.length);
    allImages.push(...items);
    if (!items.length || allImages.length >= total) break;
    page += 1;
  }

  return allImages;
}

export default function Admin() {
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteState, setSiteState] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    localClient.auth
      .me()
      .then((user) => {
        const admin = user?.role === "admin";
        setIsAdmin(admin);
        setCheckingAuth(false);
        if (admin) loadData();
      })
      .catch(() => {
        setIsAdmin(false);
        setCheckingAuth(false);
      });
  }, []);

  const loadData = async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLoading(true);
    const [cats, imgs, state] = await Promise.all([
      localClient.entities.Category.list("order", 100),
      loadAllPortfolioImages(),
      localClient.siteState.get()
    ]);
    setCategories([...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    setImages(imgs);
    setSiteState(state);
    if (showSpinner) setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-14 h-14 text-destructive" />
        <h2 className="font-heading text-2xl font-bold text-white">Acesso restrito</h2>
        <p className="text-white/50 text-sm">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="py-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Área restrita</span>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">Painel administrativo</h1>
          <div className="gold-line w-20 mb-4" />
          <p className="text-white/50 text-sm">Gerencie categorias, adicione e remova imagens do catálogo.</p>
        </div>

        <Tabs defaultValue="upload">
          <TabsList className="bg-card border border-border rounded-none mb-8 h-auto p-1 gap-1 flex flex-wrap justify-start">
            {[
              { value: "upload", label: "Adicionar imagens" },
              { value: "manage", label: `Imagens (${images.length})` },
              { value: "categories", label: `Categorias (${categories.length})` },
              { value: "site", label: "Operação do site" }
            ].map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-none text-xs tracking-widest uppercase px-5 py-3 data-[state=active]:bg-gold data-[state=active]:text-black">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="upload">
            <ImageUploader categories={categories} onUploaded={() => loadData({ showSpinner: false })} />
          </TabsContent>
          <TabsContent value="manage">
            <ImageManager images={images} categories={categories} onDeleted={() => loadData({ showSpinner: false })} />
          </TabsContent>
          <TabsContent value="categories">
            <CategoryManager categories={categories} images={images} onChanged={() => loadData({ showSpinner: false })} />
          </TabsContent>
          <TabsContent value="site">
            <SiteModeManager initialState={siteState} onChanged={() => loadData({ showSpinner: false })} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

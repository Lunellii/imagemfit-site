import { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryGrid, { getCategoryLink } from "@/components/portfolio/CategoryGrid";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";
import { toast } from "@/components/ui/use-toast";

const NEW_ARRIVALS_COUNT = 32;

export default function Portfolio() {
  const [categories, setCategories] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [cats, arrivals] = await Promise.all([
          localClient.entities.Category.list("order", 100),
          localClient.entities.PortfolioImage.list("-created_date", NEW_ARRIVALS_COUNT)
        ]);

        if (!mounted) return;

        const sortedCategories = [...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const categoryNameById = Object.fromEntries(sortedCategories.map((category) => [category.id, category.name]));
        const arrivalsWithCategory = arrivals.map((image) => ({
          ...image,
          category_name: image.category_name || image.category || categoryNameById[image.category_id] || ""
        }));

        setCategories(sortedCategories);
        setNewImages(arrivalsWithCategory);
        setLoading(false);

        localClient.entities.PortfolioImage
          .groupedByCategory(
            "-created_date",
            8,
            sortedCategories.map((category) => category.id)
          )
          .then((grouped) => {
            if (!mounted) return;
            setImagesByCategory(grouped || {});
          })
          .catch(() => {
            if (!mounted) return;
            setImagesByCategory({});
          });
      } catch {
        if (!mounted) return;
        setCategories([]);
        setNewImages([]);
        setImagesByCategory({});
        toast({
          variant: "destructive",
          title: "Falha ao carregar o portfólio",
          description: "Atualize a página e tente novamente."
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
      </div>
    );
  }

  const quickLinks = categories.filter((category) => (imagesByCategory[category.id] || []).length || !Object.keys(imagesByCategory).length);

  return (
    <div className="min-h-screen bg-paper pb-24 pt-28 font-sans text-ink md:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="grid gap-6 border-b border-line pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-none md:text-6xl">Catálogo</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone">
              Abra uma peça, escolha a medida se quiser e adicione à sua seleção. Depois é só compartilhar os códigos com quem preferir.
            </p>
          </div>
          <Link to="/parceiros" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brass">
            Como comprar <ArrowRight size={15} />
          </Link>
        </header>

        <nav className="-mx-5 mb-12 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Ir para categoria">
          {quickLinks.map((category) => (
            <Link key={category.id} to={getCategoryLink(category)} className="shrink-0 border border-line bg-white px-4 py-2 text-sm transition-colors hover:border-ink">
              {category.name}
            </Link>
          ))}
        </nav>

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <div className="mb-8 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Categorias</h2>
          <p className="text-sm text-stone">{categories.length} categorias</p>
        </div>

        <CategoryGrid categories={categories} imagesByCategory={imagesByCategory} />
      </div>
    </div>
  );
}

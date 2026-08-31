import { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, LayoutGrid, Store } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryGrid from "@/components/portfolio/CategoryGrid";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";
import { toast } from "@/components/ui/use-toast";
import { selectLatestUploadBatch } from "@/utils/newArrivals";

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
          localClient.entities.PortfolioImage.filter({ is_new: true }, "-created_date", 5000)
        ]);

        if (!mounted) return;

        const sortedCategories = [...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const categoryNameById = Object.fromEntries(sortedCategories.map((category) => [category.id, category.name]));
        const arrivalsWithCategory = selectLatestUploadBatch(arrivals).map((image) => ({
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="relative h-64 overflow-hidden bg-[#0b0b0b] md:h-80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(184,142,53,0.18),transparent_52%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        >
          <span className="text-gold text-xs tracking-[0.5em] uppercase font-medium block mb-3">Catálogo para lojistas</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">Produtos para o seu mix</h1>
          <div className="gold-line w-20 mx-auto" />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-14 flex flex-col justify-between gap-6 border-l-2 border-gold pl-5 lg:flex-row lg:items-center">
          <p className="max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
            Abra os produtos, escolha uma medida se desejar e monte sua seleção. Depois, compartilhe as imagens e os códigos com a loja ou o contato que preferir.
          </p>
          <Link to="/parceiros" className="inline-flex shrink-0 items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold transition-all hover:gap-4">
            <Store size={14} /> Como comprar <ArrowRight size={13} />
          </Link>
        </motion.div>

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <div className="mb-8 flex items-center gap-4">
          <LayoutGrid className="text-gold" size={20} />
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">Categorias do catálogo</h2>
            <p className="text-white/40 text-xs mt-0.5">{categories.length} categoria(s) disponível(is)</p>
          </div>
        </div>
        <div className="gold-line w-full mb-8" />

        <CategoryGrid categories={categories} imagesByCategory={imagesByCategory} />
      </div>
    </div>
  );
}

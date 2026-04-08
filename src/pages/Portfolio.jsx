import { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { motion } from "framer-motion";
import { Loader2, LayoutGrid } from "lucide-react";
import CategoryGrid from "@/components/portfolio/CategoryGrid";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";

export default function Portfolio() {
  const [categories, setCategories] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [cats, imgs] = await Promise.all([
        localClient.entities.Category.list("order", 100),
        localClient.entities.PortfolioImage.filter({ is_new: true }, "-created_date", 20)
      ]);

      const grouped = await localClient.entities.PortfolioImage.groupedByCategory(
        "-created_date",
        8,
        cats.map((category) => category.id)
      );

      setCategories([...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setNewImages(imgs);
      setImagesByCategory(grouped);
      setLoading(false);
    };
    load();
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
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src="https://picsum.photos/seed/ifq-portfolio-banner/1920/1080"
          alt="Portfólio"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
        >
          <span className="text-gold text-xs tracking-[0.5em] uppercase font-medium block mb-3">Nossos Trabalhos</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mb-4">Portfólio</h1>
          <div className="gold-line w-20 mx-auto" />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/60 max-w-2xl text-sm md:text-base leading-relaxed mb-14 border-l-2 border-gold pl-5">
          Explore nossa coleção completa de quadros e obras de arte. Cada peça é única e identificada por um código exclusivo extraído diretamente do arquivo
          original. Clique em uma categoria para ver todos os produtos disponíveis.
        </motion.p>

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <div className="mb-8 flex items-center gap-4">
          <LayoutGrid className="text-gold" size={20} />
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">Categorias</h2>
            <p className="text-white/40 text-xs mt-0.5">{categories.length} categoria(s) disponível(is)</p>
          </div>
        </div>
        <div className="gold-line w-full mb-8" />

        <CategoryGrid categories={categories} imagesByCategory={imagesByCategory} />
      </div>
    </div>
  );
}

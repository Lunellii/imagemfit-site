import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { ArrowRight } from "lucide-react";
import RotatingCategoryCard from "@/components/home/RotatingCategoryCard";

const ARTISTA_CATEGORIES = ["pinturas manuais", "tridimensional"];

export default function HomeCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await localClient.entities.Category.list("order", 8);
        const sorted = [...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const grouped = await localClient.entities.PortfolioImage.groupedByCategory(
          "-created_date",
          8,
          sorted.map((category) => category.id)
        );

        setCategories(sorted);
        setImagesByCategory(grouped);
      } catch (_error) {
        setCategories([]);
        setImagesByCategory({});
      }
    };

    load();
  }, []);

  if (!categories.length) return null;

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Coleções</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Categorias</h2>
            <div className="gold-line w-16 mt-4" />
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-gold text-xs tracking-widest uppercase hover:gap-3 transition-all">
            Ver todas <ArrowRight size={13} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => {
            const isArtista = ARTISTA_CATEGORIES.includes(cat.name.toLowerCase());
            const linkTo = isArtista ? "/artista" : `/portfolio/categoria/${cat.id}`;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <RotatingCategoryCard category={cat} linkTo={linkTo} coverImages={imagesByCategory[cat.id] || []} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


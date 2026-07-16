import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { ArrowRight } from "lucide-react";
import RotatingCategoryCard from "@/components/home/RotatingCategoryCard";

const ARTISTA_CATEGORY_KEYS = new Set(["pinturasmanuais", "pinturamanual", "tridimensional", "tridmensional"]);
const normalizeCategoryKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export default function HomeCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await localClient.entities.Category.list("order", 6);
        const sorted = [...cats].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const grouped = await localClient.entities.PortfolioImage.groupedByCategory(
          "-created_date",
          8,
          sorted.map((category) => category.id)
        );

        setCategories(sorted);
        setImagesByCategory(grouped);
      } catch {
        setCategories([]);
        setImagesByCategory({});
      }
    };

    load();
  }, []);

  if (!categories.length) return null;

  return (
    <section className="bg-[#111] px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-12 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">Categorias para lojistas</span>
            <h2 className="max-w-2xl font-heading text-4xl font-semibold leading-tight text-white md:text-5xl">
              Encontre novas opções para o <span className="italic text-gold">mix da sua loja.</span>
            </h2>
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold transition-all hover:gap-4">
            Ver catálogo completo <ArrowRight size={13} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12">
          {categories.map((category, index) => {
            const isArtista = ARTISTA_CATEGORY_KEYS.has(normalizeCategoryKey(category?.name));
            const linkTo = isArtista ? "/artista" : `/portfolio/categoria/${category.id}`;
            const isFeatured = index < 2;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className={isFeatured ? "col-span-2 lg:col-span-6" : "col-span-1 lg:col-span-3"}
              >
                <RotatingCategoryCard
                  category={category}
                  linkTo={linkTo}
                  coverImages={imagesByCategory[category.id] || []}
                  imageHeight={isFeatured ? "h-56 sm:h-72 lg:h-80" : "h-40 sm:h-52 lg:h-56"}
                  className={isFeatured ? "bg-[#181818]" : "bg-[#151515]"}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

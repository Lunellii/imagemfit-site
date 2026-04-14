import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import RotatingCategoryCard from "@/components/home/RotatingCategoryCard";

const ARTISTA_CATEGORY_KEYS = new Set(["pinturasmanuais", "pinturamanual", "tridimensional", "tridmensional"]);
const normalizeCategoryKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export default function CategoryGrid({ categories, imagesByCategory = {} }) {
  const getLink = (cat) => {
    if (ARTISTA_CATEGORY_KEYS.has(normalizeCategoryKey(cat?.name))) return "/artista";
    return `/portfolio/categoria/${cat.id}`;
  };

  if (!categories.length) {
    return (
      <div className="border border-dashed border-gold/20 py-20 text-center">
        <ImageIcon className="w-10 h-10 text-gold/30 mx-auto mb-4" />
        <p className="text-white/40 text-sm">Nenhuma categoria cadastrada ainda.</p>
        <p className="text-white/25 text-xs mt-2">Acesse o painel Admin para criar categorias e adicionar imagens.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {categories.map((cat, i) => (
        <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
          <RotatingCategoryCard category={cat} linkTo={getLink(cat)} coverImages={imagesByCategory[cat.id] || []} imageHeight="h-36 sm:h-44 lg:h-56" />
        </motion.div>
      ))}
    </div>
  );
}

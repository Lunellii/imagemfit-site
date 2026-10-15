import { Link } from "react-router-dom";
import { getCategoryPath } from "@/utils/categoryText";

const ARTISTA_CATEGORY_KEYS = new Set(["pinturasmanuais", "pinturamanual", "tridimensional", "tridmensional"]);
const normalizeCategoryKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const getCategoryLink = (category) => {
  if (ARTISTA_CATEGORY_KEYS.has(normalizeCategoryKey(category?.name))) return "/artista";
  return getCategoryPath(category);
};

export function CategoryCard({ category, linkTo, coverImages = [] }) {
  const coverEnabled = category?.cover_enabled ?? true;
  const cover = coverEnabled ? coverImages.find((image) => image?.image_url) : null;

  return (
    <Link to={linkTo} className="group block">
      <div className="aspect-[4/3] overflow-hidden bg-line">
        {cover ? (
          <img
            src={cover.image_url}
            alt={`${category.name}: ${cover.code || "peça do catálogo"}`}
            loading="lazy"
            decoding="async"
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl text-stone/40">{String(category?.name || "?").charAt(0)}</div>
        )}
      </div>
      <h3 className="font-display mt-3 text-lg font-semibold sm:text-xl">{category.name}</h3>
      {category.description ? <p className="mt-1 hidden text-sm leading-relaxed text-stone sm:block">{category.description}</p> : null}
    </Link>
  );
}

export default function CategoryGrid({ categories, imagesByCategory = {} }) {
  if (!categories.length) {
    return (
      <div className="border border-dashed border-line py-20 text-center">
        <p className="text-stone">Nenhuma categoria cadastrada ainda.</p>
        <p className="mt-2 text-sm text-stone">Acesse o painel administrativo para criar categorias e adicionar imagens.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} linkTo={getCategoryLink(category)} coverImages={imagesByCategory[category.id] || []} />
      ))}
    </div>
  );
}

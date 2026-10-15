import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { ArrowRight } from "lucide-react";
import { getCategoryPath } from "@/utils/categoryText";

const HOME_CATEGORY_LIMIT = 6;
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
        // Mostra as categorias que receberam imagens novas mais recentemente.
        const cats = await localClient.entities.Category.list("order", 500);
        const grouped = await localClient.entities.PortfolioImage.groupedByCategory(
          "-created_date",
          8,
          cats.map((category) => category.id)
        );
        const latestUpload = (category) => {
          const time = Date.parse(grouped[category.id]?.[0]?.created_date || "");
          return Number.isFinite(time) ? time : 0;
        };
        const recent = cats
          .filter((category) => grouped[category.id]?.length)
          .sort((a, b) => latestUpload(b) - latestUpload(a))
          .slice(0, HOME_CATEGORY_LIMIT);

        setCategories(recent);
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
    <section className="bg-paper px-5 py-16 text-ink sm:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm text-stone">Atualizado a cada postagem</p>
            <h2 className="font-display mt-2 text-4xl font-semibold leading-tight md:text-5xl">Peças novas no catálogo</h2>
          </div>
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brass">
            Todas as categorias <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
          {categories.map((category) => {
            const isArtista = ARTISTA_CATEGORY_KEYS.has(normalizeCategoryKey(category?.name));
            const linkTo = isArtista ? "/artista" : getCategoryPath(category);
            const cover = (imagesByCategory[category.id] || []).find((image) => image?.image_url);

            return (
              <Link key={category.id} to={linkTo} className="group block">
                <div className="aspect-[4/3] overflow-hidden bg-line">
                  {cover ? (
                    <img
                      src={cover.image_url}
                      alt={`${category.name}: ${cover.code || "peça do catálogo"}`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold sm:text-xl">{category.name}</h3>
                  {cover?.code ? <span className="shrink-0 text-xs text-stone">{cover.code}</span> : null}
                </div>
                {category.description ? <p className="mt-1 hidden text-sm leading-relaxed text-stone sm:block">{category.description}</p> : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

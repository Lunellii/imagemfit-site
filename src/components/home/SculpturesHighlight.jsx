import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Gem, Package, Sparkles } from "lucide-react";
import { localClient } from "@/api/localClient";

const SCULPTURE_CATEGORY_KEYS = new Set(["esculturas", "escultura"]);
const MAX_IMAGES = 4;

const normalizeCategoryKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const details = [
  { icon: Gem, label: "Peças com volume e presença para valorizar o ambiente" },
  { icon: Sparkles, label: "Combinam com quadros e espelhos na mesma composição" },
  { icon: Package, label: "Seleção por código, igual ao restante do catálogo" }
];

export default function SculpturesHighlight() {
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const categories = await localClient.entities.Category.list("order", 200);
        const found = categories.find((item) => SCULPTURE_CATEGORY_KEYS.has(normalizeCategoryKey(item?.name)));
        if (!found) return;

        const items = await localClient.entities.PortfolioImage.filter({ category_id: found.id }, "-created_date", MAX_IMAGES);
        if (!mounted) return;
        setCategory(found);
        setImages(items.filter((image) => typeof image?.image_url === "string" && image.image_url.length > 0));
      } catch {
        if (!mounted) return;
        setCategory(null);
        setImages([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!category || !images.length) return null;

  const linkTo = `/portfolio/categoria/${category.id}`;
  const [mainImage, ...sideImages] = images;

  return (
    <section className="relative overflow-hidden bg-[#0d0d0d] px-6 py-20 md:py-28">
      <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
          <div className={`grid gap-3 ${sideImages.length ? "grid-cols-3" : "grid-cols-1"}`}>
            <Link
              to={linkTo}
              className={`group relative aspect-[4/5] overflow-hidden border border-white/10 bg-black ${sideImages.length ? "col-span-2" : ""}`}
            >
              <img
                src={mainImage.image_url}
                alt={mainImage.title || `${category.name} - destaque`}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {mainImage.code ? (
                <span className="absolute bottom-4 left-4 bg-black/80 px-3 py-2 text-xs font-semibold tracking-wider text-white backdrop-blur-sm">#{mainImage.code}</span>
              ) : null}
            </Link>
            {sideImages.length ? (
              <div className="flex flex-col gap-3">
                {sideImages.map((image) => (
                  <Link key={image.id} to={linkTo} className="group relative min-h-0 flex-1 overflow-hidden border border-white/10 bg-black">
                    <img
                      src={image.image_url}
                      alt={image.title || category.name}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 bg-gold px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black">
            <Sparkles size={14} /> Novidade no catálogo
          </span>
          <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Esculturas que completam a <span className="italic text-gold">decoração.</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            {category.description || "Esculturas decorativas que trazem volume, presença e sofisticação aos ambientes."}
          </p>
          <ul className="mt-7 space-y-3 border-l-2 border-gold/40 pl-5">
            {details.map((detail) => (
              <li key={detail.label} className="flex items-center gap-3 text-sm leading-relaxed text-white/70">
                <detail.icon className="shrink-0 text-gold" size={17} />
                <span>{detail.label}</span>
              </li>
            ))}
          </ul>
          <Link
            to={linkTo}
            className="mt-8 inline-flex items-center justify-center gap-3 border border-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Ver esculturas <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

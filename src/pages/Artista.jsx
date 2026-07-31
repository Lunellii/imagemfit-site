import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { motion } from "framer-motion";
import { Loader2, ListPlus, Check, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";
import RotatingCategoryCard from "@/components/home/RotatingCategoryCard";

const ARTIST_PHOTO = `${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png?v=20260409`;
const ARTIST_CATEGORY_KEYS = new Set(["pinturasmanuais", "pinturamanual", "tridimensional", "tridmensional"]);

const normalizeCategoryKey = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export default function Artista() {
  const [artistCategories, setArtistCategories] = useState([]);
  const [coversByCategory, setCoversByCategory] = useState({});
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [categories, allImages, newestImages, groupedCovers] = await Promise.all([
          localClient.entities.Category.list("order", 100),
          localClient.entities.PortfolioImage.list("-created_date", 5000),
          localClient.entities.PortfolioImage.filter({ is_new: true }, "-created_date", 120),
          localClient.entities.PortfolioImage.groupedByCategory("-created_date", 10)
        ]);

        const selectedCategories = categories
          .filter((category) => ARTIST_CATEGORY_KEYS.has(normalizeCategoryKey(category?.name)))
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        const artistCategoryIds = selectedCategories.map((category) => category.id);

        if (!artistCategoryIds.length) {
          setArtistCategories([]);
          setCoversByCategory({});
          setImages([]);
          setNewImages([]);
          return;
        }

        const mergedImages = allImages.filter((image) => artistCategoryIds.includes(image.category_id));

        setArtistCategories(selectedCategories);
        const onlyArtistCovers = Object.fromEntries(
          artistCategoryIds.map((categoryId) => [categoryId, (groupedCovers?.[categoryId] || []).slice(0, 10)])
        );
        setCoversByCategory(onlyArtistCovers);
        setImages(mergedImages);
        setNewImages(newestImages.filter((image) => artistCategoryIds.includes(image.category_id)));
      } catch {
        toast({
          variant: "destructive",
          title: "Falha ao carregar as obras autorais",
          description: "Atualize a página e tente novamente."
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const addToCart = (img, e) => {
    e?.stopPropagation();
    if (isInCart(img.id)) {
      toast({ title: `#${img.code} já está na sua seleção` });
      return;
    }
    addItem({ id: img.id, code: img.code, title: img.title, image_url: img.image_url });
    toast({ title: `#${img.code} adicionado à sua seleção!` });
  };

  return (
    <div className="pt-28 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <section className="mb-16 sm:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="relative mx-auto w-full max-w-[520px]">
              <div className="overflow-hidden border border-gold/20 bg-black/40 aspect-[4/5] sm:aspect-[3/4]">
                <img src={ARTIST_PHOTO} alt="Almir Donizete Gonçalves" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-28 h-28 border border-gold/30 hidden sm:block" />
              <div className="absolute -top-5 -left-5 w-16 h-16 border border-gold/20 hidden sm:block" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">Obras autorais</span>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                Almir
                <br />
                <span className="text-gold">Gonçalves</span>
              </h1>
              <div className="gold-line w-16 mb-7" />
              <div className="space-y-4 text-white/60 text-sm sm:text-[15px] leading-relaxed">
                <p>
                  Esta linha reúne pinturas manuais e composições tridimensionais de Almir Gonçalves para lojistas que buscam produtos com assinatura autoral.
                </p>
                <p>
                  São obras com textura, cor e presença visual, pensadas para agregar exclusividade e diferenciação ao mix da sua loja.
                </p>
                <p>
                  Adicione os códigos à sua seleção e compartilhe com a loja ou o contato que preferir.
                </p>
              </div>
              <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-6 border-t border-gold/20 pt-6 sm:pt-8">
                {[
                  { n: "30+", l: "Anos de experiência" },
                  { n: "+2000", l: "Obras criadas" },
                  { n: "300+", l: "Clientes satisfeitos" }
                ].map((s) => (
                  <div key={s.l} className="min-w-0">
                    <p className="font-heading text-2xl sm:text-3xl font-bold text-gold">{s.n}</p>
                    <p className="text-white/45 text-[11px] sm:text-xs mt-1 leading-tight">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {artistCategories.length > 0 ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-2">Categorias autorais</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">Pinturas manuais e tridimensionais</h2>
              </div>
              <Link to="/portfolio" className="hidden sm:inline-flex items-center gap-2 text-gold text-xs tracking-widest uppercase hover:gap-3 transition-all">
                Ver portfólio <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {artistCategories.map((category) => (
                <RotatingCategoryCard
                  key={category.id}
                  category={category}
                  linkTo={`/portfolio/categoria/${category.id}`}
                  coverImages={coversByCategory[category.id] || []}
                  imageHeight="h-48 sm:h-56 md:h-60"
                />
              ))}
            </div>
          </section>
        ) : null}

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <section className="mt-8">
          <div className="mb-10">
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Pinturas manuais e tridimensionais</span>
            <h2 className="font-heading text-3xl font-bold text-white mb-2">Códigos autorais disponíveis</h2>
            <div className="gold-line w-16 mb-2" />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-gold" />
            </div>
          ) : images.length === 0 ? (
            <div className="border border-dashed border-gold/20 py-20 text-center">
              <p className="text-white/40 text-sm">Nenhum quadro encontrado nas categorias de pinturas manuais e tridimensionais.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  className="break-inside-avoid group bg-card mb-4 overflow-hidden"
                >
                  <img src={img.image_url} alt={img.title || img.code} className="w-full h-auto" />
                  <div className="p-3 border-t border-white/10">
                    <p className="text-gold text-xs font-mono">#{img.code}</p>
                    <button
                      onClick={(e) => addToCart(img, e)}
                      className={`mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 transition-colors ${
                        isInCart(img.id) ? "bg-gold/30 text-gold border border-gold" : "bg-gold text-black hover:bg-gold/90"
                      }`}
                    >
                      {isInCart(img.id) ? (
                        <>
                          <Check size={11} /> Na minha seleção
                        </>
                      ) : (
                        <>
                          <ListPlus size={11} /> Adicionar
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

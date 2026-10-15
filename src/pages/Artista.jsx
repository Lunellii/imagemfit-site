import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { Loader2, ListPlus, Check, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";
import { CategoryCard } from "@/components/portfolio/CategoryGrid";
import { selectLatestUploadBatch } from "@/utils/newArrivals";
import { getCategoryPath } from "@/utils/categoryText";

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
        setNewImages(selectLatestUploadBatch(newestImages).filter((image) => artistCategoryIds.includes(image.category_id)));
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
    <div className="min-h-screen bg-paper pb-24 pt-28 font-sans text-ink md:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="mb-20 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <figure className="mx-auto w-full max-w-md overflow-hidden bg-line lg:max-w-none">
            <img src={ARTIST_PHOTO} alt="Almir Donizete Gonçalves" className="aspect-[4/5] w-full object-cover object-top" />
          </figure>

          <div>
            <p className="text-sm font-semibold text-brass">Obras autorais</p>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-none md:text-7xl">Almir Gonçalves</h1>
            <div className="mt-7 max-w-xl space-y-4 text-lg leading-relaxed text-stone">
              <p>Pinturas manuais e composições tridimensionais para lojistas que buscam peças com assinatura do artista.</p>
              <p>São obras com textura, cor e presença, que trazem exclusividade ao mix da sua loja.</p>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { n: "30+", l: "anos de experiência" },
                { n: "2.000+", l: "obras criadas" },
                { n: "300+", l: "clientes atendidos" }
              ].map((s) => (
                <div key={s.l} className="min-w-0">
                  <dt className="font-display text-3xl font-semibold sm:text-4xl">{s.n}</dt>
                  <dd className="mt-1 text-sm leading-tight text-stone">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {artistCategories.length > 0 ? (
          <section className="mb-16">
            <div className="mb-8 flex items-end justify-between gap-4 border-t border-line pt-10">
              <h2 className="font-display text-3xl font-semibold md:text-4xl">Linhas autorais</h2>
              <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brass">
                Catálogo completo <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2">
              {artistCategories.map((category) => (
                <CategoryCard key={category.id} category={category} linkTo={getCategoryPath(category)} coverImages={coversByCategory[category.id] || []} />
              ))}
            </div>
          </section>
        ) : null}

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <section className="border-t border-line pt-10">
          <h2 className="font-display mb-8 text-3xl font-semibold md:text-4xl">Todas as obras</h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-brass" />
            </div>
          ) : images.length === 0 ? (
            <div className="border border-dashed border-line py-20 text-center text-stone">Nenhuma obra cadastrada nas linhas autorais ainda.</div>
          ) : (
            <div className="columns-2 gap-5 sm:columns-3 lg:columns-4">
              {images.map((img) => (
                <article key={img.id} className="mb-8 break-inside-avoid">
                  <img src={img.image_url} alt={img.title || img.code} loading="lazy" decoding="async" className="h-auto w-full bg-line" />
                  <p className="mt-3 font-semibold">{img.code}</p>
                  <button
                    onClick={(e) => addToCart(img, e)}
                    className={`mt-2 flex h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold transition-colors ${
                      isInCart(img.id) ? "border border-brass bg-brass/10 text-brass" : "bg-ink text-paper hover:bg-brass"
                    }`}
                  >
                    {isInCart(img.id) ? (
                      <>
                        <Check size={16} /> Na seleção
                      </>
                    ) : (
                      <>
                        <ListPlus size={16} /> Selecionar
                      </>
                    )}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

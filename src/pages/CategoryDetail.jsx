import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ListPlus, Loader2 } from "lucide-react";
import { localClient } from "@/api/localClient";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import {
  getCategoryPageDescription,
  getCategoryPageTitle,
  getCategoryPath,
  getCategorySlug,
  withDisplayCategory
} from "@/utils/categoryText";
import ProductQuickView from "@/components/portfolio/ProductQuickView";
import ShareArtworkButton from "@/components/portfolio/ShareArtworkButton";

const PAGE_SIZE = 35;
const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function ArtworkCard({ image, categoryName, masonry, onOpen }) {
  const { addItem, isInCart } = useCart();
  const selected = isInCart(image.id);
  const payload = {
    id: image.id,
    code: image.code,
    title: image.title,
    image_url: image.image_url,
    category: categoryName
  };

  const addToSelection = (event) => {
    event.stopPropagation();
    if (selected) {
      toast({ title: `#${image.code} já está na sua seleção` });
      return;
    }
    addItem(payload);
    toast({ title: `#${image.code} adicionado à sua seleção` });
  };

  return (
    <article className={`group ${masonry ? "mb-6 break-inside-avoid" : ""}`}>
      <button
        type="button"
        onClick={() => onOpen(image)}
        className="relative block w-full overflow-hidden bg-line text-left"
        aria-label={`Ver detalhes do quadro ${image.code}`}
      >
        <img
          src={image.image_url}
          alt={image.title || image.code}
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </button>

      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[0.95rem] font-semibold">{image.code}</p>
          <button type="button" onClick={() => onOpen(image)} className="shrink-0 text-sm text-stone underline-offset-4 hover:text-ink hover:underline">
            Detalhes
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={addToSelection}
            aria-label={`${selected ? "Já está na seleção" : "Adicionar à seleção"}: quadro ${image.code}`}
            className={`flex h-11 min-w-0 items-center justify-center gap-1.5 px-2 text-sm font-semibold transition-colors ${
              selected ? "border border-brass bg-brass/10 text-brass" : "bg-ink text-paper hover:bg-brass"
            }`}
          >
            {selected ? <Check size={16} /> : <ListPlus size={16} />}
            {selected ? "Na seleção" : "Selecionar"}
          </button>
          <ShareArtworkButton image={image} compact />
        </div>
      </div>
    </article>
  );
}

const findCategory = (categories, id, slug) => {
  if (id) return categories.find((item) => item.id === id) || null;
  return categories.find((item) => getCategorySlug(item.name) === slug) || null;
};

export default function CategoryDetail() {
  const { id: idParam, slug } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    localClient.entities.Category.list("order", 500)
      .then((items) => {
        if (mounted) setCategories(items);
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const resolvedCategory = categories ? findCategory(categories, idParam, slug) : null;
  const id = resolvedCategory?.id || null;

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  // Endereços antigos (/portfolio/categoria/<id>) passam a usar o nome da categoria.
  useEffect(() => {
    if (!idParam || !resolvedCategory) return;
    const path = getCategoryPath(resolvedCategory);
    if (path !== `/portfolio/categoria/${idParam}`) navigate(path, { replace: true });
  }, [idParam, resolvedCategory, navigate]);

  useEffect(() => {
    if (!categories) return undefined;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        if (!id) {
          setCategory(null);
          setImages([]);
          setTotalImages(0);
          return;
        }
        const pageData = await localClient.entities.PortfolioImage.filterPage({ category_id: id }, "-created_date", currentPage, PAGE_SIZE);
        if (!mounted) return;
        setCategory(withDisplayCategory(categories.find((item) => item.id === id) || null));
        setImages(pageData.items || []);
        setTotalImages(pageData.total || 0);
      } catch {
        if (!mounted) return;
        setCategory(null);
        setImages([]);
        setTotalImages(0);
        toast({ variant: "destructive", title: "Falha ao carregar a categoria", description: "Atualize a página e tente novamente." });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [categories, id, currentPage]);

  useEffect(() => {
    if (!category?.name) return;
    document.title = getCategoryPageTitle(category.name);
    document.querySelector('meta[name="description"]')?.setAttribute("content", getCategoryPageDescription(category.description));
  }, [category?.name, category?.description]);

  const totalPages = Math.max(1, Math.ceil(totalImages / PAGE_SIZE));
  const isEspelhosPage = normalizeCategoryName(category?.name) === "espelhos";

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-24 pt-28 font-sans text-ink md:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link to="/portfolio" className="inline-flex items-center gap-1.5 text-sm text-stone transition-colors hover:text-ink">
          <ChevronLeft size={16} /> Catálogo
        </Link>

        <header className="mb-10 mt-6 grid gap-4 border-b border-line pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 className="font-display text-5xl font-semibold leading-none md:text-6xl">{category?.name || "Categoria"}</h1>
            {category?.description ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone">{category.description}</p> : null}
          </div>
          <p className="text-sm text-stone">
            {totalImages} {totalImages === 1 ? "peça" : "peças"}
            {totalPages > 1 ? ` · página ${currentPage} de ${totalPages}` : ""}
          </p>
        </header>

        {images.length ? (
          <>
            <div className={isEspelhosPage ? "columns-2 gap-x-5 sm:columns-3 lg:columns-4" : "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"}>
              {images.map((image) => (
                <ArtworkCard
                  key={image.id}
                  image={image}
                  categoryName={category?.name || ""}
                  masonry={isEspelhosPage}
                  onOpen={setSelectedImage}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="mt-16 flex flex-wrap items-center justify-center gap-2" aria-label="Páginas">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior" className="flex h-11 w-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30">
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} type="button" onClick={() => goToPage(page)} aria-current={page === currentPage ? "page" : undefined} className={`h-11 min-w-11 border px-3 text-sm font-semibold transition-colors ${page === currentPage ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"}`}>
                    {page}
                  </button>
                ))}
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Próxima página" className="flex h-11 w-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </nav>
            ) : null}
          </>
        ) : (
          <div className="border border-dashed border-line py-20 text-center text-stone">Nenhum quadro cadastrado nesta categoria ainda.</div>
        )}
      </div>

      <ProductQuickView image={selectedImage} categoryName={category?.name || ""} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, ListPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { localClient } from "@/api/localClient";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import { withDisplayCategory } from "@/utils/categoryText";
import ProductQuickView from "@/components/portfolio/ProductQuickView";

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
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative overflow-hidden border border-white/10 bg-[#1a1a1a] transition-colors hover:border-gold/45 ${masonry ? "mb-5 break-inside-avoid" : ""}`}
    >
      <button
        type="button"
        onClick={() => onOpen(image)}
        className="relative block w-full overflow-hidden bg-black/30 text-left"
        aria-label={`Ver detalhes do quadro ${image.code}`}
      >
        <img
          src={image.image_url}
          alt={image.title || image.code}
          loading="lazy"
          decoding="async"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.035]"
        />
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-black/75 px-3 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
          Ver detalhes
        </span>
      </button>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-mono text-xs font-semibold text-gold">#{image.code}</p>
          {image.title && image.title !== image.code ? <p className="truncate text-right text-[11px] text-white/35">{image.title}</p> : null}
        </div>
        <button
          type="button"
          onClick={addToSelection}
          className={`flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
            selected ? "border border-gold/50 bg-gold/10 text-gold" : "bg-gold text-black hover:bg-[#c9a85d]"
          }`}
        >
          {selected ? <Check size={13} /> : <ListPlus size={13} />}
          {selected ? "Na seleção comercial" : "Adicionar à seleção"}
        </button>
      </div>
    </motion.article>
  );
}

export default function CategoryDetail() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [categories, pageData] = await Promise.all([
          localClient.entities.Category.list("order", 100),
          localClient.entities.PortfolioImage.filterPage({ category_id: id }, "-created_date", currentPage, PAGE_SIZE)
        ]);
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
  }, [id, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalImages / PAGE_SIZE));
  const isEspelhosPage = normalizeCategoryName(category?.name) === "espelhos";

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] pb-20 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link to="/portfolio" className="mb-10 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-gold">
          <ChevronLeft size={14} /> Voltar ao portfólio
        </Link>

        <motion.header className="mb-9" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">Catálogo para lojistas</span>
          <h1 className="font-heading text-4xl font-semibold text-white md:text-5xl">{category?.name || "Categoria"}</h1>
          {category?.description ? <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55">{category.description}</p> : null}
          <p className="mt-3 text-xs text-white/30">{totalImages} quadro(s){totalPages > 1 ? ` · página ${currentPage} de ${totalPages}` : ""}</p>
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-white/42">Abra um produto para ver os detalhes e adicione os códigos de interesse à seleção comercial da sua loja.</p>
        </motion.header>

        {images.length ? (
          <>
            <div className={isEspelhosPage ? "columns-2 gap-x-4 sm:columns-3 lg:columns-4" : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5"}>
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
              <div className="mt-14 flex items-center justify-center gap-2">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} type="button" onClick={() => goToPage(page)} className={`h-9 w-9 border font-mono text-xs transition-colors ${page === currentPage ? "border-gold bg-gold text-black" : "border-white/20 text-white/60 hover:border-gold hover:text-gold"}`}>
                    {page}
                  </button>
                ))}
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-30">
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="border border-dashed border-gold/20 py-20 text-center text-sm text-white/30">Nenhum quadro cadastrado nesta categoria ainda.</div>
        )}
      </div>

      <ProductQuickView image={selectedImage} categoryName={category?.name || ""} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

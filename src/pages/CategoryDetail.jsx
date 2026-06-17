import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { localClient } from "@/api/localClient";
import { Loader2, ChevronLeft, ShoppingCart, Check, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import { withDisplayCategory } from "@/utils/categoryText";

const PAGE_SIZE = 35;
const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function CategoryDetail() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { addItem, isInCart } = useCart();

  const addToCart = (img, e) => {
    e?.stopPropagation();
    if (isInCart(img.id)) {
      toast({ title: `#${img.code} já está no carrinho` });
      return;
    }
    addItem({ id: img.id, code: img.code, title: img.title, image_url: img.image_url, category: category?.name });
    toast({ title: `✓ #${img.code} adicionado!` });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [cats, pageData] = await Promise.all([
          localClient.entities.Category.list("order", 100),
          localClient.entities.PortfolioImage.filterPage({ category_id: id }, "-created_date", currentPage, PAGE_SIZE)
        ]);

        if (!mounted) return;
        setCategory(withDisplayCategory(cats.find((c) => c.id === id) || null));
        setImages(pageData.items || []);
        setTotalImages(pageData.total || 0);
      } catch (_error) {
        if (!mounted) return;
        setCategory(null);
        setImages([]);
        setTotalImages(0);
        toast({
          variant: "destructive",
          title: "Falha ao carregar a categoria",
          description: "Atualize a página e tente novamente."
        });
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
  const paginated = images;
  const isEspelhosPage = normalizeCategoryName(category?.name) === "espelhos";

  const goToPage = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111]">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="pt-28 pb-16 min-h-screen bg-[#111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Link to="/portfolio" className="inline-flex items-center gap-2 text-white/50 hover:text-gold text-xs tracking-widest uppercase transition-colors mb-10">
          <ChevronLeft size={14} /> Voltar ao catálogo
        </Link>

        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Categoria</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2">{category?.name || "Categoria"}</h1>
          <div className="gold-line w-16 mb-4" />
          {category?.description && <p className="text-white/60 text-sm max-w-xl">{category.description}</p>}
          <p className="text-white/30 text-xs mt-2">
            {totalImages} quadro(s)
            {totalPages > 1 ? ` - página ${currentPage} de ${totalPages}` : ""}
          </p>
        </motion.div>

        {!images.length ? (
          <div className="border border-dashed border-gold/20 py-20 text-center">
            <p className="text-white/30 text-sm">Nenhum quadro cadastrado nesta categoria ainda.</p>
          </div>
        ) : (
          <>
            {isEspelhosPage ? (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-x-5">
                {paginated.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="group mb-5 break-inside-avoid bg-[#1a1a1a] border border-white/8 hover:border-gold/40 transition-colors rounded-sm overflow-hidden"
                  >
                    <div className="overflow-hidden cursor-pointer" onClick={() => setLightbox(img)}>
                      <img
                        src={img.image_url}
                        alt={img.code}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-gold text-xs font-semibold truncate">#{img.code}</p>
                        {img.title && img.title !== img.code && <p className="text-white/40 text-xs truncate text-right">{img.title}</p>}
                      </div>
                      <button
                        onClick={(e) => addToCart(img, e)}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm font-medium transition-all ${
                          isInCart(img.id) ? "bg-gold/20 border border-gold text-gold" : "bg-gold text-black hover:bg-gold/80"
                        }`}
                      >
                        {isInCart(img.id) ? (
                          <>
                            <Check size={12} /> No carrinho
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={12} /> Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginated.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="group bg-[#1a1a1a] border border-white/8 hover:border-gold/40 transition-colors rounded-sm overflow-hidden"
                  >
                    <div className="overflow-hidden cursor-pointer" onClick={() => setLightbox(img)}>
                      <img
                        src={img.image_url}
                        alt={img.code}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onContextMenu={(event) => event.preventDefault()}
                        className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-gold text-xs font-semibold truncate">#{img.code}</p>
                        {img.title && img.title !== img.code && <p className="text-white/40 text-xs truncate text-right">{img.title}</p>}
                      </div>
                      <button
                        onClick={(e) => addToCart(img, e)}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-sm font-medium transition-all ${
                          isInCart(img.id) ? "bg-gold/20 border border-gold text-gold" : "bg-gold text-black hover:bg-gold/80"
                        }`}
                      >
                        {isInCart(img.id) ? (
                          <>
                            <Check size={12} /> No carrinho
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={12} /> Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-14">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 border text-xs font-mono transition-colors ${
                      p === currentPage ? "border-gold bg-gold text-black" : "border-white/20 text-white/60 hover:border-gold hover:text-gold"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/97 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/60 hover:text-gold transition-colors z-10" onClick={() => setLightbox(null)}>
              <X size={26} />
            </button>
            <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }} className="max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightbox.image_url}
                alt={lightbox.code}
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="w-full max-h-[72vh] object-contain"
              />
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-gold/20 pt-4">
                <div>
                  <p className="font-heading text-lg text-white">{lightbox.title || lightbox.code}</p>
                  <p className="text-gold font-mono text-sm mt-0.5">#{lightbox.code}</p>
                </div>
                <button
                  onClick={(e) => {
                    addToCart(lightbox, e);
                    setLightbox(null);
                  }}
                  className={`flex items-center gap-1.5 text-xs px-5 py-2.5 font-medium transition-colors ${
                    isInCart(lightbox.id) ? "bg-gold/20 border border-gold text-gold" : "bg-gold text-black hover:bg-gold/80"
                  }`}
                >
                  {isInCart(lightbox.id) ? (
                    <>
                      <Check size={13} /> No carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={13} /> Adicionar ao carrinho
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

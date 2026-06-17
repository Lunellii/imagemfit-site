import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Search, ShoppingCart, X } from "lucide-react";
import { localClient } from "@/api/localClient";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [categoryById, setCategoryById] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || loaded || loading) return;

    let mounted = true;
    setLoading(true);

    Promise.all([localClient.entities.Category.list("order", 500), localClient.entities.PortfolioImage.list("-created_date", 5000)])
      .then(([categories, portfolioImages]) => {
        if (!mounted) return;
        setCategoryById(Object.fromEntries((categories || []).map((category) => [category.id, category])));
        setImages(Array.isArray(portfolioImages) ? portfolioImages : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!mounted) return;
        toast({
          variant: "destructive",
          title: "Falha ao carregar a busca",
          description: "Atualize a página e tente novamente."
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [loaded, loading, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const getCategoryName = (image) => {
    const category = categoryById[image.category_id];
    return category?.name || image.category || image.category_name || "";
  };

  const results = useMemo(() => {
    const searchTerm = normalizeSearchText(query);
    if (!searchTerm) return [];

    return images
      .filter((image) => {
        const searchable = normalizeSearchText(`${image.code || ""} ${image.title || ""} ${getCategoryName(image)}`);
        return searchable.includes(searchTerm);
      })
      .slice(0, 48);
  }, [categoryById, images, query]);

  const addToCart = (image) => {
    if (isInCart(image.id)) {
      toast({ title: `#${image.code} já está no carrinho` });
      return;
    }

    addItem({
      id: image.id,
      code: image.code,
      title: image.title,
      image_url: image.image_url,
      category: getCategoryName(image)
    });
    toast({ title: `✓ #${image.code} adicionado!` });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/96 backdrop-blur-lg px-4 py-5 sm:px-6 sm:py-8">
          <div className="mx-auto flex h-full max-w-5xl flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gold/20 pb-4">
              <div>
                <span className="text-gold text-[11px] tracking-[0.32em] uppercase">Buscar</span>
                <h2 className="font-heading text-2xl text-white mt-1">Pesquisar quadros</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 border border-white/20 text-white/70 hover:border-gold hover:text-gold transition-colors flex items-center justify-center"
                aria-label="Fechar busca"
              >
                <X size={19} />
              </button>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Código, categoria ou nome"
                className="w-full bg-[#151515] border border-white/15 text-white placeholder-white/35 pl-12 pr-4 py-4 text-sm outline-none focus:border-gold transition-colors"
              />
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 animate-spin text-gold" />
                </div>
              ) : !query.trim() ? (
                <div className="border border-dashed border-gold/20 py-16 text-center">
                  <Search className="w-9 h-9 text-gold/40 mx-auto mb-4" />
                  <p className="text-white/45 text-sm">Digite para pesquisar por código, categoria ou nome.</p>
                </div>
              ) : results.length === 0 ? (
                <div className="border border-dashed border-gold/20 py-16 text-center">
                  <p className="text-white/45 text-sm">Nenhum quadro encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                  {results.map((image) => {
                    const categoryName = getCategoryName(image);
                    const inCart = isInCart(image.id);

                    return (
                      <article key={image.id} className="bg-[#171717] border border-white/10 hover:border-gold/40 transition-colors">
                        <div className="bg-black/40">
                          <img
                            src={image.image_url}
                            alt={image.code}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            onContextMenu={(event) => event.preventDefault()}
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <div>
                            <p className="text-gold font-mono text-xs font-semibold truncate">#{image.code}</p>
                            {categoryName && <p className="text-white/45 text-[11px] truncate mt-0.5">{categoryName}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(image)}
                            className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 font-medium transition-colors ${
                              inCart ? "bg-gold/20 border border-gold text-gold" : "bg-gold text-black hover:bg-gold/85"
                            }`}
                          >
                            {inCart ? (
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
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

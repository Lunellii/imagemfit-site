import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListPlus, Loader2, Search, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";

const normalizeSearchText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const compactSearchText = (value) => normalizeSearchText(value).replace(/[^a-z0-9]/g, "");

const matchesSearch = (image, query, categoryName = "") => {
  const term = normalizeSearchText(query).replace(/^#+/, "");
  const compactTerm = compactSearchText(query);
  if (!term && !compactTerm) return false;

  const searchable = normalizeSearchText(`${image.code || ""} ${image.title || ""} ${categoryName}`);
  const compactSearchable = compactSearchText(`${image.code || ""} ${image.title || ""} ${categoryName}`);

  return Boolean(
    (term && searchable.includes(term)) ||
      (compactTerm && compactSearchable.includes(compactTerm))
  );
};

const searchViaApi = async (query) => {
  const params = new URLSearchParams({ q: query, limit: "48" });
  const response = await fetch(`/api/images/search?${params.toString()}`, {
    credentials: "include"
  });

  if (!response.ok) throw new Error("SEARCH_FAILED");
  return response.json();
};

const fallbackSearch = async (query) => {
  const [imagesResponse, categoriesResponse] = await Promise.all([
    fetch("/api/images?sort=-created_date&limit=5000", { credentials: "include" }),
    fetch("/api/categories?sort=order&limit=500", { credentials: "include" }).catch(() => null)
  ]);

  if (!imagesResponse.ok) throw new Error("SEARCH_FALLBACK_FAILED");

  const portfolioImages = await imagesResponse.json();
  const categories = categoriesResponse?.ok ? await categoriesResponse.json() : [];
  const categoryById = Object.fromEntries((categories || []).map((category) => [category.id, category]));

  return (Array.isArray(portfolioImages) ? portfolioImages : [])
    .filter((image) => matchesSearch(image, query, categoryById[image.category_id]?.name || ""))
    .slice(0, 48)
    .map((image) => ({
      ...image,
      category_name: categoryById[image.category_id]?.name || image.category_name || image.category || ""
    }));
};

const searchPortfolioImages = async (query) => {
  try {
    return await searchViaApi(query);
  } catch {
    return fallbackSearch(query);
  }
};

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setResults([]);
      setLoading(false);
      return;
    }

    const searchTerm = query.trim();
    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(() => {
      setLoading(true);

      searchPortfolioImages(searchTerm)
        .then((items) => {
          if (mounted) setResults(Array.isArray(items) ? items : []);
        })
        .catch(() => {
          if (!mounted) return;
          setResults([]);
          toast({
            variant: "destructive",
            title: "Falha ao pesquisar",
            description: "Tente novamente em instantes."
          });
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }, 220);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const getCategoryName = (image) => image.category_name || image.category || "";

  const addToCart = (image) => {
    if (isInCart(image.id)) {
      toast({ title: `#${image.code} já está na sua seleção` });
      return;
    }

    addItem({
      id: image.id,
      code: image.code,
      title: image.title,
      image_url: image.image_url,
      category: getCategoryName(image)
    });
    toast({ title: `#${image.code} adicionado à sua seleção` });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/96 backdrop-blur-lg px-4 py-5 sm:px-6 sm:py-8"
        >
          <div className="mx-auto flex h-full max-w-5xl flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-gold/20 pb-4">
              <div>
                <span className="text-gold text-[11px] tracking-[0.32em] uppercase">Busca comercial</span>
                <h2 className="font-heading text-2xl text-white mt-1">Buscar no catálogo</h2>
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
                                <Check size={12} /> Na minha seleção
                              </>
                            ) : (
                              <>
                                <ListPlus size={12} /> Adicionar
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

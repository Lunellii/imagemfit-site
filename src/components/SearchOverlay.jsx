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
          className="fixed inset-0 z-[70] bg-paper px-5 py-5 font-sans text-ink sm:px-8 sm:py-8"
        >
          <div className="mx-auto flex h-full max-w-5xl flex-col">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">Buscar no catálogo</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-line"
                aria-label="Fechar busca"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone" size={20} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Código, categoria ou nome"
                className="h-14 w-full border border-line bg-white pl-12 pr-4 text-lg outline-none transition-colors placeholder:text-stone/60 focus:border-ink"
              />
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-brass" />
                </div>
              ) : !query.trim() ? (
                <p className="py-16 text-center text-stone">Digite um código (ex.: NAT_00001), uma categoria ou um nome.</p>
              ) : results.length === 0 ? (
                <p className="py-16 text-center text-stone">Nenhum quadro encontrado para “{query.trim()}”.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 pb-8 sm:grid-cols-3 lg:grid-cols-4">
                  {results.map((image) => {
                    const categoryName = getCategoryName(image);
                    const inCart = isInCart(image.id);

                    return (
                      <article key={image.id}>
                        <img
                          src={image.image_url}
                          alt={image.code}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          onContextMenu={(event) => event.preventDefault()}
                          className="h-auto w-full bg-line"
                        />
                        <p className="mt-3 truncate font-semibold">{image.code}</p>
                        {categoryName && <p className="truncate text-sm text-stone">{categoryName}</p>}
                        <button
                          type="button"
                          onClick={() => addToCart(image)}
                          className={`mt-2 flex h-11 w-full items-center justify-center gap-1.5 text-sm font-semibold transition-colors ${
                            inCart ? "border border-brass bg-brass/10 text-brass" : "bg-ink text-paper hover:bg-brass"
                          }`}
                        >
                          {inCart ? (
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

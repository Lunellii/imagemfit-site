import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Frame, ListPlus, Maximize2, Share2, Sparkles, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";

const getOrientation = (image) => {
  if (!image?.naturalWidth || !image?.naturalHeight) return "Formato sob consulta";
  const ratio = image.naturalWidth / image.naturalHeight;
  if (ratio > 1.12) return "Formato horizontal";
  if (ratio < 0.88) return "Formato vertical";
  return "Formato quadrado";
};

export default function ProductQuickView({ image, categoryName = "", onClose }) {
  const { addItem, isInCart } = useCart();
  const [orientation, setOrientation] = useState("Formato sob consulta");
  const selected = image ? isInCart(image.id) : false;

  useEffect(() => {
    if (!image) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [image, onClose]);

  const itemPayload = image
    ? {
        id: image.id,
        code: image.code,
        title: image.title,
        image_url: image.image_url,
        category: categoryName || image.category || image.category_name || ""
      }
    : null;

  const addToSelection = () => {
    if (!itemPayload || selected) return;
    addItem(itemPayload);
    toast({ title: `#${image.code} adicionado à sua seleção` });
  };

  const shareArtwork = async () => {
    const text = `Imagem Fit Quadros — #${image.code}${categoryName ? ` (${categoryName})` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Imagem Fit Quadros", text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        toast({ title: "Referência copiada" });
      }
    } catch (error) {
      if (error?.name !== "AbortError") toast({ title: "Não foi possível compartilhar", variant: "destructive" });
    }
  };

  const productDetails = [
    { icon: Sparkles, label: "Impressão", value: "Alta definição" },
    { icon: Frame, label: "Acabamento", value: "Sob consulta" },
    { icon: Maximize2, label: "Orientação", value: orientation.replace("Formato ", "") }
  ];

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] overflow-y-auto bg-black/96 p-3 backdrop-blur-xl sm:p-6"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center">
            <motion.article
              role="dialog"
              aria-modal="true"
              aria-label={`Detalhes do quadro ${image.code}`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className="grid w-full max-w-6xl overflow-hidden border border-white/10 bg-[#151515] shadow-2xl lg:grid-cols-[1.12fr_0.88fr]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative flex min-h-[48vh] items-center justify-center bg-[#090909] p-4 sm:p-8 lg:min-h-[78vh]">
                <img
                  src={image.image_url}
                  alt={image.title || `Quadro ${image.code}`}
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                  onLoad={(event) => setOrientation(getOrientation(event.currentTarget))}
                  className="max-h-[72vh] max-w-full object-contain shadow-2xl"
                />
                <span className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/75 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-white/65 backdrop-blur-sm">
                  <Maximize2 size={12} className="text-gold" /> Visualização ampliada
                </span>
              </div>

              <div className="relative flex flex-col p-6 sm:p-9 lg:p-11">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-white/15 text-white/55 transition-colors hover:border-gold hover:text-gold"
                  aria-label="Fechar detalhes"
                >
                  <X size={19} />
                </button>

                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">{categoryName || "Catálogo Imagem Fit"}</span>
                <h2 className="mt-5 pr-12 font-heading text-4xl font-semibold text-white">{image.title && image.title !== image.code ? image.title : "Quadro decorativo"}</h2>
                <p className="mt-2 font-mono text-lg tracking-wider text-gold">#{image.code}</p>
                <p className="mt-6 text-sm leading-relaxed text-white/55">
                  Adicione este código à seleção da sua loja para consultar valores, tamanhos, materiais e opções de moldura disponíveis.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {productDetails.map((detail) => (
                    <div key={detail.label} className="border border-white/10 bg-black/20 p-3">
                      <detail.icon size={15} className="mb-2 text-gold" />
                      <span className="block text-[8px] uppercase tracking-[0.22em] text-white/35">{detail.label}</span>
                      <span className="mt-1 block text-xs text-white/75">{detail.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <button
                    type="button"
                    onClick={addToSelection}
                    disabled={selected}
                    className={`flex w-full items-center justify-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                      selected ? "border border-gold/50 bg-gold/10 text-gold" : "bg-gold text-black hover:bg-[#c9a85d]"
                    }`}
                  >
                    {selected ? <Check size={15} /> : <ListPlus size={15} />}
                    {selected ? "Na seleção comercial" : "Adicionar à seleção comercial"}
                  </button>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={shareArtwork}
                      className="flex w-full items-center justify-center gap-2 border border-white/15 px-4 py-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-gold hover:text-gold"
                    >
                      <Share2 size={14} /> Compartilhar
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

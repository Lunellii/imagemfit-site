import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListPlus, Maximize2, Ruler, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";

const FRAME_SIZES = ["40x60", "65x65", "65x100", "90x90", "80x120", "90x144"];

export default function ProductQuickView({ image, categoryName = "", onClose }) {
  const { addItem, isInCart } = useCart();
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

                <div className="mt-8 border-y border-white/10 py-6">
                  <div className="mb-4 flex items-center gap-2 text-gold">
                    <Ruler size={16} />
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em]">Tamanhos sugeridos e fazemos personalizados</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {FRAME_SIZES.map((size) => (
                      <span key={size} className="border border-gold/25 bg-gold/5 px-3 py-2.5 text-center font-mono text-xs tracking-wide text-white/80">
                        {size} cm
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-7">
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

                </div>
              </div>
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

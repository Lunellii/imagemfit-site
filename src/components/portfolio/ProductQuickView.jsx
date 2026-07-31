import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListPlus, Maximize2, Ruler, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import { commercialClient } from "@/api/commercialClient";

const FRAME_SIZES = ["40x60", "65x65", "65x100", "90x90", "80x120", "90x144"];

export default function ProductQuickView({ image, categoryName = "", onClose }) {
  const { cart, addItem, updateItem, isInCart } = useCart();
  const selected = image ? isInCart(image.id) : false;
  const selectedItem = image ? cart.find((item) => item.id === image.id) : null;
  const [selectedSize, setSelectedSize] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");

  useEffect(() => {
    const savedSize = String(selectedItem?.size || "").replace(/\s*cm$/i, "");
    if (FRAME_SIZES.includes(savedSize)) {
      setSelectedSize(savedSize);
      setCustomWidth("");
      setCustomHeight("");
      return;
    }

    const customMatch = savedSize.match(/^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)$/i);
    if (customMatch) {
      setSelectedSize("custom");
      setCustomWidth(customMatch[1]);
      setCustomHeight(customMatch[2]);
      return;
    }

    setSelectedSize("");
    setCustomWidth("");
    setCustomHeight("");
  }, [image?.id, selectedItem?.size]);

  const sizeValue = useMemo(() => {
    if (selectedSize === "custom") {
      if (!customWidth || !customHeight) return "";
      return `${customWidth.replace(",", ".")}x${customHeight.replace(",", ".")} cm`;
    }
    return selectedSize ? `${selectedSize} cm` : "";
  }, [customHeight, customWidth, selectedSize]);

  const selectionChanged = String(selectedItem?.size || "") !== sizeValue;

  useEffect(() => {
    if (!image) return undefined;
    commercialClient.analytics.track("product_view", {
      product_code: image.code,
      category: categoryName || image.category || image.category_name || ""
    });
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [categoryName, image, onClose]);

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
    if (!itemPayload) return;
    if (selected) {
      if (!selectionChanged) return;
      updateItem(image.id, { size: sizeValue });
      toast({ title: `Tamanho de #${image.code} atualizado` });
      return;
    }
    addItem({ ...itemPayload, ...(sizeValue ? { size: sizeValue } : {}) });
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
              className="grid w-full max-w-5xl overflow-hidden border border-white/10 bg-[#151515] shadow-2xl lg:grid-cols-[1.08fr_0.92fr]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative flex min-h-[46vh] items-center justify-center bg-[#090909] p-4 sm:p-7 lg:min-h-[66vh]">
                <img
                  src={image.image_url}
                  alt={image.title || `Quadro ${image.code}`}
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                  className="max-h-[62vh] max-w-full object-contain shadow-2xl"
                />
                <span className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/75 px-3 py-2 text-[9px] uppercase tracking-[0.22em] text-white/65 backdrop-blur-sm">
                  <Maximize2 size={12} className="text-gold" /> Visualização ampliada
                </span>
              </div>

              <div className="relative flex flex-col p-5 sm:p-7 lg:p-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-white/15 text-white/55 transition-colors hover:border-gold hover:text-gold"
                  aria-label="Fechar detalhes"
                >
                  <X size={19} />
                </button>

                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">{categoryName || "Catálogo Imagem Fit"}</span>
                <h2 className="mt-4 pr-12 font-heading text-3xl font-semibold text-white sm:text-4xl">{image.title && image.title !== image.code ? image.title : "Quadro decorativo"}</h2>
                <p className="mt-1 font-mono text-base tracking-wider text-gold">#{image.code}</p>

                <div className="mt-5 border-y border-white/10 py-5">
                  <div className="mb-3 flex items-center gap-2 text-gold">
                    <Ruler size={16} />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em]">Escolha um tamanho</h3>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-white/50">A medida é opcional. Também fazemos tamanhos personalizados.</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {FRAME_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                        aria-pressed={selectedSize === size}
                        className={`border px-3 py-2 text-center font-mono text-xs tracking-wide transition-colors ${
                          selectedSize === size ? "border-gold bg-gold text-black" : "border-gold/25 bg-gold/5 text-white/80 hover:border-gold/60"
                        }`}
                      >
                        {size} cm
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === "custom" ? "" : "custom")}
                    aria-pressed={selectedSize === "custom"}
                    className={`mt-2 flex w-full items-center justify-center border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      selectedSize === "custom" ? "border-gold bg-gold text-black" : "border-gold/35 bg-gold/5 text-gold hover:border-gold"
                    }`}
                  >
                    Tamanho personalizado
                  </button>

                  {selectedSize === "custom" ? (
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2" role="group" aria-label="Medida personalizada">
                      <label className="text-xs text-white/60">
                        <span className="mb-1.5 block">Largura</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customWidth}
                          onChange={(event) => setCustomWidth(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))}
                          placeholder="Ex.: 72"
                          className="w-full border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-gold"
                        />
                      </label>
                      <span className="pb-2.5 text-xs text-white/35">×</span>
                      <label className="text-xs text-white/60">
                        <span className="mb-1.5 block">Altura</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customHeight}
                          onChange={(event) => setCustomHeight(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))}
                          placeholder="Ex.: 110"
                          className="w-full border border-white/15 bg-black/35 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-gold"
                        />
                      </label>
                      <span className="pb-2.5 text-xs text-white/35">cm</span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-5">
                  <button
                    type="button"
                    onClick={addToSelection}
                    disabled={selected && !selectionChanged}
                    className={`flex w-full items-center justify-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                      selected && !selectionChanged ? "border border-gold/50 bg-gold/10 text-gold" : "bg-gold text-black hover:bg-[#c9a85d]"
                    }`}
                  >
                    {selected && !selectionChanged ? <Check size={15} /> : <ListPlus size={15} />}
                    {selected && !selectionChanged ? "Na minha seleção" : selected ? "Atualizar tamanho" : "Adicionar à seleção"}
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

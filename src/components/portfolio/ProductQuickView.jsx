import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ListPlus, Ruler, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import { commercialClient } from "@/api/commercialClient";
import ShareArtworkButton from "@/components/portfolio/ShareArtworkButton";

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
          className="fixed inset-0 z-[80] overflow-y-auto bg-ink/70 p-3 font-sans text-ink backdrop-blur-sm sm:p-6"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center">
            <motion.article
              role="dialog"
              aria-modal="true"
              aria-label={`Detalhes do quadro ${image.code}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22 }}
              className="relative grid w-full max-w-5xl overflow-hidden bg-white shadow-2xl lg:grid-cols-[1.15fr_0.85fr]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center bg-white/90 text-ink transition-colors hover:bg-paper"
                aria-label="Fechar detalhes"
              >
                <X size={22} />
              </button>

              <div className="flex min-h-[44vh] items-center justify-center bg-paper p-4 sm:p-8 lg:min-h-[68vh]">
                <img
                  src={image.image_url}
                  alt={image.title || `Quadro ${image.code}`}
                  draggable={false}
                  onContextMenu={(event) => event.preventDefault()}
                  className="max-h-[64vh] max-w-full object-contain"
                />
              </div>

              <div className="flex flex-col p-6 sm:p-8">
                <p className="text-sm text-stone">{categoryName || "Catálogo Imagem Fit"}</p>
                <h2 className="font-display mt-1 pr-10 text-4xl font-semibold leading-tight">{image.code}</h2>
                {image.title && image.title !== image.code ? <p className="mt-1 text-stone">{image.title}</p> : null}

                <div className="mt-7 border-t border-line pt-6">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Ruler size={18} className="text-brass" /> Tamanho <span className="font-normal text-stone">(opcional)</span>
                  </h3>
                  <p className="mt-1 text-sm text-stone">Também fazemos medidas personalizadas.</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {FRAME_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                        aria-pressed={selectedSize === size}
                        className={`h-11 border text-sm font-semibold transition-colors ${
                          selectedSize === size ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === "custom" ? "" : "custom")}
                    aria-pressed={selectedSize === "custom"}
                    className={`mt-2 h-11 w-full border text-sm font-semibold transition-colors ${
                      selectedSize === "custom" ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                    }`}
                  >
                    Outra medida
                  </button>

                  {selectedSize === "custom" ? (
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2" role="group" aria-label="Medida personalizada">
                      <label className="text-sm text-stone">
                        <span className="mb-1.5 block">Largura</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customWidth}
                          onChange={(event) => setCustomWidth(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))}
                          placeholder="72"
                          className="h-11 w-full border border-line bg-white px-3 text-ink outline-none transition-colors placeholder:text-stone/50 focus:border-ink"
                        />
                      </label>
                      <span className="pb-3 text-stone">×</span>
                      <label className="text-sm text-stone">
                        <span className="mb-1.5 block">Altura</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customHeight}
                          onChange={(event) => setCustomHeight(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 6))}
                          placeholder="110"
                          className="h-11 w-full border border-line bg-white px-3 text-ink outline-none transition-colors placeholder:text-stone/50 focus:border-ink"
                        />
                      </label>
                      <span className="pb-3 text-sm text-stone">cm</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-7">
                  <button
                    type="button"
                    onClick={addToSelection}
                    disabled={selected && !selectionChanged}
                    className={`flex h-12 min-w-0 items-center justify-center gap-2 px-2 text-sm font-semibold transition-colors ${
                      selected && !selectionChanged ? "border border-brass bg-brass/10 text-brass" : "bg-ink text-paper hover:bg-brass"
                    }`}
                  >
                    {selected && !selectionChanged ? <Check size={17} /> : <ListPlus size={17} />}
                    {selected && !selectionChanged ? "Na seleção" : selected ? "Atualizar" : "Selecionar"}
                  </button>
                  <ShareArtworkButton image={image} className="flex h-12 min-w-0 items-center justify-center gap-2 border border-ink/25 px-2 text-sm font-semibold transition-colors hover:border-ink disabled:opacity-50" />
                </div>
              </div>
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

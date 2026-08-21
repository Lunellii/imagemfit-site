import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ListPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import ProductQuickView from "@/components/portfolio/ProductQuickView";

export default function NewArrivalsCarousel({ images, isFallback = false }) {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const { addItem, isInCart, syncItems } = useCart();

  useEffect(() => {
    syncItems(
      images.map((image) => ({
        id: image.id,
        title: image.title,
        category: image.category_name || image.category || ""
      }))
    );
  }, [images, syncItems]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: direction === "left" ? -width : width, behavior: "smooth" });
  };

  const startMouseDrag = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !scrollRef.current || event.target.closest("[data-no-drag='true']")) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: scrollRef.current.scrollLeft
    };
  };

  const moveMouseDrag = (event) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const distance = event.clientX - dragRef.current.startX;
    if (Math.abs(distance) > 4 && !dragRef.current.moved) {
      dragRef.current.moved = true;
      scrollRef.current.setPointerCapture?.(event.pointerId);
    }
    scrollRef.current.scrollLeft = dragRef.current.scrollLeft - distance;
  };

  const endMouseDrag = (event) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (scrollRef.current?.hasPointerCapture?.(event.pointerId)) {
      scrollRef.current.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  };

  const addToSelection = (image, event) => {
    event?.stopPropagation();
    if (isInCart(image.id)) {
      toast({ title: `#${image.code} já está na sua seleção` });
      return;
    }
    addItem({
      id: image.id,
      code: image.code,
      title: image.title,
      image_url: image.image_url,
      category: image.category_name || image.category || ""
    });
    toast({ title: `#${image.code} adicionado à sua seleção` });
  };

  if (!images.length) return null;

  return (
    <section className="relative mb-14 overflow-hidden border border-gold/30 bg-gradient-to-br from-gold/10 via-[#181818] to-[#111] px-5 py-7 sm:px-7 sm:py-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mb-7 flex items-end justify-between gap-5">
        <div className="max-w-2xl">
          <h3 className="font-heading text-3xl font-semibold text-white md:text-4xl">Novidades no catálogo</h3>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll("left")} aria-label="Ver novidades anteriores" className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => scroll("right")} aria-label="Ver próximas novidades" className="flex h-9 w-9 items-center justify-center border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onPointerDown={startMouseDrag}
        onPointerMove={moveMouseDrag}
        onPointerUp={endMouseDrag}
        onPointerCancel={endMouseDrag}
        className="relative flex cursor-grab select-none gap-4 overflow-x-auto pb-2 active:cursor-grabbing scrollbar-hide"
      >
        {images.map((image) => {
          const selected = isInCart(image.id);
          return (
            <motion.article key={image.id} whileHover={{ y: -5 }} className="group w-56 flex-shrink-0 sm:w-60">
              <div className="relative overflow-hidden border border-white/10 bg-card transition-colors group-hover:border-gold/40">
                <button type="button" onClick={() => { if (!dragRef.current.moved) setSelectedImage(image); }} className="block aspect-[4/3] w-full overflow-hidden bg-[#0c0c0c]" aria-label={`Ver detalhes do quadro ${image.code}`}>
                  <img src={image.image_url} alt={image.title || image.code} loading="lazy" decoding="async" draggable={false} onContextMenu={(event) => event.preventDefault()} className="h-full w-full object-contain p-1 transition-transform duration-700 group-hover:scale-[1.035]" />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{image.title || image.code}</p>
                    {(image.category_name || image.category) ? <p className="mt-0.5 truncate text-xs text-white/45">{image.category_name || image.category}</p> : null}
                  </div>
                  <p className="font-mono text-xs tracking-wider text-gold">#{image.code}</p>
                </div>
                <button type="button" data-no-drag="true" onClick={(event) => addToSelection(image, event)} className={`flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? "border border-gold/50 bg-gold/10 text-gold" : "bg-gold text-black hover:bg-[#c9a85d]"}`}>
                  {selected ? <Check size={12} /> : <ListPlus size={12} />}
                  {selected ? "Na seleção" : "Adicionar à seleção"}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <ProductQuickView image={selectedImage} categoryName={selectedImage?.category_name || selectedImage?.category || ""} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

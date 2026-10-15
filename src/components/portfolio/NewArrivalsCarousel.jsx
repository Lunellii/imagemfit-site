import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ListPlus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import ProductQuickView from "@/components/portfolio/ProductQuickView";
import ShareArtworkButton from "@/components/portfolio/ShareArtworkButton";

export default function NewArrivalsCarousel({ images }) {
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
    <section className="mb-16">
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Novidades</h2>
          <p className="mt-1 text-stone">As últimas peças adicionadas ao catálogo.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll("left")} aria-label="Ver novidades anteriores" className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-ink">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => scroll("right")} aria-label="Ver próximas novidades" className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-ink">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onPointerDown={startMouseDrag}
        onPointerMove={moveMouseDrag}
        onPointerUp={endMouseDrag}
        onPointerCancel={endMouseDrag}
        className="flex cursor-grab select-none gap-5 overflow-x-auto pb-2 active:cursor-grabbing scrollbar-hide"
      >
        {images.map((image) => {
          const selected = isInCart(image.id);
          return (
            <article key={image.id} className="group w-60 flex-shrink-0 sm:w-64">
              <button type="button" onClick={() => { if (!dragRef.current.moved) setSelectedImage(image); }} className="block aspect-[4/3] w-full overflow-hidden bg-line" aria-label={`Ver detalhes do quadro ${image.code}`}>
                <img src={image.image_url} alt={image.title || image.code} loading="lazy" decoding="async" draggable={false} onContextMenu={(event) => event.preventDefault()} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              </button>
              <div className="mt-3 flex items-baseline justify-between gap-2">
                <p className="truncate font-semibold">{image.code}</p>
                {(image.category_name || image.category) ? <p className="truncate text-sm text-stone">{image.category_name || image.category}</p> : null}
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button type="button" data-no-drag="true" onClick={(event) => addToSelection(image, event)} aria-label={`${selected ? "Já está na seleção" : "Adicionar à seleção"}: quadro ${image.code}`} className={`flex h-11 min-w-0 items-center justify-center gap-1.5 px-2 text-sm font-semibold transition-colors ${selected ? "border border-brass bg-brass/10 text-brass" : "bg-ink text-paper hover:bg-brass"}`}>
                  {selected ? <Check size={16} /> : <ListPlus size={16} />}
                  {selected ? "Na seleção" : "Selecionar"}
                </button>
                <ShareArtworkButton image={image} compact />
              </div>
            </article>
          );
        })}
      </div>

      <ProductQuickView image={selectedImage} categoryName={selectedImage?.category_name || selectedImage?.category || ""} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ListPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import ProductQuickView from "@/components/portfolio/ProductQuickView";

export default function NewArrivalsCarousel({ images }) {
  const scrollRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { addItem, isInCart } = useCart();

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: direction === "left" ? -width : width, behavior: "smooth" });
  };

  const addToSelection = (image, event) => {
    event?.stopPropagation();
    if (isInCart(image.id)) {
      toast({ title: `#${image.code} já está na sua seleção` });
      return;
    }
    addItem({ id: image.id, code: image.code, title: image.title, image_url: image.image_url });
    toast({ title: `#${image.code} adicionado à sua seleção` });
  };

  if (!images.length) return null;

  return (
    <section className="mb-8 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">Recém adicionados</span>
          <h3 className="font-heading text-2xl font-semibold text-white md:text-3xl">Lançamentos para sua loja</h3>
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

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((image) => {
          const selected = isInCart(image.id);
          return (
            <motion.article key={image.id} whileHover={{ y: -5 }} className="group w-56 flex-shrink-0 sm:w-60">
              <div className="relative overflow-hidden border border-white/10 bg-card transition-colors group-hover:border-gold/40">
                <button type="button" onClick={() => setSelectedImage(image)} className="block w-full" aria-label={`Ver detalhes do quadro ${image.code}`}>
                  <img src={image.image_url} alt={image.title || image.code} loading="lazy" decoding="async" draggable={false} onContextMenu={(event) => event.preventDefault()} className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.035]" />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{image.title || image.code}</p>
                  <p className="font-mono text-xs tracking-wider text-gold">#{image.code}</p>
                </div>
                <button type="button" onClick={(event) => addToSelection(image, event)} className={`flex w-full items-center justify-center gap-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? "border border-gold/50 bg-gold/10 text-gold" : "bg-gold text-black hover:bg-[#c9a85d]"}`}>
                  {selected ? <Check size={12} /> : <ListPlus size={12} />}
                  {selected ? "Na seleção" : "Adicionar à seleção"}
                </button>
              </div>
            </motion.article>
          );
        })}
      </div>

      <ProductQuickView image={selectedImage} onClose={() => setSelectedImage(null)} />
    </section>
  );
}

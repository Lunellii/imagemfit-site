import { useRef } from "react";
import { ShoppingCart, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";

export default function NewArrivalsCarousel({ images }) {
  const scrollRef = useRef(null);
  const { addItem, isInCart } = useCart();

  const scroll = (dir) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: dir === "left" ? -width : width, behavior: "smooth" });
    }
  };

  const addToCart = (img, e) => {
    e?.stopPropagation();
    if (isInCart(img.id)) {
      toast({ title: `#${img.code} já está no carrinho` });
      return;
    }
    addItem({ id: img.id, code: img.code, title: img.title, image_url: img.image_url });
    toast({ title: `✓ #${img.code} adicionado!` });
  };

  if (!images.length) return null;

  return (
    <section className="py-12 mb-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-2">Recém adicionados</span>
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-white">Novidades do portfólio</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 border border-white/20 flex items-center justify-center text-white/60 hover:border-gold hover:text-gold transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {images.map((img) => (
          <motion.div key={img.id} whileHover={{ y: -6 }} className="flex-shrink-0 w-56 sm:w-60 group">
            <div className="overflow-hidden bg-card">
              <img
                src={img.image_url}
                alt={img.title || img.code}
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-foreground text-sm font-medium truncate">{img.title || img.code}</p>
              <p className="text-gold text-xs font-mono mt-0.5 tracking-wider">#{img.code}</p>
              <button
                onClick={(e) => addToCart(img, e)}
                className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 font-medium transition-all ${
                  isInCart(img.id) ? "bg-gold/80 text-black" : "bg-gold text-black hover:bg-gold/80"
                }`}
              >
                {isInCart(img.id) ? (
                  <>
                    <Check size={11} /> No carrinho
                  </>
                ) : (
                  <>
                    <ShoppingCart size={11} /> Adicionar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

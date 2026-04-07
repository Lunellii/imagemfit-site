import { useState, useEffect } from "react";
import { localClient } from "@/api/localClient";
import { motion } from "framer-motion";
import { Loader2, ShoppingCart, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useCart } from "@/hooks/useCart";
import NewArrivalsCarousel from "@/components/portfolio/NewArrivalsCarousel";

const ARTIST_PHOTO = "https://picsum.photos/seed/ifq-artista/1200/1600";
const ARTIST_CATEGORY_NAMES = ["pinturas manuais", "tridimensional"];

export default function Artista() {
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, isInCart } = useCart();

  useEffect(() => {
    const load = async () => {
      const [cats, allImgs, newImgs] = await Promise.all([
        localClient.entities.Category.list("name", 100),
        localClient.entities.PortfolioImage.list("-created_date", 1000),
        localClient.entities.PortfolioImage.list("-created_date", 20)
      ]);

      const artistCatIds = cats.filter((c) => ARTIST_CATEGORY_NAMES.includes(c.name.toLowerCase())).map((c) => c.id);
      const artistImgs = allImgs.filter((img) => artistCatIds.includes(img.category_id));

      setImages(artistImgs);
      setNewImages(newImgs.filter((img) => artistCatIds.includes(img.category_id)));
      setLoading(false);
    };
    load();
  }, []);

  const addToCart = (img, e) => {
    e?.stopPropagation();
    if (isInCart(img.id)) {
      toast({ title: `#${img.code} já está no carrinho` });
      return;
    }
    addItem({ id: img.id, code: img.code, title: img.title, image_url: img.image_url });
    toast({ title: `#${img.code} adicionado ao carrinho!` });
  };

  return (
    <div className="pt-28 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="relative">
              <div className="overflow-hidden">
                <img src={ARTIST_PHOTO} alt="Almir Donizete Gonçalves" className="w-full h-auto" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-28 h-28 border border-gold/30 hidden sm:block" />
              <div className="absolute -top-5 -left-5 w-16 h-16 border border-gold/20 hidden sm:block" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">O Artista</span>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                Almir
                <br />
                <span className="text-gold">Gonçalves</span>
              </h1>
              <div className="gold-line w-16 mb-7" />
              <div className="space-y-4 text-white/60 text-sm leading-relaxed">
                <p>
                  Artista plástico contemporâneo cuja produção transita entre o abstrato e o experimental. Utiliza tinta acrílica, colagem e técnicas digitais em
                  composições tridimensionais que exploram cor, textura e profundidade.
                </p>
                <p>
                  Sua obra reflete uma busca constante por novas formas de expressão visual, unindo sensibilidade estética e inovação. Cada peça carrega uma
                  identidade única - fruto da experiência acumulada e de um olhar atento às transformações da arte contemporânea.
                </p>
                <p>
                  É também fundador da <strong className="text-gold">Imagem Fit Quadros</strong>, empresa dedicada a levar arte e decoração personalizada para ambientes
                  residenciais e comerciais.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gold/20 pt-8">
                {[
                  { n: "10+", l: "Anos de experiência" },
                  { n: "500+", l: "Obras criadas" },
                  { n: "300+", l: "Clientes satisfeitos" }
                ].map((s) => (
                  <div key={s.l}>
                    <p className="font-heading text-3xl font-bold text-gold">{s.n}</p>
                    <p className="text-white/40 text-xs mt-1 leading-tight">{s.l}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {newImages.length > 0 && <NewArrivalsCarousel images={newImages} />}

        <section className="mt-8">
          <div className="mb-10">
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Pinturas Manuais & Tridimensional</span>
            <h2 className="font-heading text-3xl font-bold text-white mb-2">Obras do Artista</h2>
            <div className="gold-line w-16 mb-2" />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-gold" />
            </div>
          ) : images.length === 0 ? (
            <div className="border border-dashed border-gold/20 py-20 text-center">
              <p className="text-white/40 text-sm">Nenhuma imagem encontrada nas categorias de pinturas manuais e tridimensional.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  className="break-inside-avoid group bg-card mb-4 overflow-hidden"
                >
                  <img src={img.image_url} alt={img.title || img.code} className="w-full h-auto" />
                  <div className="p-3 border-t border-white/10">
                    <p className="text-gold text-xs font-mono">#{img.code}</p>
                    <button
                      onClick={(e) => addToCart(img, e)}
                      className={`mt-2 w-full flex items-center justify-center gap-1.5 text-xs py-1.5 transition-colors ${
                        isInCart(img.id) ? "bg-gold/30 text-gold border border-gold" : "bg-gold text-black hover:bg-gold/90"
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
          )}
        </section>
      </div>
    </div>
  );
}

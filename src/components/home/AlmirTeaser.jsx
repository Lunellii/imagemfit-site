import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ARTIST_PHOTO = `${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png`;

export default function AlmirTeaser() {
  return (
    <section className="py-20 px-6 bg-black/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative overflow-hidden aspect-[3/4] sm:aspect-[4/5] md:aspect-[3/4] bg-black/40">
            <img src={ARTIST_PHOTO} alt="Almir Donizete Gonçalves" className="w-full h-full object-contain md:object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent hidden md:block" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
            <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">Obras autorais</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Almir <span className="text-gold italic">Gonçalves</span>
            </h2>
            <div className="gold-line w-16 mb-6" />
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Uma linha autoral de pinturas manuais e composições tridimensionais assinadas por Almir Gonçalves para diferenciar o mix da sua loja.
            </p>
            <p className="text-white/50 text-sm leading-relaxed mb-8">
              São peças com textura, presença visual e alto valor artístico para clientes que procuram algo mais exclusivo.
            </p>
            <Link
              to="/artista"
              className="inline-flex items-center gap-3 border border-gold text-gold px-8 py-3.5 text-xs tracking-[0.3em] uppercase font-medium hover:bg-gold hover:text-black transition-all duration-300"
            >
              Conhecer a linha autoral <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

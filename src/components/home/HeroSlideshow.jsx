import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const heroBase = `${import.meta.env.BASE_URL}hero/`;

const SLIDES = [
  {
    url: `${heroBase}gallery-home-1.jpg`,
    label: "Galeria Contemporânea"
  },
  {
    url: `${heroBase}gallery-home-2.jpg`,
    label: "Curadoria Exclusiva"
  },
  {
    url: `${heroBase}gallery-home-3.jpg`,
    label: "Arte em Destaque"
  }
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img src={SLIDES[current].url} alt={SLIDES[current].label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <motion.span key={`label-${current}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-gold text-xs tracking-[0.5em] uppercase font-medium mb-4 block">
          {SLIDES[current].label}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.9 }}
          className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4"
        >
          Quadros que
          <br />
          <span className="text-gold italic">transformam</span> seu ambiente
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="text-white/70 text-sm md:text-base mb-3 font-light">
          Escolha pelo código e peça pelo WhatsApp
        </motion.p>
        <motion.div className="gold-line w-24 mx-auto mb-8" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Link to="/portfolio" className="inline-flex items-center gap-2 bg-gold text-black px-8 py-4 text-xs tracking-[0.3em] uppercase font-semibold hover:bg-gold/90 transition-colors">
            Ver Portfólio <ChevronRight size={14} />
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`transition-all duration-300 h-0.5 ${i === current ? "w-8 bg-gold" : "w-3 bg-white/30"}`} />
        ))}
      </div>
    </section>
  );
}

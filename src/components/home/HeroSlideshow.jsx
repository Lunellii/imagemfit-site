import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronDown, Store } from "lucide-react";

const heroBase = `${import.meta.env.BASE_URL}hero/`;
const HERO_VERSION = "20260716-mobile-hq";

const SLIDES = [
  {
    url: `${heroBase}gallery-home-1.jpg?v=${HERO_VERSION}`,
    mobileUrl: `${heroBase}gallery-home-1-mobile.jpg?v=${HERO_VERSION}`,
    label: "Galeria contemporânea",
    caption: "Composições que mudam a leitura do ambiente"
  },
  {
    url: `${heroBase}gallery-home-2.jpg?v=${HERO_VERSION}`,
    mobileUrl: `${heroBase}gallery-home-2-mobile.jpg?v=${HERO_VERSION}`,
    label: "Curadoria por estilo",
    caption: "Escolhas pensadas para cada espaço"
  },
  {
    url: `${heroBase}gallery-home-3.jpg?v=${HERO_VERSION}`,
    mobileUrl: `${heroBase}gallery-home-3-mobile.jpg?v=${HERO_VERSION}`,
    label: "Arte com presença",
    caption: "Quadros, espelhos e peças autorais"
  }
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % SLIDES.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const useMobileImages = window.matchMedia("(max-width: 1023px)").matches;

    SLIDES.forEach((slide) => {
      const image = new Image();
      image.decoding = "async";
      image.src = useMobileImages ? slide.mobileUrl : slide.url;
    });
  }, []);

  return (
    <section className="hero-section relative min-h-[720px] overflow-hidden bg-[#090909] pt-20 lg:h-[100svh]">
      <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <picture className="block h-full w-full">
              <source media="(max-width: 1023px)" srcSet={SLIDES[current].mobileUrl} />
              <img
                src={SLIDES[current].url}
                alt={SLIDES[current].label}
                loading={current === 0 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/70 lg:bg-gradient-to-r lg:from-[#090909] lg:via-black/25 lg:to-black/10" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-[#090909] lg:hidden" />

      <div className="hero-content relative z-10 mx-auto flex min-h-[640px] max-w-7xl items-center px-6 pb-28 pt-10 lg:h-[calc(100svh-5rem)] lg:min-h-[640px] lg:pb-28">
        <div className="max-w-3xl lg:w-[58%]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="hero-kicker mb-7 flex items-center gap-4"
          >
            <span className="h-px w-12 bg-gold" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold sm:text-sm">
              Catálogo exclusivo para lojistas
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="hero-heading max-w-2xl font-heading text-[3.35rem] font-medium leading-[0.94] text-white sm:text-7xl lg:text-[5.25rem] xl:text-[5.5rem]"
          >
            Um portfólio feito <span className="block italic text-gold">para o seu negócio.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="hero-copy mt-7 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Quadros decorativos, espelhos, obras autorais e produtos personalizados para ampliar o mix da sua loja. Escolha por código, monte sua seleção e fale com nosso atendimento comercial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.7 }}
            className="hero-actions mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/portfolio"
              className="inline-flex items-center justify-center gap-3 bg-gold px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#c9a85d]"
            >
              Explorar o catálogo <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/parceiros"
              className="inline-flex items-center justify-center gap-3 border border-white/30 bg-black/25 px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold"
            >
              <Store size={15} /> Para lojistas
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-stretch px-6">
          <div className="hidden flex-1 grid-cols-3 divide-x divide-white/10 lg:grid">
            {[
              ["01", "Explore por categoria"],
              ["02", "Monte a seleção da loja"],
              ["03", "Solicite condições comerciais"]
            ].map(([number, text]) => (
              <div key={number} className="flex items-center gap-4 py-5 pl-6 pr-6 first:pl-0">
                <span className="font-heading text-2xl italic text-gold">{number}</span>
                <span className="text-[10px] uppercase leading-relaxed tracking-[0.18em] text-white/55">{text}</span>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 py-4 lg:border-l lg:border-white/10 lg:pl-8">
            <div className="mr-2 text-right">
              <AnimatePresence mode="wait">
                <motion.p key={current} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] uppercase tracking-[0.2em] text-white/65">
                  {SLIDES[current].caption}
                </motion.p>
              </AnimatePresence>
            </div>
            {SLIDES.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Mostrar imagem ${index + 1}: ${slide.label}`}
                aria-pressed={index === current}
                className={`h-10 w-10 border text-xs font-semibold transition-colors ${
                  index === current ? "border-gold bg-gold text-black" : "border-white/20 text-white/50 hover:border-white/50 hover:text-white"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-discover absolute bottom-24 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 text-white/55"
        >
          <ChevronDown size={20} className="text-gold" />
          <span className="text-xs font-semibold uppercase tracking-[0.28em]">Descubra</span>
        </motion.div>
      </div>
    </section>
  );
}

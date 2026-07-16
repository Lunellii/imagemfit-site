import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brush, Eye, Frame, Image as ImageIcon, Sparkles } from "lucide-react";

const ORIGINAL_IMAGE = `${import.meta.env.BASE_URL}special/familia-foto-original.jpeg`;
const ARTWORK_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;
const WHATSAPP_URL =
  "https://wa.me/5547999273809?text=Ol%C3%A1%21%20Gostaria%20de%20transformar%20uma%20foto%20da%20minha%20fam%C3%ADlia%20em%20um%20quadro%20abstrato%20personalizado.";

const details = [
  { icon: ImageIcon, label: "Criado a partir da sua fotografia" },
  { icon: Brush, label: "Arte digital exclusiva e personalizada" },
  { icon: Frame, label: "Canvas em moldura de madeira flutuante" }
];

export default function PersonalizedFamilyArt() {
  const [activeImage, setActiveImage] = useState("artwork");
  const originalIsActive = activeImage === "original";

  return (
    <section className="relative overflow-hidden border-y border-gold/20 bg-[#0b0b0b] py-20 md:py-28">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#0877b8]/10 blur-3xl" />
      <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#ff4f87]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto aspect-[10/11] w-full max-w-[680px]"
        >
          <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 overflow-hidden border border-white/20 bg-black/85 p-1 shadow-xl backdrop-blur-md sm:top-5">
            <button
              type="button"
              onClick={() => setActiveImage("original")}
              aria-pressed={originalIsActive}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] transition-colors sm:px-4 sm:text-[10px] ${
                originalIsActive ? "bg-gold text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Eye size={13} /> Foto original
            </button>
            <button
              type="button"
              onClick={() => setActiveImage("artwork")}
              aria-pressed={!originalIsActive}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors sm:px-4 sm:text-[10px] ${
                !originalIsActive ? "bg-gold text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Eye size={13} /> Arte final
            </button>
          </div>

          <motion.button
            type="button"
            onClick={() => setActiveImage("original")}
            animate={{
              left: originalIsActive ? "0%" : "28%",
              top: originalIsActive ? "10%" : "0%",
              scale: originalIsActive ? 1 : 0.95,
              zIndex: originalIsActive ? 20 : 10
            }}
            transition={{ type: "spring", stiffness: 170, damping: 21 }}
            className={`absolute w-[72%] overflow-hidden bg-black text-left shadow-2xl shadow-black/70 ${
              originalIsActive ? "border-[5px] border-[#151515] sm:border-[8px]" : "border border-white/10"
            }`}
            aria-label="Trazer a foto original para frente"
          >
            <div className="absolute left-4 top-4 z-10 bg-black/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm">
              Foto original
            </div>
            <img
              src={ORIGINAL_IMAGE}
              alt="Fotografia original de uma família sorrindo"
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] h-full w-full object-cover"
            />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setActiveImage("artwork")}
            animate={{
              left: originalIsActive ? "28%" : "0%",
              top: originalIsActive ? "0%" : "0%",
              scale: originalIsActive ? 0.95 : 1,
              zIndex: originalIsActive ? 10 : 20
            }}
            transition={{ type: "spring", stiffness: 170, damping: 21 }}
            className={`absolute w-[72%] overflow-hidden bg-black text-left shadow-2xl shadow-black/80 ${
              !originalIsActive ? "border-[5px] border-[#151515] sm:border-[8px]" : "border border-white/10"
            }`}
            aria-label="Trazer a arte final para frente"
          >
            <div className="absolute left-3 top-3 z-10 bg-gold px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-black sm:left-4 sm:top-4">
              Obra final
            </div>
            <img
              src={ARTWORK_IMAGE}
              alt="Quadro abstrato colorido criado a partir da fotografia da família"
              loading="lazy"
              decoding="async"
              className="aspect-[2/3] h-full w-full object-cover"
            />
          </motion.button>

          <div className="absolute bottom-2 right-0 z-30 flex h-24 w-24 items-center justify-center border border-gold/40 bg-[#151515] text-center sm:bottom-4 sm:h-28 sm:w-28">
            <div>
              <Sparkles className="mx-auto mb-2 text-gold" size={18} />
              <span className="block text-[9px] uppercase leading-relaxed tracking-[0.2em] text-white/65">
                Memória em arte
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.12 }}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-black">
              Novidade
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-white/45">Arte sob encomenda</span>
          </div>

          <h2 className="font-heading text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-[3.45rem]">
            Sua família transformada em uma <span className="italic text-gold">obra de arte</span>
          </h2>
          <div className="gold-line my-7 w-24" />

          <p className="mb-5 text-base leading-relaxed text-white/72">
            Este trabalho vai além da reprodução de uma fotografia. Cada arte é criada digitalmente para se tornar um quadro exclusivo, preservando a essência da imagem e acrescentando personalidade, cor e sofisticação.
          </p>
          <p className="mb-8 text-sm leading-relaxed text-white/55">
            A composição combina referências de pintura a óleo, aquarela e pinceladas abstratas. O resultado é uma obra contemporânea, desenvolvida para eternizar memórias e levar beleza, significado e identidade ao ambiente.
          </p>

          <ul className="mb-9 space-y-3 border-l border-gold/35 pl-5">
            {details.map((detail) => (
              <li key={detail.label} className="flex items-center gap-3 text-sm text-white/70">
                <detail.icon className="shrink-0 text-gold" size={16} strokeWidth={1.7} />
                <span>{detail.label}</span>
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 border border-gold bg-gold px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-black transition-colors duration-300 hover:bg-transparent hover:text-gold"
          >
            Quero transformar minha foto <ArrowRight size={15} />
          </a>

          <p className="mt-5 text-xs leading-relaxed text-white/38">
            Impressão em alta definição no canvas, com acabamento em moldura de madeira flutuante.
          </p>
        </motion.div>
      </div>

    </section>
  );
}

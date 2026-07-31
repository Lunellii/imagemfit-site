import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Brush, Eye, Frame, Image as ImageIcon, Sparkles } from "lucide-react";

const ORIGINAL_IMAGE = `${import.meta.env.BASE_URL}special/familia-foto-original.jpeg`;
const ARTWORK_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;

const details = [
  { icon: ImageIcon, label: "Produção sob encomenda, sem necessidade de estoque" },
  { icon: Brush, label: "Arte exclusiva criada a partir da fotografia do cliente" },
  { icon: Frame, label: "Canvas com moldura flutuante, pronto para venda" }
];

export default function PersonalizedFamilyArt() {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <section className="relative overflow-hidden border-y border-gold/25 bg-[#0b0b0b] px-6 py-16 md:py-20">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-gold/5 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="mx-auto w-full max-w-xl">
          <div className="mb-3 grid grid-cols-2 border border-white/15 bg-black p-1">
            <button type="button" onClick={() => setShowOriginal(true)} className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${showOriginal ? "bg-gold text-black" : "text-white/65 hover:text-white"}`}>
              <Eye size={14} /> Foto original
            </button>
            <button type="button" onClick={() => setShowOriginal(false)} className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${!showOriginal ? "bg-gold text-black" : "text-white/65 hover:text-white"}`}>
              <Sparkles size={14} /> Arte final
            </button>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black">
            <motion.img
              key={showOriginal ? "original" : "artwork"}
              initial={{ opacity: 0.25, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              src={showOriginal ? ORIGINAL_IMAGE : ARTWORK_IMAGE}
              alt={showOriginal ? "Fotografia original enviada pelo cliente" : "Quadro personalizado criado a partir da fotografia"}
              loading="lazy"
              className="h-full w-full object-contain"
            />
            <span className="absolute bottom-4 left-4 bg-black/80 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">{showOriginal ? "Foto enviada" : "Resultado final"}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <span className="inline-flex items-center gap-2 bg-gold px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black"><Sparkles size={14} /> Produto personalizado</span>
          <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Transforme uma fotografia em uma <span className="italic text-gold">obra exclusiva.</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            A loja envia a fotografia do cliente e a Imagem Fit cuida da criação artística e da produção do quadro.
          </p>
          <ul className="mt-7 space-y-3 border-l-2 border-gold/40 pl-5">
            {details.map((detail) => (
              <li key={detail.label} className="flex items-center gap-3 text-sm leading-relaxed text-white/70">
                <detail.icon className="shrink-0 text-gold" size={17} />
                <span>{detail.label}</span>
              </li>
            ))}
          </ul>
          <Link to="/parceiros" className="mt-8 inline-flex items-center justify-center gap-3 border border-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-black">
            Conhecer como funciona <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

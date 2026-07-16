import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Brush, Eye, Frame, Image as ImageIcon, Sparkles, Star } from "lucide-react";

const ORIGINAL_IMAGE = `${import.meta.env.BASE_URL}special/familia-foto-original.jpeg`;
const ARTWORK_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;
const WHATSAPP_URL =
  "https://wa.me/5547999273809?text=Ol%C3%A1%21%20Sou%20lojista%20e%20gostaria%20de%20conhecer%20as%20condi%C3%A7%C3%B5es%20comerciais%20para%20oferecer%20os%20quadros%20abstratos%20personalizados%20de%20fam%C3%ADlia%20aos%20meus%20clientes.";

const details = [
  { icon: ImageIcon, label: "Produto sob encomenda, sem necessidade de estoque" },
  { icon: Brush, label: "Arte exclusiva criada a partir da foto do cliente" },
  { icon: Frame, label: "Canvas com moldura flutuante, pronto para venda" }
];

export default function PersonalizedFamilyArt() {
  const [activeImage, setActiveImage] = useState("artwork");
  const originalIsActive = activeImage === "original";

  return (
    <section className="relative overflow-hidden border-y border-gold/30 bg-[#080808] pb-20 md:pb-28">
      <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#0877b8]/10 blur-3xl" />
      <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#ff4f87]/15 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_38%,rgba(185,144,73,0.10),transparent_34%)]" />

      <div className="relative z-40 overflow-hidden border-b border-gold/30 bg-gold/[0.08]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-7xl items-center justify-center gap-5 px-6 py-4 text-center sm:justify-between"
        >
          <div className="hidden items-center gap-3 sm:flex">
            <Star size={12} className="text-gold" fill="currentColor" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50">Novo produto para o seu mix</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gold/70" />
            <span className="text-[10px] font-bold uppercase tracking-[0.36em] text-gold sm:text-xs">Lançamento para lojistas</span>
            <span className="h-px w-8 bg-gold/70" />
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/50">Produção exclusiva sob encomenda</span>
            <Star size={12} className="text-gold" fill="currentColor" />
          </div>
        </motion.div>
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pt-16 md:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto aspect-[10/11] w-full max-w-[680px] before:absolute before:-inset-4 before:border before:border-gold/15 before:content-[''] sm:before:-inset-7"
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
            <img src={ORIGINAL_IMAGE} alt="Fotografia original de uma família sorrindo" loading="lazy" decoding="async" className="aspect-[3/4] h-full w-full object-cover" />
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setActiveImage("artwork")}
            animate={{
              left: originalIsActive ? "28%" : "0%",
              top: "0%",
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
            <img src={ARTWORK_IMAGE} alt="Quadro abstrato colorido criado a partir da fotografia da família" loading="lazy" decoding="async" className="aspect-[2/3] h-full w-full object-cover" />
          </motion.button>

          <div className="absolute bottom-2 right-0 z-30 flex h-24 w-24 items-center justify-center border border-gold/50 bg-[#151515] text-center shadow-xl sm:bottom-4 sm:h-28 sm:w-28">
            <div>
              <Sparkles className="mx-auto mb-2 text-gold" size={18} />
              <span className="block text-[9px] uppercase leading-relaxed tracking-[0.2em] text-white/65">Memória em arte</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative"
        >
          <span className="pointer-events-none absolute -right-4 -top-20 hidden select-none font-heading text-[7rem] font-bold leading-none text-white/[0.025] lg:block">01</span>

          <div className="mb-5 flex items-center gap-3">
            <span className="flex items-center gap-2 bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-black">
              <Sparkles size={12} /> Novidade para parceiros
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-white/45">Alto valor percebido</span>
          </div>

          <h2 className="font-heading text-4xl font-semibold leading-[1.04] text-white sm:text-5xl lg:text-[3.8rem]">
            Uma novidade exclusiva para valorizar o <span className="italic text-gold">mix da sua loja</span>
          </h2>
          <div className="gold-line my-7 w-24" />

          <p className="mb-5 text-base leading-relaxed text-white/72">
            Amplie seu portfólio com quadros abstratos personalizados de família — um produto emocional, exclusivo e com alto valor percebido para o consumidor final.
          </p>
          <p className="mb-8 text-sm leading-relaxed text-white/55">
            Sua loja recebe a fotografia do cliente e a Imagem Fit cuida da criação artística e da produção. A peça é entregue em canvas com moldura flutuante, pronta para encantar e gerar uma nova oportunidade de venda.
          </p>

          <ul className="mb-9 space-y-3 border-l border-gold/35 pl-5">
            {details.map((detail) => (
              <li key={detail.label} className="flex items-center gap-3 text-sm text-white/70">
                <detail.icon className="shrink-0 text-gold" size={16} strokeWidth={1.7} />
                <span>{detail.label}</span>
              </li>
            ))}
          </ul>

          <div className="border border-gold/25 bg-gold/[0.04] p-4 sm:p-5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-3 border border-gold bg-gold px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition-colors duration-300 hover:bg-transparent hover:text-gold sm:text-xs"
            >
              Quero oferecer na minha loja <ArrowRight size={15} />
            </a>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-white/42">Fale com nossa equipe para conhecer condições comerciais, prazos e materiais disponíveis para parceiros.</p>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs leading-relaxed text-white/38">
            <Star size={11} className="shrink-0 text-gold" /> Produção sob demanda: mais variedade para sua loja, sem formar estoque.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

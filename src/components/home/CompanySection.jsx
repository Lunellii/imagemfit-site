import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";

const FACADE_IMAGE = `${import.meta.env.BASE_URL}company/imagem-fit-fachada.jpg`;
const GALLERY_IMAGE = `${import.meta.env.BASE_URL}company/imagem-fit-galeria.jpeg`;

export default function CompanySection() {
  return (
    <section className="border-t border-white/10 bg-[#0d0d0d] px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="mb-5 flex items-center gap-3 text-gold">
            <MapPin size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em]">Rua São Paulo, 649 · Timbó</span>
          </div>
          <h2 className="font-heading text-4xl font-semibold leading-[1.08] text-white sm:text-5xl">
            Atendimento próximo para apoiar a <span className="italic text-gold">sua loja.</span>
          </h2>
          <p className="mt-7 text-sm leading-relaxed text-white/62 sm:text-base">
            A Imagem Fit reúne quadros decorativos, espelhos, pinturas manuais e produtos especiais para lojistas que buscam variedade e diferenciação.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            Sua loja escolhe os códigos de interesse e nossa equipe apresenta as opções de medidas, molduras, materiais e acabamentos disponíveis para o pedido.
          </p>

          <div className="mt-9 grid grid-cols-2 border-y border-white/10 py-5">
            <div className="border-r border-white/10 pr-5">
              <span className="block font-heading text-2xl italic text-gold">Curadoria</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.22em] text-white/40">para ampliar seu mix</span>
            </div>
            <div className="pl-5">
              <span className="block font-heading text-2xl italic text-gold">Atendimento</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.22em] text-white/40">comercial pelo WhatsApp</span>
            </div>
          </div>

          <Link
            to="/parceiros"
            className="mt-8 inline-flex items-center gap-3 border border-gold px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold transition-colors hover:bg-gold hover:text-black"
          >
            Ver atendimento para lojistas <ArrowRight size={14} />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="relative mx-auto aspect-[5/4] w-full max-w-3xl"
        >
          <div className="absolute right-0 top-0 h-[82%] w-[76%] overflow-hidden">
            <img src={GALLERY_IMAGE} alt="Galeria de quadros da Imagem Fit" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 h-[58%] w-[48%] overflow-hidden border-[6px] border-[#0d0d0d] shadow-2xl sm:border-[10px]">
            <img src={FACADE_IMAGE} alt="Fachada da Imagem Fit Quadros" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div className="absolute bottom-3 right-0 border border-gold/40 bg-black/80 px-5 py-4 backdrop-blur-sm">
            <span className="block text-[9px] uppercase tracking-[0.28em] text-gold">Visite nosso espaço</span>
            <span className="mt-1 block font-heading text-lg text-white">Timbó, Santa Catarina</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, Images, MapPin, Truck } from "lucide-react";

const FACADE_IMAGE = `${import.meta.env.BASE_URL}company/imagem-fit-fachada.jpg`;

export default function CompanySection() {
  return (
    <section className="border-t border-white/10 bg-[#0d0d0d] px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
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
            Atendimento humano para entender a <span className="italic text-gold">sua loja.</span>
          </h2>
          <p className="mt-7 text-sm leading-relaxed text-white/62 sm:text-base">
            Aqui, cada atendimento é próximo, personalizado e feito por pessoas. Nossa equipe entende o seu espaço, o perfil dos seus clientes e ajuda a encontrar os quadros certos para o seu mix.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            Fazemos a simulação do quadro diretamente na parede do cliente, facilitando a escolha de tamanho, composição e acabamento antes do pedido.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.025] p-4">
              <HeartHandshake size={20} className="text-gold" />
              <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/65">Atendimento humanizado</span>
            </div>
            <div className="border border-white/10 bg-white/[0.025] p-4">
              <Images size={20} className="text-gold" />
              <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/65">Simulação na parede</span>
            </div>
            <div className="border border-white/10 bg-white/[0.025] p-4">
              <Truck size={20} className="text-gold" />
              <span className="mt-3 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/65">Atendimento presencial</span>
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
          className="relative mx-auto aspect-[5/4] w-full max-w-3xl overflow-hidden border border-white/10"
        >
          <img src={FACADE_IMAGE} alt="Caminhão da Imagem Fit para atendimento presencial" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <span className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-gold">
              <Truck size={14} /> Nosso catálogo vai até você
            </span>
            <p className="max-w-lg font-heading text-2xl leading-tight text-white sm:text-3xl">Muitas opções de quadros em um atendimento presencial e personalizado.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

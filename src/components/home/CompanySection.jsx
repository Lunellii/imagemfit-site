import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const IMG1 = `${import.meta.env.BASE_URL}company/imagem-fit-fachada.jpg`;
const IMG2 = `${import.meta.env.BASE_URL}company/imagem-fit-galeria.jpeg`;

export default function CompanySection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">Sobre a Imagem Fit</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Um portfólio pensado para <span className="text-gold italic">facilitar</span> sua escolha
          </h2>
          <div className="gold-line w-20 mx-auto mb-8" />
          <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            A <strong className="text-gold">Imagem Fit Quadros</strong> reúne quadros decorativos, espelhos, pinturas manuais e peças especiais para ambientes
            residenciais e comerciais. O site foi organizado para você navegar por categorias, escolher os códigos favoritos e montar uma seleção com calma.
          </p>
          <p className="text-white/50 max-w-2xl mx-auto text-sm leading-relaxed mt-4">
            Depois de escolher, envie o carrinho pelo WhatsApp. A equipe retorna com valores, medidas, molduras e materiais disponíveis para cada modelo,
            ajudando você a encontrar a composição certa para o seu espaço.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="aspect-[4/3] overflow-hidden group">
            <img src={IMG1} alt="Fachada da Imagem Fit Quadros" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="aspect-[4/3] overflow-hidden group"
          >
            <img src={IMG2} alt="Galeria de quadros da Imagem Fit" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </motion.div>
        </div>

        <div className="text-center">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-3 border border-gold text-gold px-10 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-gold hover:text-black transition-all duration-300"
          >
            Ver portfólio completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

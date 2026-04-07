import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const IMG1 = "https://picsum.photos/seed/ifq-company-1/1200/900";
const IMG2 = "https://picsum.photos/seed/ifq-company-2/1200/900";

export default function CompanySection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-4">Nossa História</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Arte que <span className="text-gold italic">transforma</span> ambientes
          </h2>
          <div className="gold-line w-20 mx-auto mb-8" />
          <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            A <strong className="text-gold">Imagem Fit Quadros</strong> nasceu em 2016 da paixão pela decoração de ambientes e pelo significado que a arte pode ter
            na vida das pessoas. Fundada por um casal apaixonado, a empresa acredita que cada quadro representa uma história, uma lembrança especial ou um
            momento que merece ser eternizado.
          </p>
          <p className="text-white/50 max-w-2xl mx-auto text-sm leading-relaxed mt-4">
            Trabalhamos com quadros decorativos, pinturas feitas à mão, peças tridimensionais e espelhos - sempre com atenção aos detalhes e foco no projeto
            personalizado de cada cliente. Nosso objetivo é decorar ambientes, levar arte para as pessoas e eternizar momentos especiais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="aspect-[4/3] overflow-hidden group">
            <img src={IMG1} alt="Galeria de Quadros" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="aspect-[4/3] overflow-hidden group"
          >
            <img src={IMG2} alt="Natureza em Quadros" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </motion.div>
        </div>

        <div className="text-center">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-3 border border-gold text-gold px-10 py-4 text-xs tracking-[0.3em] uppercase font-medium hover:bg-gold hover:text-black transition-all duration-300"
          >
            Ver Portfólio Completo <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

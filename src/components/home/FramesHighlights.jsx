import { motion } from "framer-motion";
import { Frame, Palette, Ruler, Sparkles } from "lucide-react";

const items = [
  {
    icon: Frame,
    title: "Quadros Decorativos",
    text: "Modelos para sala, quarto, escritório e ambientes comerciais."
  },
  {
    icon: Palette,
    title: "Arte Autoral",
    text: "Coleções com estilo moderno, abstrato e artístico."
  },
  {
    icon: Ruler,
    title: "Tamanhos Sob Medida",
    text: "Você escolhe o formato ideal para o seu espaço."
  },
  {
    icon: Sparkles,
    title: "Acabamento Premium",
    text: "Peças com atenção ao detalhe para valorizar o ambiente."
  }
];

export default function FramesHighlights() {
  return (
    <section className="py-20 px-6 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Especialidades</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Quadros que combinam com seu estilo</h2>
          <div className="gold-line w-20 mx-auto mt-5" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="border border-border bg-card p-5 hover:border-gold/50 transition-colors"
            >
              <div className="w-10 h-10 border border-gold/40 flex items-center justify-center text-gold mb-4">
                <item.icon size={16} />
              </div>
              <h3 className="font-heading text-xl text-white mb-2">{item.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

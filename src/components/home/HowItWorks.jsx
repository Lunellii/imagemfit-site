import { motion } from "framer-motion";
import { Search, ShoppingCart, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Pesquise no catálogo",
    desc: "Procure por código, categoria ou estilo e abra os modelos que combinam com o ambiente."
  },
  {
    icon: ShoppingCart,
    number: "02",
    title: "Monte sua seleção",
    desc: 'Clique em "Adicionar" nos quadros desejados. O carrinho guarda os códigos para orçamento.'
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Envie para orçamento",
    desc: "Compartilhe a seleção pelo WhatsApp e receba informações de valores, tamanhos, molduras e materiais."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-black/5">
      <div className="max-w-5xl mx-auto">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-gold text-xs tracking-[0.4em] uppercase font-medium block mb-3">Pedido sem complicação</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">Como pedir orçamento</h2>
          <div className="gold-line w-16 mx-auto mt-5" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center group"
            >
              {i < steps.length - 1 && <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] right-0 h-px bg-gradient-to-r from-gold/40 to-transparent" />}
              <div className="inline-flex items-center justify-center w-16 h-16 border border-gold/40 group-hover:border-gold bg-black/60 mb-5 transition-colors duration-300">
                <step.icon className="text-gold" size={22} />
              </div>
              <span className="block text-gold/30 font-mono text-xs tracking-widest mb-2">{step.number}</span>
              <h3 className="font-heading text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

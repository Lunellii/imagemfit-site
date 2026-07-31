import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Search, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Explore o catálogo",
    desc: "Navegue pelas categorias e abra os produtos que combinam com o perfil da sua loja."
  },
  {
    icon: ShoppingBag,
    number: "02",
    title: "Monte sua seleção",
    desc: "Adicione os códigos de interesse para montar sua seleção de forma simples."
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Fale com o comercial",
    desc: "Compartilhe a seleção e escolha o aplicativo e o contato que deve receber os códigos."
  }
];

export default function HowItWorks() {
  return (
    <section className="bg-[#e9e1d4] px-6 py-20 text-[#171512] md:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#896727]">Compra comercial sem complicação</span>
          <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Do catálogo ao <span className="italic text-[#9b742b]">pedido da sua loja.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-black/58">
            Organize referências, compare códigos e envie sua seleção diretamente para a equipe da Imagem Fit.
          </p>
          <Link
            to="/portfolio"
            className="mt-8 inline-flex items-center gap-3 border-b border-black pb-2 text-[10px] font-bold uppercase tracking-[0.24em] transition-colors hover:border-[#9b742b] hover:text-[#9b742b]"
          >
            Abrir catálogo <ArrowRight size={14} />
          </Link>
        </motion.div>

        <div className="divide-y divide-black/15 border-y border-black/15">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.09 }}
              className="group grid grid-cols-[auto_1fr] items-center gap-5 py-7 sm:grid-cols-[72px_1fr_auto] sm:gap-7"
            >
              <div className="flex h-14 w-14 items-center justify-center border border-black/20 transition-colors group-hover:border-[#9b742b] group-hover:bg-[#9b742b] group-hover:text-white sm:h-16 sm:w-16">
                <step.icon size={20} strokeWidth={1.6} />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#9b742b]">Etapa {step.number}</span>
                <h3 className="mt-1 font-heading text-2xl font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-black/55">{step.desc}</p>
              </div>
              <span className="hidden font-heading text-5xl italic text-black/8 sm:block">{step.number}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    title: "Escolha no catálogo",
    desc: "Navegue pelas categorias e abra as peças que combinam com o perfil da sua loja. Cada uma tem um código."
  },
  {
    title: "Monte sua seleção",
    desc: "Adicione os códigos que interessam. A lista fica salva enquanto você navega."
  },
  {
    title: "Envie para quem quiser",
    desc: "Compartilhe a seleção pelo aplicativo que preferir: com um sócio, um cliente ou com a nossa equipe."
  }
];

export default function HowItWorks() {
  return (
    <section className="border-y border-line bg-white px-5 py-16 text-ink sm:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-display max-w-xl text-4xl font-semibold leading-tight md:text-5xl">Do catálogo ao pedido, em três passos</h2>
          <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brass">
            Abrir o catálogo <ArrowRight size={15} />
          </Link>
        </div>

        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ink pt-5">
              <span className="text-sm font-semibold text-brass">Passo {index + 1}</span>
              <h3 className="font-display mt-2 text-2xl font-semibold">{step.title}</h3>
              <p className="mt-3 max-w-sm leading-relaxed text-stone">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const FACADE_IMAGE = `${import.meta.env.BASE_URL}company/imagem-fit-fachada.jpg`;

const services = [
  { title: "Atendimento presencial", text: "Levamos o catálogo até a sua loja no nosso caminhão." },
  { title: "Simulação na parede", text: "Mostramos o quadro na parede do cliente antes do pedido." },
  { title: "Gente de verdade", text: "Uma equipe que conhece o seu espaço e o seu público." }
];

export default function CompanySection() {
  return (
    <section className="bg-paper text-ink">
      <figure className="relative h-[52vh] min-h-[340px] overflow-hidden md:h-[72vh]">
        <img src={FACADE_IMAGE} alt="Caminhão da Imagem Fit Quadros ao entardecer" loading="lazy" decoding="async" className="h-full w-full object-cover object-[50%_60%]" />
      </figure>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <p className="text-sm text-stone">Rua São Paulo, 649 · Timbó, SC</p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-tight md:text-5xl">O catálogo vai até a sua loja.</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone">
            Cada atendimento é feito por pessoas. A gente entende o seu espaço e o perfil dos seus clientes, e ajuda a escolher os quadros certos para o seu mix.
          </p>
          <Link to="/parceiros" className="mt-8 inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass">
            Atendimento para lojistas <ArrowRight size={16} />
          </Link>
        </div>

        <dl className="divide-y divide-line border-y border-line self-start">
          {services.map((service) => (
            <div key={service.title} className="grid gap-1 py-5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="font-semibold">{service.title}</dt>
              <dd className="text-stone">{service.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

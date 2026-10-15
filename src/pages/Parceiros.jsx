import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HERO_IMAGE = `${import.meta.env.BASE_URL}catalog/abstrato-fluido-e-marmore/ABS_00053.jpg`;
const ARTIST_IMAGE = `${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png`;
const PERSONALIZED_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;
const CATALOG_IMAGE = `${import.meta.env.BASE_URL}catalog/espelhos/SIMU_1562.jpg`;

const productLines = [
  { title: "Quadros e espelhos", text: "Coleções por estilo e ambiente, cada peça com um código.", image: CATALOG_IMAGE, to: "/portfolio" },
  { title: "Obras autorais", text: "Pinturas manuais e peças tridimensionais assinadas por Almir Gonçalves.", image: ARTIST_IMAGE, to: "/artista" },
  { title: "Retratos personalizados", text: "Arte criada a partir da foto que o cliente da sua loja envia.", image: PERSONALIZED_IMAGE, to: "/contato" }
];

const steps = [
  ["Escolha no catálogo", "Navegue pelas categorias e abra as peças que combinam com a sua loja."],
  ["Monte sua seleção", "Adicione os códigos e, se quiser, a medida de cada peça."],
  ["Compartilhe", "Envie a seleção pelo aplicativo e para o contato que preferir."],
  ["Feche o pedido", "Nossa equipe confirma valores, acabamentos e prazos da sua seleção."]
];

const faq = [
  {
    q: "Quais tamanhos estão disponíveis?",
    a: "As medidas padrão são 40×60, 65×65, 65×100, 90×90, 80×120 e 90×144 cm. Também produzimos em medida personalizada."
  },
  {
    q: "Como envio os códigos que escolhi?",
    a: "Toque em “Minha seleção” e depois em compartilhar. Você escolhe o aplicativo e o contato que vai receber a imagem com os códigos."
  },
  {
    q: "Vocês atendem na minha loja?",
    a: "Sim. Fazemos atendimento presencial com o catálogo e simulamos o quadro na parede do cliente antes do pedido."
  },
  {
    q: "Onde fica a Imagem Fit?",
    a: "Rua São Paulo, 649, em Timbó (SC). Atendemos de segunda a sexta, das 8h às 17h, e aos sábados com horário marcado."
  }
];

export default function Parceiros() {
  return (
    <div className="min-h-screen bg-paper pb-24 pt-28 font-sans text-ink md:pt-32">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <p className="text-sm text-stone">Para lojistas</p>
          <h1 className="font-display mt-4 text-5xl font-semibold leading-[0.98] md:text-6xl">Mais opções para a sua loja, sem estoque parado.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone">
            Quadros, espelhos, obras autorais e produtos personalizados em um só catálogo, com atendimento feito por pessoas.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link to="/portfolio" className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass">
              Ver o catálogo <ArrowRight size={16} />
            </Link>
            <Link to="/contato" className="border-b border-ink/40 pb-1 text-sm font-semibold transition-colors hover:border-brass hover:text-brass">
              Falar com o comercial
            </Link>
          </div>
        </div>
        <figure className="overflow-hidden bg-line">
          <img src={HERO_IMAGE} alt="Dois quadros abstratos em uma sala" decoding="async" className="aspect-[4/3] w-full object-cover" />
        </figure>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-5 sm:px-8">
        <h2 className="font-display border-t border-line pt-10 text-4xl font-semibold md:text-5xl">O que você encontra</h2>
        <div className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3">
          {productLines.map((line) => (
            <Link key={line.title} to={line.to} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-line">
                <img src={line.image} alt={line.title} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-semibold">{line.title}</h3>
              <p className="mt-1 leading-relaxed text-stone">{line.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-24 border-y border-line bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">Como comprar</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map(([title, text], index) => (
              <li key={title} className="border-t-2 border-ink pt-5">
                <span className="text-sm font-semibold text-brass">Passo {index + 1}</span>
                <h3 className="font-display mt-2 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-stone">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="font-display text-4xl font-semibold md:text-5xl">Perguntas frequentes</h2>
          <p className="mt-4 text-lg leading-relaxed text-stone">Não encontrou o que procura? Fale com a nossa equipe.</p>
          <Link to="/contato" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-brass">
            Atendimento comercial <ArrowRight size={15} />
          </Link>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold">
                {item.q}
                <span className="text-2xl font-normal text-stone transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-stone">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

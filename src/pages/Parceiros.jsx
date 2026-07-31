import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Frame, Layers3, ListChecks, MapPin, Store } from "lucide-react";

const FACADE_IMAGE = `${import.meta.env.BASE_URL}company/imagem-fit-fachada.jpg`;
const ARTIST_IMAGE = `${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png`;
const PERSONALIZED_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;
const CATALOG_IMAGE = `${import.meta.env.BASE_URL}catalog/abstrato-estilo-pintura/AEP_00001.jpg`;

const benefits = [
  { icon: Layers3, title: "Portfólio diversificado", text: "Categorias decorativas, obras autorais, espelhos e produtos personalizados em um só catálogo." },
  { icon: ListChecks, title: "Seleção por código", text: "Escolha os modelos de interesse e envie uma lista organizada para o atendimento comercial." },
  { icon: Frame, title: "Opções sob consulta", text: "Converse com a equipe sobre medidas, materiais, acabamentos e molduras disponíveis para cada pedido." },
  { icon: Store, title: "Atendimento para lojistas", text: "Um contato direto para tirar dúvidas e encontrar as opções mais adequadas ao perfil da sua loja." }
];

const steps = [
  ["01", "Explore o catálogo", "Navegue pelas categorias e abra os produtos que combinam com o mix da sua loja."],
  ["02", "Monte sua seleção", "Adicione os códigos de interesse à seleção comercial enquanto compara os modelos."],
  ["03", "Compartilhe a seleção", "Escolha o aplicativo e o contato que deve receber as imagens, códigos e categorias."],
  ["04", "Confirme o pedido", "Receba as informações comerciais, opções disponíveis e prazos referentes à sua seleção."]
];

const productLines = [
  { title: "Quadros decorativos", text: "Coleções organizadas por estilos para ampliar as possibilidades de escolha da sua loja.", image: CATALOG_IMAGE, to: "/portfolio" },
  { title: "Obras autorais", text: "Pinturas manuais e composições tridimensionais com assinatura de Almir Gonçalves.", image: ARTIST_IMAGE, to: "/artista" },
  { title: "Retratos personalizados", text: "Arte abstrata criada a partir da fotografia enviada pelo cliente da sua loja.", image: PERSONALIZED_IMAGE, to: "/" }
];

export default function Parceiros() {
  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <section className="relative flex min-h-[670px] items-end overflow-hidden bg-[#090909] px-6 pb-20 pt-32 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(184,142,53,0.16),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(184,142,53,0.08),transparent_38%)]" />
        <div className="absolute inset-y-0 right-[18%] w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent" />
        <div className="absolute right-[10%] top-[18%] h-52 w-52 rotate-45 border border-gold/10 sm:h-72 sm:w-72" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/50" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 border border-gold/45 bg-black/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold backdrop-blur-sm">
              <Store size={13} /> Exclusivo para lojistas
            </span>
            <h1 className="mt-7 font-heading text-5xl font-semibold leading-[0.98] text-white sm:text-6xl lg:text-[5.4rem]">
              Um catálogo pensado para fortalecer o <span className="italic text-gold">mix da sua loja.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
              Encontre quadros, espelhos, obras autorais e produtos personalizados. Escolha por código e fale diretamente com nossa equipe para conhecer as opções comerciais de cada seleção.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/portfolio" className="inline-flex items-center justify-center gap-3 bg-gold px-7 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-[#c9a85d]">
                Explorar catálogo <ArrowRight size={14} />
              </Link>
              <Link to="/contato" className="inline-flex items-center justify-center gap-3 border border-white/30 bg-black/30 px-7 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm transition-colors hover:border-gold hover:text-gold">
                Contato comercial <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">Parceria comercial</span>
            <h2 className="mt-4 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">Mais opções para sua loja, com atendimento próximo.</h2>
          </div>
          <div className="grid grid-cols-1 border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <motion.article key={benefit.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }} className="border-b border-white/10 p-6 sm:border-r lg:border-b-0 lg:p-7 last:border-b-0 last:border-r-0">
                <benefit.icon size={21} className="text-gold" strokeWidth={1.5} />
                <h3 className="mt-5 font-heading text-xl font-semibold text-white">{benefit.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-white/50">{benefit.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#e9e1d4] px-6 py-20 text-[#171512] md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#896727]">Como comprar</span>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight sm:text-5xl">Do catálogo ao pedido comercial.</h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-black/60">Um caminho simples para sua loja organizar referências e conversar com nossa equipe sem perder códigos pelo caminho.</p>
          </div>
          <div className="divide-y divide-black/15 border-y border-black/15">
            {steps.map(([number, title, text]) => (
              <div key={number} className="grid grid-cols-[52px_1fr] gap-4 py-6 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:gap-6">
                <span className="font-heading text-3xl italic text-[#9b742b]">{number}</span>
                <div>
                  <h3 className="font-heading text-2xl font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-black/55">{text}</p>
                </div>
                <CheckCircle2 className="hidden text-[#9b742b] sm:block" size={20} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-gold">Linhas de produto</span>
              <h2 className="mt-4 font-heading text-4xl font-semibold text-white sm:text-5xl">Possibilidades para diferenciar seu mix.</h2>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {productLines.map((line) => (
              <Link key={line.title} to={line.to} className="group overflow-hidden border border-white/10 bg-[#151515] transition-colors hover:border-gold/50">
                <div className="h-72 overflow-hidden bg-black/30">
                  <img src={line.image} alt={line.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-heading text-2xl font-semibold text-white">{line.title}</h3>
                    <ArrowRight size={16} className="shrink-0 text-gold" />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/48">{line.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="grid grid-cols-2 gap-4">
            <img src={FACADE_IMAGE} alt="Fachada da Imagem Fit Quadros em Timbó" loading="lazy" className="mt-12 aspect-[4/5] w-full object-cover" />
            <img src={GALLERY_IMAGE} alt="Espaço da Imagem Fit Quadros" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-3 text-gold">
              <MapPin size={15} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em]">Timbó, Santa Catarina</span>
            </div>
            <h2 className="mt-5 font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">Uma empresa real, presente no atendimento da sua loja.</h2>
            <p className="mt-6 text-sm leading-relaxed text-white/58">A Imagem Fit reúne catálogo, espaço físico e atendimento comercial para ajudar lojistas a escolher referências e consultar as opções disponíveis para cada pedido.</p>
            <Link to="/portfolio" className="mt-8 inline-flex items-center gap-3 bg-gold px-7 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-[#c9a85d]">
              Montar uma seleção <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

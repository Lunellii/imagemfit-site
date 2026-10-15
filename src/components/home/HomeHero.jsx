import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const catalogBase = `${import.meta.env.BASE_URL}catalog/`;
const MAIN_IMAGE = `${catalogBase}arvores/NAT_00001.jpg`;
const DETAIL_IMAGE = `${catalogBase}espelhos/SIMU_1562.jpg`;

export default function HomeHero() {
  return (
    <section className="bg-paper px-5 pb-16 pt-28 text-ink sm:px-8 md:pb-24 md:pt-36">
      <div className="mx-auto grid max-w-7xl items-end gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:pb-10">
          <p className="text-sm text-stone">Catálogo para lojistas · Timbó, SC</p>
          <h1 className="font-display mt-5 text-[2.9rem] font-semibold leading-[0.98] sm:text-6xl lg:text-[4.6rem]">
            Quadros e espelhos para o mix da sua loja.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-stone">
            Escolha pelo código, monte sua seleção e envie para quem quiser. A gente cuida da produção e do atendimento.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass"
            >
              Ver o catálogo <ArrowRight size={16} />
            </Link>
            <Link to="/parceiros" className="border-b border-ink/40 pb-1 text-sm font-semibold transition-colors hover:border-brass hover:text-brass">
              Como funciona para lojistas
            </Link>
          </div>
        </div>

        <div className="relative">
          <figure className="overflow-hidden bg-line">
            <img src={MAIN_IMAGE} alt="Dois quadros da categoria Árvores em uma sala" decoding="async" className="aspect-[4/3] w-full object-cover" />
          </figure>
          <figure className="absolute -bottom-8 -left-4 hidden w-[34%] border-[6px] border-paper bg-paper shadow-[0_18px_40px_-20px_rgba(23,22,20,0.45)] sm:block lg:-left-10">
            <img src={DETAIL_IMAGE} alt="Espelho orgânico em ambiente" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
          </figure>
          <figcaption className="mt-3 text-right text-xs text-stone">
            Árvores · NAT 00001
          </figcaption>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl border-t border-line pt-5 md:mt-24">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8rem] uppercase tracking-[0.2em] text-stone">
          Humaniza <span className="text-brass" aria-hidden="true">·</span> Personaliza <span className="text-brass" aria-hidden="true">·</span> Decora
        </p>
      </div>
    </section>
  );
}

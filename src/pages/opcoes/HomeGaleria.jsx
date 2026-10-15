import { useState } from "react";
import { Link } from "react-router-dom";
import { useRecentCategories } from "@/hooks/useRecentCategories";
import { getCategoryLink } from "@/components/portfolio/CategoryGrid";

const base = import.meta.env.BASE_URL;
const HERO_IMAGE = `${base}catalog/arvores/NAT_00001.jpg`;
const TRUCK_IMAGE = `${base}company/imagem-fit-fachada.jpg?v=20261015`;
const ORIGINAL_IMAGE = `${base}special/familia-foto-original.jpeg`;
const ARTWORK_IMAGE = `${base}special/familia-arte-abstrata.jpg`;
const ARTIST_PHOTO = `${base}artist/almir-donizete-goncalves.png`;

const steps = [
  ["Escolha no catálogo", "Cada peça tem um código. Abra as que combinam com a sua loja."],
  ["Monte a seleção", "Junte os códigos e, se quiser, a medida de cada quadro."],
  ["Envie para quem quiser", "Compartilhe a seleção pelo aplicativo que preferir."]
];

export default function HomeGaleria() {
  const { categories, imagesByCategory } = useRecentCategories(8);
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="bg-paper font-sans text-ink">
      {/* Abertura: a foto ocupa a parede inteira e o título vem numa etiqueta de obra. */}
      <section className="relative pt-[72px]">
        <div className="reveal-curtain relative h-[78vh] min-h-[520px] overflow-hidden bg-line">
          <img src={HERO_IMAGE} alt="Dois quadros da categoria Árvores em uma sala clara" className="h-full w-full object-cover object-[50%_35%]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="-mt-40 max-w-xl bg-paper p-7 shadow-[0_30px_60px_-35px_rgba(29,29,27,0.55)] sm:-mt-52 sm:p-10">
            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">Quadros que vendem na parede da sua loja</h1>
            <p className="mt-5 text-lg font-light leading-relaxed text-stone">
              Catálogo de quadros, espelhos e obras autorais para lojistas. Você escolhe pelo código e envia a seleção para quem quiser.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line pt-6">
              <Link to="/portfolio" className="bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass">
                Ver o catálogo
              </Link>
              <p className="text-sm text-stone">Na foto: Árvores, NAT_00001</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias com peças novas, como uma sequência de obras na parede. */}
      <section className="mt-24">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-5 sm:px-8">
          <h2 className="font-display text-4xl font-extrabold md:text-5xl">Chegou agora</h2>
          <Link to="/portfolio" className="border-b border-ink pb-0.5 text-sm font-semibold">Todas as categorias</Link>
        </div>
        <div className="mt-10 flex snap-x gap-6 overflow-x-auto px-5 pb-4 scrollbar-hide sm:px-8 lg:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))]">
          {categories.map((category) => {
            const cover = (imagesByCategory[category.id] || [])[0];
            return (
              <Link key={category.id} to={getCategoryLink(category)} className="group w-[72vw] shrink-0 snap-start sm:w-[22rem]">
                <div className="aspect-[4/3] overflow-hidden bg-line">
                  {cover ? <img src={cover.image_url} alt={`${category.name}: ${cover.code}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : null}
                </div>
                <div className="mt-4 border-l-2 border-brass pl-3">
                  <h3 className="font-display text-2xl font-bold leading-tight">{category.name}</h3>
                  {cover?.code ? <p className="mt-0.5 text-sm text-stone">Mais recente: {cover.code}</p> : null}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-28 max-w-7xl px-5 sm:px-8">
        <h2 className="font-display max-w-lg text-4xl font-extrabold leading-tight md:text-5xl">Do catálogo ao pedido</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map(([title, text], index) => (
            <li key={title} className="grid grid-cols-[auto_1fr] gap-5">
              <span className="font-display text-6xl font-normal leading-none text-brass">{index + 1}</span>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 font-light leading-relaxed text-stone">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-28">
        <img src={TRUCK_IMAGE} alt="Caminhão da Imagem Fit Quadros ao entardecer" loading="lazy" className="h-[60vh] min-h-[320px] w-full object-cover object-[50%_60%]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16">
          <h2 className="font-display text-4xl font-extrabold leading-tight md:text-5xl">O catálogo vai até a sua loja</h2>
          <div className="space-y-4 text-lg font-light leading-relaxed text-stone">
            <p>Levamos as peças no nosso caminhão e simulamos o quadro na parede do cliente antes do pedido.</p>
            <p>Atendemos de segunda a sexta, das 8h às 17h, na Rua São Paulo, 649, em Timbó (SC).</p>
            <Link to="/parceiros" className="inline-block border-b border-ink pb-0.5 text-base font-semibold text-ink">Como funciona para lojistas</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-16 border-t border-line px-5 py-20 sm:px-8 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/3] overflow-hidden bg-white">
            <img src={showOriginal ? ORIGINAL_IMAGE : ARTWORK_IMAGE} alt={showOriginal ? "Foto enviada pelo cliente" : "Quadro criado a partir da foto"} loading="lazy" className="h-full w-full object-contain" />
          </div>
          <div className="mt-3 flex gap-5 text-sm" role="group" aria-label="Comparar foto e quadro">
            <button type="button" onClick={() => setShowOriginal(true)} aria-pressed={showOriginal} className={showOriginal ? "border-b-2 border-ink font-semibold" : "text-stone"}>Foto enviada</button>
            <button type="button" onClick={() => setShowOriginal(false)} aria-pressed={!showOriginal} className={!showOriginal ? "border-b-2 border-ink font-semibold" : "text-stone"}>Quadro final</button>
          </div>
          <h2 className="font-display mt-8 text-3xl font-extrabold leading-tight md:text-4xl">A foto do cliente vira um quadro</h2>
          <p className="mt-3 font-light leading-relaxed text-stone">A loja envia a fotografia, nós criamos a arte e produzimos em canvas com moldura flutuante. Sem estoque parado.</p>
        </div>
        <div>
          <div className="aspect-[4/3] overflow-hidden bg-line">
            <img src={ARTIST_PHOTO} alt="Almir Gonçalves no ateliê" loading="lazy" className="h-full w-full object-cover object-[50%_20%]" />
          </div>
          <h2 className="font-display mt-[4.25rem] text-3xl font-extrabold leading-tight md:text-4xl">Obras assinadas por Almir Gonçalves</h2>
          <p className="mt-3 font-light leading-relaxed text-stone">Pinturas manuais e peças tridimensionais para quem procura algo que nenhuma outra loja tem.</p>
          <Link to="/artista" className="mt-5 inline-block border-b border-ink pb-0.5 text-sm font-semibold">Ver as obras</Link>
        </div>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useRecentCategories } from "@/hooks/useRecentCategories";
import { getCategoryLink } from "@/components/portfolio/CategoryGrid";
import { getCategoryPath } from "@/utils/categoryText";

const base = import.meta.env.BASE_URL;
const wall = `${base}home/parede/`;
const TRUCK_IMAGE = `${base}company/imagem-fit-fachada.jpg?v=20261015`;
const ARTWORK_IMAGE = `${base}special/familia-arte-abstrata.jpg`;
const ARTIST_PHOTO = `${base}artist/almir-donizete-goncalves.png`;

// Composição da parede (posições em % do quadro de 3:2). Peças reais do catálogo, recortadas dos ambientes.
const FRAMES = [
  { src: "mar-00001.jpg", code: "MAR_00001", category: "Mar e Praia", left: 0, top: 12, width: 24, tilt: "-2deg" },
  { src: "urb-00006.jpg", code: "URB_00006", category: "Urbano", left: 27, top: 0, width: 28, tilt: "1.5deg" },
  { src: "vid-00001.jpg", code: "VID_00001", category: "Vida", left: 58, top: 6, width: 19, tilt: "-1deg" },
  { src: "abs-00003.jpg", code: "ABS_00003", category: "Abstrato Geométrico", left: 58, top: 54, width: 19, tilt: "2deg" },
  { src: "nat-00001.jpg", code: "NAT_00001", category: "Árvores", left: 80, top: 20, width: 20, tilt: "-1.5deg" }
];

const pillars = [
  { word: "Humaniza", title: "Atendimento feito por pessoas", text: "O caminhão leva o catálogo até a sua loja e a gente simula o quadro na parede do cliente.", image: TRUCK_IMAGE, to: "/parceiros", fit: "object-cover object-[35%_60%]" },
  { word: "Personaliza", title: "A foto do cliente vira quadro", text: "A loja envia a fotografia, nós criamos a arte e produzimos em canvas.", image: ARTWORK_IMAGE, to: "/contato", fit: "object-contain bg-white" },
  { word: "Decora", title: "Obras de Almir Gonçalves", text: "Pinturas manuais e peças tridimensionais assinadas pelo artista.", image: ARTIST_PHOTO, to: "/artista", fit: "object-cover object-[50%_20%]" }
];

const plaster = {
  backgroundImage:
    "radial-gradient(ellipse 60% 45% at 68% 18%, rgb(255 244 214 / 0.16), transparent 70%), radial-gradient(ellipse 80% 60% at 20% 100%, rgb(0 0 0 / 0.28), transparent 70%), url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
};

export default function HomeParede() {
  const { categories, imagesByCategory } = useRecentCategories(3);

  return (
    <div className="bg-paper font-sans text-ink">
      <section className="bg-wall pb-16 pt-28 text-paper md:pb-24 md:pt-36" style={plaster}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <h1 className="font-display text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem]">A parede da sua loja começa aqui</h1>
            <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-paper/80">
              Quadros, espelhos e obras autorais para lojistas. Cada peça tem um código: escolha, monte a seleção e envie para quem quiser.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link to="/portfolio" className="bg-brass px-7 py-4 text-sm font-semibold text-ink transition-colors hover:bg-paper">
                Ver o catálogo
              </Link>
              <Link to="/parceiros" className="border-b border-paper/50 pb-0.5 text-sm font-semibold transition-colors hover:border-paper">
                Como funciona para lojistas
              </Link>
            </div>
          </div>

          <div className="relative aspect-[3/2] w-full" role="list" aria-label="Peças do catálogo na parede">
            {FRAMES.map((frame, index) => (
              <Link
                key={frame.code}
                to={getCategoryPath({ name: frame.category })}
                role="listitem"
                aria-label={`${frame.code}, categoria ${frame.category}`}
                className="hang-frame group absolute block border-[5px] border-[#1c1a17] bg-[#1c1a17] shadow-[0_22px_32px_-14px_rgba(0,0,0,0.75)] transition-transform duration-300 hover:-translate-y-1"
                style={{ left: `${frame.left}%`, top: `${frame.top}%`, width: `${frame.width}%`, "--i": index, "--tilt": frame.tilt }}
              >
                <img src={`${wall}${frame.src}`} alt="" className="block h-auto w-full" />
                <span className="absolute -bottom-7 left-0 whitespace-nowrap text-xs text-paper/0 transition-colors group-hover:text-paper/80 group-focus-visible:text-paper/80">
                  {frame.code}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-4xl md:text-5xl">Acabou de chegar</h2>
          <Link to="/portfolio" className="border-b border-ink pb-0.5 text-sm font-semibold">Todas as categorias</Link>
        </div>
        <div className="mt-12 space-y-16 md:space-y-20">
          {categories.map((category, index) => {
            const images = imagesByCategory[category.id] || [];
            const cover = images[0];
            return (
              <Link key={category.id} to={getCategoryLink(category)} className="group grid items-center gap-6 md:grid-cols-2 md:gap-14">
                <div className={`aspect-[4/3] overflow-hidden bg-line ${index % 2 ? "md:order-2" : ""}`}>
                  {cover ? <img src={cover.image_url} alt={`${category.name}: ${cover.code}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : null}
                </div>
                <div>
                  <h3 className="font-display text-4xl md:text-5xl">{category.name}</h3>
                  {category.description ? <p className="mt-4 max-w-md text-lg font-light leading-relaxed text-stone">{category.description}</p> : null}
                  {images.length > 1 ? (
                    <div className="mt-6 flex gap-2">
                      {images.slice(1, 5).map((image) => (
                        <img key={image.id} src={image.image_url} alt="" loading="lazy" className="h-14 w-[4.7rem] object-cover" />
                      ))}
                    </div>
                  ) : null}
                  <span className="mt-6 inline-block border-b border-ink pb-0.5 text-sm font-semibold">Ver {category.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line bg-white px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-3 md:gap-8">
          {pillars.map((pillar) => (
            <Link key={pillar.word} to={pillar.to} className="group block">
              <p className="font-display text-5xl text-brass lg:text-6xl">{pillar.word}</p>
              <div className="mt-6 aspect-[4/3] overflow-hidden bg-line">
                <img src={pillar.image} alt={pillar.title} loading="lazy" className={`h-full w-full ${pillar.fit}`} />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-2 font-light leading-relaxed text-stone">{pillar.text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:py-24">
        <h2 className="font-display text-4xl md:text-5xl">Como comprar</h2>
        <ol className="divide-y divide-line border-y border-line">
          {[
            ["Escolha no catálogo", "Abra as peças que combinam com a sua loja. Cada uma tem um código."],
            ["Monte a seleção", "Toque em Selecionar e, se quiser, escolha a medida."],
            ["Envie para quem quiser", "Em Minha seleção, compartilhe pelo aplicativo e com o contato que preferir."]
          ].map(([title, text], index) => (
            <li key={title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6">
              <span className="font-display text-3xl text-brass">{index + 1}</span>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 font-light leading-relaxed text-stone">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

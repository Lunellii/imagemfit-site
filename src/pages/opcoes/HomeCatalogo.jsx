import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ListPlus, Search } from "lucide-react";
import { useRecentCategories } from "@/hooks/useRecentCategories";
import { useLatestImages } from "@/hooks/useLatestImages";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/components/ui/use-toast";
import { getCategoryLink } from "@/components/portfolio/CategoryGrid";
import ProductQuickView from "@/components/portfolio/ProductQuickView";

const base = import.meta.env.BASE_URL;
const TRUCK_IMAGE = `${base}company/imagem-fit-fachada.jpg?v=20261015`;
const ARTWORK_IMAGE = `${base}special/familia-arte-abstrata.jpg`;
const ARTIST_PHOTO = `${base}artist/almir-donizete-goncalves.png`;

const openSearch = () => window.dispatchEvent(new CustomEvent("ifq:open-search"));

export default function HomeCatalogo() {
  const { categories } = useRecentCategories(12);
  const latest = useLatestImages(8);
  const { addItem, isInCart } = useCart();
  const [openImage, setOpenImage] = useState(null);

  const select = (image) => {
    if (isInCart(image.id)) return;
    addItem({ id: image.id, code: image.code, title: image.title, image_url: image.image_url, category: image.category_name });
    toast({ title: `${image.code} adicionado à seleção` });
  };

  return (
    <div className="bg-paper font-sans text-ink">
      <section className="bg-wall px-5 pb-12 pt-28 sm:px-8 md:pb-16 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display max-w-4xl text-[2.7rem] font-black uppercase leading-[0.92] sm:text-7xl lg:text-[5.6rem]">Quadros para revender</h1>
          <p className="mt-5 max-w-xl text-xl font-light leading-snug">Encontre pelo código, junte numa seleção e mande para quem fecha o pedido.</p>

          <button
            type="button"
            onClick={openSearch}
            className="mt-9 flex h-16 w-full max-w-3xl items-center gap-4 border-2 border-ink bg-paper px-5 text-left text-lg text-stone transition-shadow hover:shadow-[6px_6px_0_0_rgb(var(--c-ink))]"
          >
            <Search size={22} className="shrink-0 text-ink" />
            Buscar código, categoria ou nome
          </button>

          <nav className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categorias com novidades">
            {categories.map((category) => (
              <Link key={category.id} to={getCategoryLink(category)} className="shrink-0 border-2 border-ink px-4 py-2 text-sm font-semibold transition-colors hover:bg-ink hover:text-wall">
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-black uppercase md:text-5xl">Novidades</h2>
          <Link to="/portfolio" className="text-sm font-semibold underline underline-offset-4">Ver catálogo completo</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {latest.map((image) => {
            const selected = isInCart(image.id);
            return (
              <article key={image.id}>
                <button type="button" onClick={() => setOpenImage(image)} className="block aspect-[4/3] w-full overflow-hidden bg-line" aria-label={`Ver detalhes de ${image.code}`}>
                  <img src={image.image_url} alt={image.code} loading="lazy" className="h-full w-full object-cover" />
                </button>
                <p className="mt-3 text-lg font-bold tabular-nums">{image.code}</p>
                <p className="text-sm text-stone">{image.category_name}</p>
                <button
                  type="button"
                  onClick={() => select(image)}
                  className={`mt-3 flex h-11 w-full items-center justify-center gap-2 text-sm font-bold transition-colors ${selected ? "bg-wall text-ink" : "bg-ink text-paper hover:bg-wall hover:text-ink"}`}
                >
                  {selected ? <Check size={17} /> : <ListPlus size={17} />}
                  {selected ? "Na seleção" : "Selecionar"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-ink px-5 py-14 text-paper sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[auto_1fr_1fr_1fr] md:items-start md:gap-10">
          <h2 className="font-display text-3xl font-black uppercase leading-none text-wall">Como comprar</h2>
          {[
            ["Escolha", "Abra as peças e anote os códigos que interessam."],
            ["Selecione", "Toque em Selecionar. A lista fica salva enquanto você navega."],
            ["Envie", "Em Minha seleção, compartilhe com o contato que preferir."]
          ].map(([title, text], index) => (
            <div key={title}>
              <p className="text-lg font-bold">
                {index + 1}. {title}
              </p>
              <p className="mt-1 font-light leading-relaxed text-paper/75">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <img src={TRUCK_IMAGE} alt="Caminhão da Imagem Fit Quadros" loading="lazy" className="h-72 w-full object-cover object-[35%_60%] md:h-full" />
        <div className="px-5 py-14 sm:px-10 md:py-20">
          <h2 className="font-display text-3xl font-black uppercase leading-none md:text-5xl">Atendimento na sua loja</h2>
          <p className="mt-5 max-w-md text-lg font-light leading-relaxed">O caminhão leva o catálogo até você e a gente simula o quadro na parede do cliente antes do pedido.</p>
          <ul className="mt-6 space-y-2 text-lg">
            <li className="border-l-4 border-wall pl-3">Seg. a sex., 8h às 17h</li>
            <li className="border-l-4 border-wall pl-3">Rua São Paulo, 649, Timbó (SC)</li>
            <li className="border-l-4 border-wall pl-3">(47) 99927-3809</li>
          </ul>
          <Link to="/contato" className="mt-8 inline-block bg-ink px-7 py-4 text-sm font-bold text-paper transition-colors hover:bg-wall hover:text-ink">Falar com o comercial</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        {[
          { title: "Retrato personalizado", text: "A foto do cliente vira um quadro em canvas. Produzido sob encomenda.", image: ARTWORK_IMAGE, to: "/parceiros", fit: "object-contain bg-white" },
          { title: "Obras de Almir Gonçalves", text: "Pinturas manuais e peças tridimensionais assinadas.", image: ARTIST_PHOTO, to: "/artista", fit: "object-cover object-[50%_20%]" }
        ].map((line) => (
          <Link key={line.title} to={line.to} className="group grid grid-cols-[40%_1fr] border-2 border-ink transition-shadow hover:shadow-[6px_6px_0_0_rgb(var(--c-ink))]">
            <img src={line.image} alt={line.title} loading="lazy" className={`h-full min-h-48 w-full ${line.fit}`} />
            <div className="flex flex-col justify-center p-5 sm:p-7">
              <h3 className="font-display text-2xl font-black uppercase leading-none">{line.title}</h3>
              <p className="mt-3 font-light leading-relaxed text-stone">{line.text}</p>
            </div>
          </Link>
        ))}
      </section>

      <ProductQuickView image={openImage} categoryName={openImage?.category_name || ""} onClose={() => setOpenImage(null)} />
    </div>
  );
}

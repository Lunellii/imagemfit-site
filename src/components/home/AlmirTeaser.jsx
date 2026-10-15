import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ARTIST_PHOTO = `${import.meta.env.BASE_URL}artist/almir-donizete-goncalves.png`;

export default function AlmirTeaser() {
  return (
    <section className="bg-paper px-5 py-16 text-ink sm:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <figure className="mx-auto w-full max-w-md overflow-hidden bg-line md:max-w-none">
          <img src={ARTIST_PHOTO} alt="Almir Donizete Gonçalves" loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover object-top" />
        </figure>

        <div>
          <p className="text-sm font-semibold text-brass">Obras autorais</p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-tight md:text-6xl">Almir Gonçalves</h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
            Pinturas manuais e composições tridimensionais assinadas pelo artista. São peças com textura e presença, para clientes que procuram algo único.
          </p>
          <Link to="/artista" className="mt-8 inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass">
            Conhecer a linha autoral <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

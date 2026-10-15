import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const ORIGINAL_IMAGE = `${import.meta.env.BASE_URL}special/familia-foto-original.jpeg`;
const ARTWORK_IMAGE = `${import.meta.env.BASE_URL}special/familia-arte-abstrata.jpg`;

const details = [
  "Produção sob encomenda, sem estoque parado",
  "Arte criada a partir da foto do cliente",
  "Canvas com moldura flutuante, pronto para venda"
];

export default function PersonalizedFamilyArt() {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <section className="bg-white px-5 py-16 text-ink sm:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden bg-paper">
            <img
              key={showOriginal ? "original" : "artwork"}
              src={showOriginal ? ORIGINAL_IMAGE : ARTWORK_IMAGE}
              alt={showOriginal ? "Fotografia original enviada pelo cliente" : "Quadro personalizado criado a partir da fotografia"}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-4 inline-flex border border-ink text-sm" role="group" aria-label="Comparar foto e arte">
            <button type="button" onClick={() => setShowOriginal(true)} aria-pressed={showOriginal} className={`px-5 py-2.5 font-semibold transition-colors ${showOriginal ? "bg-ink text-paper" : "hover:bg-paper"}`}>
              Foto enviada
            </button>
            <button type="button" onClick={() => setShowOriginal(false)} aria-pressed={!showOriginal} className={`px-5 py-2.5 font-semibold transition-colors ${!showOriginal ? "bg-ink text-paper" : "hover:bg-paper"}`}>
              Quadro final
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-brass">Produto personalizado</p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-tight md:text-5xl">Uma foto do cliente vira um quadro exclusivo.</h2>
          <p className="mt-6 text-lg leading-relaxed text-stone">A loja envia a fotografia e a Imagem Fit cuida da criação artística e da produção.</p>
          <ul className="mt-7 space-y-3">
            {details.map((detail) => (
              <li key={detail} className="flex gap-3 leading-relaxed">
                <span className="mt-[0.6em] h-px w-4 shrink-0 bg-brass" />
                {detail}
              </li>
            ))}
          </ul>
          <Link to="/parceiros" className="mt-8 inline-flex items-center gap-2 border-b border-ink/40 pb-1 text-sm font-semibold transition-colors hover:border-brass hover:text-brass">
            Saber como funciona <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

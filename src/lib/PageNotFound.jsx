import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="flex min-h-screen items-center bg-paper px-5 pb-24 pt-32 font-sans text-ink sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm text-stone">Erro 404</p>
        <h1 className="font-display mt-3 max-w-2xl text-5xl font-semibold leading-none md:text-6xl">Esta página não existe.</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone">O endereço pode ter mudado. Você encontra todas as peças no catálogo.</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link to="/portfolio" className="inline-flex items-center gap-3 bg-ink px-7 py-4 text-sm font-semibold text-paper transition-colors hover:bg-brass">
            Ver o catálogo <ArrowRight size={16} />
          </Link>
          <Link to="/" className="border-b border-ink/40 pb-1 text-sm font-semibold transition-colors hover:border-brass hover:text-brass">
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
